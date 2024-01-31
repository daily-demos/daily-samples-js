/**
 * Class managing Daily.co call functionalities including joining, leaving,
 * handling audio/video tracks and UI updates for track states.
 */
class DailyCallManager {
  constructor() {
    this.call = DailyIframe.createCallObject();
    this.isCameraMuted = null;
    this.isMicMuted = null;
    this.currentRoomUrl = null;
    this.initialize();
  }

  /**
   * Performs initial setup of event listeners and UI component interactions.
   */
  async initialize() {
    await this.setupEventListeners();
    document
      .getElementById('toggle-camera')
      .addEventListener('click', () => this.toggleCamera());
    document
      .getElementById('toggle-mic')
      .addEventListener('click', () => this.toggleMicrophone());
  }

  /**
   * Configures event listeners for various call-related events.
   */
  async setupEventListeners() {
    // Initial set of events with unique handlers
    const events = {
      'active-speaker-change': this.handleActiveSpeakerChange.bind(this),
      error: this.handleError.bind(this),
      'joined-meeting': this.handleJoin.bind(this),
      'left-meeting': this.handleLeave.bind(this),
    };

    // Handling participant-* events with a single operation
    const participantEvents = [
      'participant-joined',
      'participant-left',
      'participant-updated',
    ];

    // Registering participant related events with the same handler
    participantEvents.forEach((event) => {
      events[event] = this.handleNewParticipantState.bind(this);
    });

    // Register the event handlers with the call object
    Object.entries(events).forEach(([event, handler]) => {
      this.call.on(event, handler);
    });
  }

  /**
   * Handler for the local participant joining:
   * - Prints the room URL
   * - Enables the toggle camera and mic buttons
   * - Gets the initial track states
   * - Sets up the device selectors
   * - Initializes the camera and mic on/off states
   */
  handleJoin() {
    console.log(`Successfully joined: ${this.currentRoomUrl}`);

    // Enable the toggle camera and mic buttons and selectors
    document.getElementById('toggle-camera').disabled = false;
    document.getElementById('toggle-mic').disabled = false;
    document.getElementById('camera-selector').disabled = false;
    document.getElementById('mic-selector').disabled = false;

    // Set up the camera and mic selectors
    this.setupDeviceSelectors();

    // Initialize the camera and microphone on/off states
    this.updateUiForDevicesState();
  }

  /**
   * Handler for participant leave events:
   * - Confirms leaving with a console message
   * - Disable the toggle camera and mic buttons
   * - Resets the camera and mic selectors
   * - Updates the call state in the UI
   * - Removes all video containers
   */
  handleLeave() {
    console.log('Successfully left the call');

    // Disable the toggle camera and mic buttons
    document.getElementById('toggle-camera').disabled = true;
    document.getElementById('toggle-mic').disabled = true;

    // Reset and disable the camera and mic selectors
    const cameraSelector = document.getElementById('camera-selector');
    const micSelector = document.getElementById('mic-selector');
    cameraSelector.selectedIndex = 0;
    micSelector.selectedIndex = 0;
    cameraSelector.disabled = true;
    micSelector.disabled = true;

    // Update the call state in the UI
    document.getElementById('camera-state').textContent = 'Camera: Off';
    document.getElementById('mic-state').textContent = 'Mic: Off';
    document.getElementById(
      'participant-count'
    ).textContent = `Participants: 0`;
    document.getElementById(
      'active-speaker'
    ).textContent = `Active Speaker: None`;

    // Remove all video containers
    const videosDiv = document.getElementById('videos');
    while (videosDiv.firstChild) {
      videosDiv.removeChild(videosDiv.firstChild);
    }
  }

  /**
   * Handles errors emitted from the Daily call object.
   * @param {Object} e - The error event object.
   */
  handleError(e) {
    console.error('DAILY SENT AN ERROR!', e);
    if (e.error?.details?.sourceError) {
      console.log('Original Error', e.error?.details?.sourceError);
    }
  }

  /**
   * Handles participant-joined, participant-updated, and participant-left events:
   * - Updates the participant count
   * - Adds or removes video and audio tracks for the participant based on the event and track state
   * @param {Object} event - The participant-* event object.
   */
  handleNewParticipantState(event) {
    // Update the participant count
    this.updateAndDisplayParticipantCount();

    // Get the audio and video tracks and participant ID from the participant-* events
    const tracks = event.participant.tracks;
    const participant = event.participant;
    const participantId = participant.session_id;

    if (event.action === 'participant-left') {
      if (participant) {
        // Remove the video container if it exists
        const videoContainer = document.getElementById(
          `video-container-${participantId}`
        );
        if (videoContainer) {
          this.destroyTrack('video', participantId);
          videoContainer.remove();
        }

        // Remove the audio element if it exists
        const audioElement = document.getElementById(`audio-${participantId}`);
        if (audioElement) {
          this.destroyTrack('audio', participantId);
        }
      }
    } else {
      for (const trackType in tracks) {
        if (tracks[trackType].state === 'playable') {
          if (trackType === 'video') {
            this.displayVideo(tracks[trackType], participantId);
          } else if (trackType === 'audio') {
            this.playAudio(tracks[trackType], participant);
          } else {
            // Actions for screenVideo and screenAudio tracks if needed.
          }
        } else if (
          (tracks[trackType].state === 'off') |
          'interrupted' |
          'blocked'
        ) {
          if (trackType === 'audio' && participant.local) {
            // Do nothing for local client's audio track.
            return;
          } else {
            this.destroyTrack(trackType, participantId);
          }
        } else {
          // Other states are 'loading' and 'sendable'.
          // This is a placeholder for handling those states if needed.
          return;
        }
      }
    }
  }

