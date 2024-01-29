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
    const events = {
      'active-speaker-change': this.handleActiveSpeakerChange.bind(this),
      error: this.handleError.bind(this),
      'joined-meeting': this.handleJoin.bind(this),
      'left-meeting': this.handleLeave.bind(this),
      'participant-joined': this.handleParticipantJoinLeft.bind(this),
      'participant-left': this.handleParticipantJoinLeft.bind(this),
      'participant-updated': this.handleParticipantStateUpdate.bind(this),
      'track-started': this.displayTrack.bind(this),
      'track-stopped': this.destroyTrack.bind(this),
    };

    // Register the event handlers with the call object.
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
   */
  handleJoin() {
    console.log(`Successfully joined: ${this.currentRoomUrl}`);

    // Enable the toggle camera and mic buttons
    document.getElementById('toggle-camera').disabled = false;
    document.getElementById('toggle-mic').disabled = false;

    // Set up the camera and mic selectors
    this.setupDeviceSelectors();

    // Get the initial track states
    this.getTrackStates();

    // Update the participant count
    document.getElementById(
      'participant-count'
    ).textContent = `Participants: ${this.getParticipantCount()}`;
  }

  /**
   * Handler for remote participants joining and leaving. Updates the participant count.
   */
  handleParticipantJoinLeft() {
    document.getElementById(
      'participant-count'
    ).textContent = `Participants: ${this.getParticipantCount()}`;
  }

  /**
   * Handler for participant leave events:
   * - Confirms leaving with a console message
   * - Disable the toggle camera and mic buttons
   * - Resets the camera and mic selectors
   * - Updates the call state in the UI
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
   * Decides whether to display video or play audio based on the track type.
   * @param {Object} event - The track event object.
   */
  displayTrack(event) {
    if (event.track.kind === 'video') {
      this.displayVideo(event);
    } else {
      this.playAudio(event);
    }
  }

  /**
   * Adds a <video> element to the DOM and attaches the video track to it.
   * @param {Object} event - The track event object containing the video track.
   */
  displayVideo(event) {
    const videosDiv = document.getElementById('videos');
    const videoEl = document.createElement('video');
    videosDiv.appendChild(videoEl);
    videoEl.style.width = '100%';
    videoEl.srcObject = new MediaStream([event.track]);
    videoEl.play();
  }

  /**
   * Adds an <audio> element to the DOM and attaches the audio track to it.
   * @param {Object} event - The track event object containing the audio track.
   */
  playAudio(event) {
    if (event.participant.local) {
      return; // Avoid playing local audio
    }
    const audioEl = document.createElement('audio'); // Create <audio> element
    document.body.appendChild(audioEl); // Add <audio> element to DOM
    audioEl.srcObject = new MediaStream([event.track]); // Attach audio track to <audio> element
    audioEl.play(); // Play audio track
  }

  /**
   * Removes the track's element (audio or video) from the DOM when it stops
   * and ensures media resources are released by setting srcObject to null.
   * @param {Object} event - The track event object.
   */
  destroyTrack(event) {
    let tracks = document.querySelectorAll('video, audio');
    tracks.forEach((el) => {
      if (el.srcObject && el.srcObject.getTracks().includes(event.track)) {
        el.srcObject = null; // Release media resources
        el.remove(); // Remove the element from the DOM
      }
    });
  }

  /**
   * Updates UI for track state changes (e.g., mute states).
   */
  handleParticipantStateUpdate() {
    this.getTrackStates();
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
   * Retrieves the track states of the local participant's tracks and updates the UI.
   */
  getTrackStates() {
    const localParticipant = this.call.participants().local;
    const tracks = localParticipant.tracks;
    if (this.call && localParticipant) {
      this.isCameraMuted = tracks.video.state === 'off';
      this.isMicMuted = tracks.audio.state === 'off';
      this.updateUiForTrackStates();
    }
  }

  /**
   * Toggles the local video track's mute state.
   */
  toggleCamera() {
    this.call.setLocalVideo(this.isCameraMuted);
    this.isCameraMuted = !this.isCameraMuted;
    this.updateUiForTrackStates();
  }

  /**
   * Toggles the local audio track's mute state.
   */
  toggleMicrophone() {
    this.call.setLocalAudio(this.isMicMuted);
    this.isMicMuted = !this.isMicMuted;
    this.updateUiForTrackStates();
  }

  /**
   * Updates the UI to reflect the current states of the local participant's camera and microphone.
   */
  updateUiForTrackStates() {
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
      // Call setInputDevicesAsync with the corresponding device ID based on the type of selector.
      if (deviceType === 'video') {
        this.call.setInputDevicesAsync({ videoDeviceId: deviceId });
      } else if (deviceType === 'audio') {
        this.call.setInputDevicesAsync({ audioDeviceId: deviceId });
      }
    });
  }

  /**
   * Returns the number of participants in the call.
   * @returns {number} The number of participants in the call.
   */
  getParticipantCount() {
    return Object.keys(this.call.participants()).length;
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
