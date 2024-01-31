/**
 * Initializes a new instance of the `DailyCallManager` class, creating
 * a Daily.co call object and setting initial states for camera and
 * microphone muting, as well as the current room URL. It then calls the
 * `initialize` method to set up event listeners and UI interactions.
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
    const events = {
      'active-speaker-change': this.handleActiveSpeakerChange.bind(this),
      error: this.handleError.bind(this),
      'joined-meeting': this.handleJoin.bind(this),
      'left-meeting': this.handleLeave.bind(this),
      'participant-left': this.handleParticipantLeft.bind(this),
    };

    const participantEvents = ['participant-joined', 'participant-updated'];

    participantEvents.forEach((event) => {
      events[event] = this.handleParticipantJoinedOrUpdated.bind(this);
    });

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
   * @param {Object} event - The joined-meeting event object.
   */
  handleJoin(event) {
    const tracks = event.participants.local.tracks;

    console.log(`Successfully joined: ${this.currentRoomUrl}`);

    // Update the join and leave button states
    document.getElementById('leave-btn').disabled = false;
    document.getElementById('join-btn').disabled = true;

    // Enable the toggle camera and mic buttons and selectors
    document.getElementById('toggle-camera').disabled = false;
    document.getElementById('toggle-mic').disabled = false;
    document.getElementById('camera-selector').disabled = false;
    document.getElementById('mic-selector').disabled = false;

    // Set up the camera and mic selectors
    this.setupDeviceSelectors();

    // Initialize the camera and microphone states and UI for the local participant
    Object.entries(tracks).forEach(([trackType, trackInfo]) => {
      if (trackType === 'video') {
        this.isCameraMuted = trackInfo.state !== 'playable';
      } else if (trackType === 'audio') {
        this.isMicMuted = trackInfo.state !== 'playable';
      }
      this.updateUiForDevicesState(trackType, trackInfo);
    });
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

    // Update the join and leave button states
    document.getElementById('leave-btn').disabled = true;
    document.getElementById('join-btn').disabled = false;

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
   * Handles participant-left event:
   * - Cleans up the video and audio tracks for the participant
   * - Removes the related UI elements
   * @param {Object} event - The participant-* event object.
   */
  handleParticipantLeft(event) {
    const participantId = event.participant.session_id;

    // Clean up the video and audio tracks for the participant
    this.destroyTracks(['video', 'audio'], participantId);

    // Now, remove the related UI elements
    const videoContainer = document.getElementById(
      `video-container-${participantId}`
    );
    if (videoContainer) {
      videoContainer.remove();
    }
  }

  /**
   * Handles participant-joined and participant-updated events:
   * - Updates the participant count
   * - Updates device states for the local participant
   * - Manages video and audio tracks based on their current state
   * @param {Object} event - The participant-* event object.
   */
  handleParticipantJoinedOrUpdated(event) {
    const { participant } = event;
    const participantId = participant.session_id;
    const isLocal = participant.local;
    const tracks = participant.tracks;

    // Always update the participant count regardless of the event action
    this.updateAndDisplayParticipantCount();

    Object.entries(tracks).forEach(([trackType, trackInfo]) => {
      // Update the video UI based on the track's state
      if (trackType === 'video') {
        this.updateVideoUi(trackInfo, participantId);
      }

      // Update the camera and microphone states for the local user based on the track's state
      if (isLocal) {
        this.updateUiForDevicesState(trackType, trackInfo);
      }

      // If a track exists...
      if (trackInfo.persistentTrack) {
        if (trackType === 'video') {
          // Attach and play the video
          this.playVideo(trackInfo, participantId);
        } else if (trackType === 'audio') {
          // Check if participant is local here, avoiding playback of the local participant's audio
          if (!isLocal) {
            // Attach and play the audio
            this.playAudio(trackInfo, participantId);
          }
        }
      } else {
        // If the track is not available, remove the media element
        this.destroyTracks([trackType], participantId);
      }
    });
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
   * Creates or updates the video container for a participant, including managing
   * the visibility of the video based on the track state.
   * @param {Object} track - The video track object.
   * @param {string} participantId - The ID of the participant.
   */
  updateVideoUi(track, participantId) {
    let videoContainer = document.getElementById(
      `video-container-${participantId}`
    );
    if (!videoContainer) {
      videoContainer = document.createElement('div');
      videoContainer.id = `video-container-${participantId}`;
      videoContainer.className = 'video-container';
      document.getElementById('videos').appendChild(videoContainer);
    }

    let sessionIdOverlay = videoContainer.querySelector('.session-id-overlay');
    if (!sessionIdOverlay) {
      sessionIdOverlay = document.createElement('div');
      sessionIdOverlay.className = 'session-id-overlay';
      sessionIdOverlay.textContent = participantId;
      videoContainer.appendChild(sessionIdOverlay);
    }

    let videoEl = videoContainer.querySelector('video.video-element');
    if (!videoEl) {
      videoEl = document.createElement('video');
      videoEl.className = 'video-element';
      videoContainer.appendChild(videoEl);
    }

    switch (track.state) {
      case 'playable':
        videoContainer.style.display = '';
        videoEl.style.display = '';
        break;
      case 'off':
      case 'interrupted':
      case 'blocked':
        videoEl.style.display = 'none'; // Hide video but keep container
        break;
      // Handle other specific states as needed
    }
  }

  /**
   * Attaches the video track to a video element for a participant and plays the track.
   * Assumes the video container and element already exist.
   * @param {Object} track - The video track object.
   * @param {string} participantId - The ID of the participant.
   */
  playVideo(track, participantId) {
    const videoContainer = document.getElementById(
      `video-container-${participantId}`
    );
    if (!videoContainer) {
      console.error(
        `Video container does not exist for participant: ${participantId}`
      );
      return;
    }

    let videoEl = videoContainer.querySelector('video.video-element');
    if (!videoEl) {
      console.error(
        `Video element does not exist for participant ${participantId}. Creating one.`
      );
      videoEl = document.createElement('video');
      videoEl.className = 'video-element';
      videoContainer.appendChild(videoEl);
    }

    // Attach the track to the video element and play it
    videoEl.srcObject = new MediaStream([track.persistentTrack]);
    videoEl.onloadedmetadata = () => {
      videoEl
        .play()
        .catch((e) =>
          console.error(
            `Error playing video for participant ${participantId}:`,
            e
          )
        );
    };
  }

  /**
   * Adds an <audio> element to the DOM for a participant's audio track and attempts to play it.
   * @param {Object} track - The audio track object.
   * @param {Object} participant - The track's participant object.
   */
  playAudio(track, participantId) {
    // Construct an element ID using the participant ID to uniquely identify audio elements
    const audioElementId = `audio-${participantId}`;
    let audioEl = document.getElementById(audioElementId);

    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.id = audioElementId;
      document.body.appendChild(audioEl);
    }

    // Whether newly created or existing, update the srcObject and play()
    audioEl.srcObject = new MediaStream([track.persistentTrack]);
    audioEl.play();
  }

  /**
   * Cleans up specified media track types (e.g., 'video', 'audio') for a given participant
   * by stopping the tracks and removing their corresponding elements from the DOM. This is
   * essential for properly managing resources when participants leave or change their track
   * states.
   * @param {Array} trackTypes - An array of track types to destroy, e.g., ['video', 'audio'].
   * @param {string} participantId - The ID of the participant.
   */
  destroyTracks(trackTypes, participantId) {
    trackTypes.forEach((trackType) => {
      const elementId = `${trackType}-${participantId}`;
      const element = document.getElementById(elementId);
      if (element) {
        element.srcObject = null; // Release media resources
        element.parentNode.removeChild(element); // Remove the element from the DOM
      }
    });
  }

  /**
   * Toggles the local video track's mute state.
   */
  toggleCamera() {
    this.call.setLocalVideo(this.isCameraMuted);
    this.isCameraMuted = !this.isCameraMuted;
  }

  /**
   * Toggles the local audio track's mute state.
   */
  toggleMicrophone() {
    this.call.setLocalAudio(this.isMicMuted);
    this.isMicMuted = !this.isMicMuted;
  }

  /**
   * Updates the UI to reflect the current states of the local participant's camera and microphone.
   * @param {string} trackType - The type of track, either 'video' for cameras or 'audio' for microphones.
   * @param {Object} trackInfo - The track object.
   */
  updateUiForDevicesState(trackType, trackInfo) {
    // For video, set the camera state
    if (trackType === 'video') {
      document.getElementById('camera-state').textContent = `Camera: ${
        trackInfo.state === 'playable' ? 'On' : 'Off'
      }`;
    } else if (trackType === 'audio') {
      // For audio, set the mic state
      document.getElementById('mic-state').textContent = `Mic: ${
        trackInfo.state === 'playable' ? 'On' : 'Off'
      }`;
    }
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