  /**
   * Updates the UI with the current active speaker's identity.
   * @param {Object} event - The active speaker change event object.
   */
  handleActiveSpeakerChange(event) {
    document.getElementById(
      'active-speaker'
    ).textContent = `Active Speaker: ${event.activeSpeaker.peerId}`;
  }

  /**
   * Tries to join a call with provided room URL and optional join token.
   * @param {string} roomUrl - The URL of the room to join.
   * @param {string|null} joinToken - An optional token for joining the room.
   */
  async joinRoom(roomUrl, joinToken = null) {
    if (!roomUrl) {
      console.error('Room URL is required to join a room.');
      return;
    }

    this.currentRoomUrl = roomUrl;

    const joinOptions = { url: roomUrl };
    if (joinToken) {
      joinOptions.token = joinToken;
      console.log('Joining with a token.');
    } else {
      console.log('Joining without a token.');
    }

    try {
      await this.call.join(joinOptions);
    } catch (e) {
      console.error('Join failed:', e);
    }
  }

  /**
   * Adds a <video> element to the DOM and attaches the video track to it.
   * Also displays the session ID of the participant as an overlay.
   * If the video track is stopped, keeps the placeholder.
   * @param {Object} track - The video track object.
   * @param {string} participantId - The ID of the participant.
   */
  displayVideo(track, participantId) {
    let videoContainer = document.getElementById(
      `video-container-${participantId}`
    );

    // If a container for this participant doesn't exist, create it
    if (!videoContainer) {
      videoContainer = document.createElement('div');
      videoContainer.id = `video-container-${participantId}`; // Use participant ID for unique container ID
      videoContainer.className = 'video-container';
      videoContainer.style.backgroundColor = '#ccc'; // Set a gray background for the placeholder
      document.getElementById('videos').appendChild(videoContainer);

      const sessionIdText = document.createElement('div');
      sessionIdText.className = 'session-id-overlay';
      sessionIdText.textContent = participantId;
      videoContainer.appendChild(sessionIdText);
    }

    // Check if event track is active or not
    if (!track.state === 'playable') {
      if (videoContainer.querySelector('video')) {
        // If the video track is disabled but video element exists, clean up
        videoContainer.querySelector('video').srcObject = null; // Free up media resources
        // You might also want to change the placeholder style or add text/icon to indicate camera is off
      }
      return; // Exit without further processing if track is not active
    }

    // Create new video element and add to container if not exists or reuse existing one
    const videoEl =
      videoContainer.querySelector('video') || document.createElement('video');
    videoEl.className = 'video-element';
    if (!videoEl.parentElement) {
      videoContainer.appendChild(videoEl);
    }

    videoEl.style.width = '100%'; // Ensure the video occupies the full container width
    videoEl.srcObject = new MediaStream([track.persistentTrack]);
    videoEl.play();
  }

  /**
   * Adds an <audio> element to the DOM and attaches the audio track to it.
   * @param {Object} track - The audio track object.
   * @param {Object} participant - The track's participant object.
   */
  playAudio(track, participant) {
    if (participant.local) {
      return; // Avoid playing local audio
    }
    // Construct an element ID using the participant ID to uniquely identify audio elements
    const audioElementId = `audio-${participant.session_id}`;
    let audioEl = document.getElementById(audioElementId);

    if (!audioEl) {
      audioEl = document.createElement('audio'); // Create <audio> element if it doesn't exist
      audioEl.id = audioElementId; // Assign the constructed ID
      document.body.appendChild(audioEl); // Add <audio> element to DOM
    }

    // Whether newly created or existing, update the srcObject
    audioEl.srcObject = new MediaStream([track.persistentTrack]);
    audioEl.play();
  }

  /**
   * Removes a media element (audio or video) from the DOM for a specific participant
   * and ensures media resources are released by setting srcObject to null.
   * @param {Object} trackKind - The kind of track ('video' or 'audio').
   * @param {Object} participantId - The ID of the participant.
   */
  destroyTrack(trackKind, participantId) {
    if (trackKind === 'video') {
      const videoContainerSelector = `#video-container-${participantId}`;
      const videoContainer = document.querySelector(videoContainerSelector);
      if (videoContainer) {
        const videoEl = videoContainer.querySelector('video');
        if (videoEl) {
          videoEl.srcObject = null; // Release media resources
          videoContainer.removeChild(videoEl); // Remove the element from the DOM
        }
      }
    } else if (trackKind === 'audio') {
      const audioElementId = `audio-${participantId}`;
      const audioElement = document.getElementById(audioElementId);
      if (audioElement) {
        audioElement.srcObject = null; // Release media resources
        audioElement.remove(); // Remove the element from the DOM
      }
    }
  }

  /**
   * Toggles the local video track's mute state.
   */
  toggleCamera() {
    this.call.setLocalVideo(this.isCameraMuted);
    this.isCameraMuted = !this.isCameraMuted;
    this.updateUiForDevicesState();
  }

  /**
   * Toggles the local audio track's mute state.
   */
  toggleMicrophone() {
    this.call.setLocalAudio(this.isMicMuted);
    this.isMicMuted = !this.isMicMuted;
    this.updateUiForDevicesState();
  }

  /**
   * Updates the UI to reflect the current states of the local participant's camera and microphone.
   */
  updateUiForDevicesState() {
    document.getElementById('camera-state').textContent = `Camera: ${
      this.isCameraMuted ? 'Off' : 'On'
    }`;
    document.getElementById('mic-state').textContent = `Mic: ${
      this.isMicMuted ? 'Off' : 'On'
    }`;
  }

  /**
   * Sets up device selectors for cameras and microphones by populating
   * them with available devices and listening for changes in selection.
   */
  async setupDeviceSelectors() {
    // Fetch current input devices settings.
    const selectedDevices = await this.call.getInputDevices();
    // Destructure to extract deviceId for camera and mic
    const currentCameraDeviceId = selectedDevices.camera.deviceId;
    const currentMicDeviceId = selectedDevices.mic.deviceId;

    // Fetch an array of device information objects representing
    // the media input devices available on the system.
    const { devices } = await this.call.enumerateDevices();

    const cameraSelector = document.getElementById('camera-selector');
    const micSelector = document.getElementById('mic-selector');

    // Clear existing options in both selectors to prepare for fresh population.
    cameraSelector.innerHTML = '';
    micSelector.innerHTML = '';

    // Add non-selectable prompt options to each dropdown as the first option.
    const cameraPromptOption = new Option('Select a camera', '', true, true);
    cameraPromptOption.disabled = true;
    cameraSelector.appendChild(cameraPromptOption);

    const micPromptOption = new Option('Select a microphone', '', true, true);
    micPromptOption.disabled = true;
    micSelector.appendChild(micPromptOption);

    // Populate the selectors and set currently selected devices as selected
    devices.forEach((device) => {
      if (device.label) {
        const option = new Option(device.label, device.deviceId);

        if (device.kind === 'videoinput') {
          cameraSelector.appendChild(option);
          if (device.deviceId === currentCameraDeviceId) {
            option.selected = true;
          }
        } else if (device.kind === 'audioinput') {
          micSelector.appendChild(option);
          if (device.deviceId === currentMicDeviceId) {
            option.selected = true;
          }
        }
      }
    });

    // Attach event listeners to the selectors to handle device changes.
    this.addDeviceChangeListener(cameraSelector, 'video');
    this.addDeviceChangeListener(micSelector, 'audio');
  }

  /**
   * Attaches a change event listener to a device selector.
   * This listener updates the currently selected device
   * for video or audio based on user selection.
   *
   * @param {HTMLElement} selector - The <select> element for choosing a device.
   * @param {string} deviceType - The type of device, either 'video' for cameras or 'audio' for microphones.
   */
  addDeviceChangeListener(selector, deviceType) {
    selector.addEventListener('change', (e) => {
      const deviceId = e.target.value;
      const deviceOptions = { [`${deviceType}DeviceId`]: deviceId };
      this.call.setInputDevicesAsync(deviceOptions);
    });
  }

  /**
   * Updates the UI with the current number of participants.
   * This method combines getting the participant count and updating the UI.
   */
  updateAndDisplayParticipantCount() {
    const participantCount = Object.keys(this.call.participants()).length;
    document.getElementById(
      'participant-count'
    ).textContent = `Participants: ${participantCount}`;
  }

  /**
   * Leaves the call and performs necessary cleanup operations like removing video elements.
   */
  async leave() {
    try {
      await this.call.leave();
      document.querySelectorAll('#videos video, audio').forEach((el) => {
        el.srcObject = null; // Release media resources
        el.remove(); // Remove the element from the DOM
      });
    } catch (e) {
      console.error('Leaving failed', e);
    }
  }
}

/**
 * Main entry point: Setup and event listener bindings after the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const dailyCallManager = new DailyCallManager();

  // Bind the join call action to the join button.
  document
    .getElementById('join-btn')
    .addEventListener('click', async function () {
      const roomUrl = document.getElementById('room-url').value.trim();
      const joinToken =
        document.getElementById('join-token').value.trim() || null;
      await dailyCallManager.joinRoom(roomUrl, joinToken);
    });

  // Bind the leave call action to the leave button.
  document.getElementById('leave-btn').addEventListener('click', function () {
    dailyCallManager.leave();
  });
});
