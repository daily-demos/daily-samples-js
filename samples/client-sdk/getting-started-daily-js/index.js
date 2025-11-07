/**
 * Initializes a new instance of the `DailyCallManager` class, creating
 * a Daily.co call object and setting initial states for camera and
 * microphone muting, as well as the current room URL. It then calls the
 * `initialize` method to set up event listeners and UI interactions.
 */
class DailyCallManager {
  constructor() {
    this.call = Daily.createCallObject({
      subscribeToTracksAutomatically: false,
    });
    window.callObject = this.call; // Expose for debugging
    this.currentRoomUrl = null;
    this.initialize();
  }

  /**
   * Performs initial setup of event listeners and UI component interactions.
   */
  async initialize() {
    this.setupEventListeners();
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
  setupEventListeners() {
    const events = {
      'active-speaker-change': this.handleActiveSpeakerChange.bind(this),
      error: this.handleError.bind(this),
      'joined-meeting': this.handleJoin.bind(this),
      'left-meeting': this.handleLeave.bind(this),
      'participant-joined': this.handleParticipantJoinedOrUpdated.bind(this),
      'participant-left': this.handleParticipantLeft.bind(this),
      'participant-updated': this.handleParticipantJoinedOrUpdated.bind(this),
    };

    Object.entries(events).forEach(([event, handler]) => {
      this.call.on(event, handler);
    });
  }

  /**
   * Handler for the local participant joining:
   * - Prints the room URL
   * - Enables the toggle camera, toggle mic, and leave buttons
   * - Gets the initial track states
   * - Sets up and enables the device selectors
   * @param {Object} event - The joined-meeting event object.
   */
  handleJoin(event) {
    const { tracks } = event.participants.local;

    console.log(`Successfully joined: ${this.currentRoomUrl}`);

    // Update the participant count
    this.updateAndDisplayParticipantCount();

    // Enable the leave button
    document.getElementById('leave-btn').disabled = false;

    // Enable the toggle camera and mic buttons and selectors
    document.getElementById('toggle-camera').disabled = false;
    document.getElementById('toggle-mic').disabled = false;
    document.getElementById('camera-selector').disabled = false;
    document.getElementById('mic-selector').disabled = false;

    // Set up the camera and mic selectors
    this.setupDeviceSelectors();

    // Initialize the camera and microphone states and UI for the local
    // participant
    Object.entries(tracks).forEach(([trackType, trackInfo]) => {
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
   * Handles fatal errors emitted from the Daily call object.
   * These errors result in the participant leaving the meeting. A
   * `left-meeting` event will also be sent, so we still rely on that event
   * for cleanup.
   * @param {Object} e - The error event object.
   */
  handleError(e) {
    console.error('DAILY SENT AN ERROR!', e.error ? e.error : e.errorMsg);
  }

  /**
   * Handles participant-left event:
   * - Cleans up the video and audio tracks for the participant
   * - Removes the related UI elements
   * @param {Object} event - The participant-left event object.
   */
  handleParticipantLeft(event) {
    const participantId = event.participant.session_id;

    // Clean up the video and audio tracks for the participant
    // When a participant leaves, we don't have trackInfo, but we know these are regular tracks
    this.destroyTracks(
      [
        { trackType: 'video', trackInfo: null },
        { trackType: 'audio', trackInfo: null },
      ],
      participantId
    );

    // Now, remove the related video UI
    document.getElementById(`video-container-${participantId}`)?.remove();
    document
      .getElementById(`video-container-customTrack-${participantId}`)
      ?.remove();

    // Update the participant count
    this.updateAndDisplayParticipantCount();
  }

  /**
   * Handles participant-joined and participant-updated events:
   * - Updates the participant count
   * - Creates a video container for new participants
   * - Creates an audio element for new participants
   * - Manages video and audio tracks based on their current state
   * - Updates device states for the local participant
   * @param {Object} event - The participant-joined, participant-updated
   * event object.
   */
  handleParticipantJoinedOrUpdated(event) {
    const { participant } = event;
    const participantId = participant.session_id;
    const isLocal = participant.local;
    const { tracks } = participant;

    this.call.updateParticipant(participantId, {
      setSubscribedTracks: true,
    });

    // Always update the participant count regardless of the event action
    this.updateAndDisplayParticipantCount();

    // Create a video container if one doesn't exist
    if (!document.getElementById(`video-container-${participantId}`)) {
      this.createVideoContainer(participantId);
    }

    // Create an audio element for non-local participants if one doesn't exist
    if (!document.getElementById(`audio-${participantId}`) && !isLocal) {
      this.createAudioElement(participantId);
    }

    Object.entries(tracks).forEach(([trackType, trackInfo]) => {
      // If a persistentTrack exists...
      if (trackInfo.persistentTrack) {
        // For custom audio tracks, create a dedicated audio element if it doesn't exist
        if (trackInfo?.kind === 'audio' && !isLocal) {
          const customAudioId = `${trackType}-${participantId}`;
          if (!document.getElementById(customAudioId)) {
            this.createCustomAudioElement(trackType, participantId);
          }
        }

        // For custom video tracks, create a dedicated video container if it doesn't exist
        if (trackInfo?.kind === 'video') {
          const customVideoId = `video-container-${trackType}-${participantId}`;
          if (!document.getElementById(customVideoId)) {
            this.createCustomVideoContainer(trackType, participantId);
          }
        }

        // Check if this is the local participant's audio track.
        // If so, we will skip playing it, as it's already being played.
        // We'll start or update tracks in all other cases.
        if (!(isLocal && trackType === 'audio')) {
          this.startOrUpdateTrack(trackType, trackInfo, participantId);
        }
      } else {
        // If the track is not available, remove the media element
        this.destroyTracks([{ trackType, trackInfo }], participantId);
      }

      // Update the video UI based on the track's state
      // For regular and custom video tracks
      if (trackType === 'video' || trackInfo?.kind === 'video') {
        this.updateVideoUi(trackInfo, participantId, trackType);
      }

      // Update the camera and microphone states for the local user based on
      // the track's state
      if (isLocal) {
        this.updateUiForDevicesState(trackType, trackInfo);
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
      // Disable the join button to prevent multiple attempts to join
      document.getElementById('join-btn').disabled = true;
      // Join the room
      await this.call.join(joinOptions);
    } catch (e) {
      console.error('Join failed:', e);
    }
  }

  /**
   * Creates and sets up a new video container for a specific participant. This
   * function dynamically generates a video element along with a container and
   * an overlay displaying the participant's ID. The newly created elements are
   * appended to a designated parent in the DOM, preparing them for video
   * streaming or playback related to the specified participant.
   *
   * @param {string} participantId - The unique identifier for the participant.
   */
  createVideoContainer(participantId) {
    // Create a video container for the participant
    const videoContainer = document.createElement('div');
    videoContainer.id = `video-container-${participantId}`;
    videoContainer.className = 'video-container';
    document.getElementById('videos').appendChild(videoContainer);

    // Add an overlay to display the participant's session ID
    const sessionIdOverlay = document.createElement('div');
    sessionIdOverlay.className = 'session-id-overlay';
    sessionIdOverlay.textContent = participantId;
    videoContainer.appendChild(sessionIdOverlay);

    // Create a video element for the participant
    const videoEl = document.createElement('video');
    videoEl.className = 'video-element';
    videoContainer.appendChild(videoEl);
  }

  /**
   * Creates an audio element for a particular participant. This function is
   * responsible for dynamically generating a standalone audio element that can
   * be used to play audio streams associated with the specified participant.
   * The audio element is appended directly to the document body or a relevant
   * container, thereby preparing it for playback of the participant's audio.
   *
   * @param {string} participantId - A unique identifier corresponding to the participant.
   */
  createAudioElement(participantId) {
    // Create an audio element for the participant
    const audioEl = document.createElement('audio');
    audioEl.id = `audio-${participantId}`;
    document.body.appendChild(audioEl);
  }

  /**
   * Creates a custom audio element for a particular participant and track type.
   * This function is responsible for dynamically generating a standalone audio element
   * that can be used to play custom audio streams associated with the specified participant.
   *
   * @param {string} trackType - The custom audio track type (e.g., 'customAudio-mytrack').
   * @param {string} participantId - A unique identifier corresponding to the participant.
   */
  createCustomAudioElement(trackType, participantId) {
    // Create a custom audio element for the participant
    const audioEl = document.createElement('audio');
    audioEl.id = `${trackType}-${participantId}`;
    audioEl.autoplay = true;
    document.body.appendChild(audioEl);
  }

  /**
   * Creates a custom video container for a particular participant and track type.
   * This function dynamically generates a video element with a container and overlay
   * for custom video tracks.
   *
   * @param {string} trackType - The custom video track type (e.g., 'customVideo-mytrack').
   * @param {string} participantId - A unique identifier corresponding to the participant.
   */
  createCustomVideoContainer(trackType, participantId) {
    // Create a video container for the custom video track
    const videoContainer = document.createElement('div');
    videoContainer.id = `video-container-${trackType}-${participantId}`;
    videoContainer.className = 'video-container';
    document.getElementById('videos').appendChild(videoContainer);

    // Add an overlay to display the track name and participant's session ID
    const sessionIdOverlay = document.createElement('div');
    sessionIdOverlay.className = 'session-id-overlay';
    const trackName = trackType.replace('customVideo', '');
    sessionIdOverlay.textContent = `${trackName} (${participantId})`;
    videoContainer.appendChild(sessionIdOverlay);

    // Create a video element for the custom video track
    const videoEl = document.createElement('video');
    videoEl.className = 'video-element';
    videoEl.autoplay = true;
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoContainer.appendChild(videoEl);
  }

  /**
   * Updates the media track (audio or video) source for a specific participant
   * and plays the updated track. It checks if the source track needs to be
   * updated and performs the update if necessary, ensuring playback of the
   * media track.
   *
   * @param {string} trackType - Specifies the type of track to update ('audio'
   * or 'video'), allowing the function to dynamically adapt to the track being
   * processed.
   * @param {Object} track - Contains the media track data, including the
   * `persistentTrack` property which holds the actual MediaStreamTrack to be
   * played or updated.
   * @param {string} participantId - Identifies the participant whose media
   * track is being updated.
   */
  startOrUpdateTrack(trackType, track, participantId) {
    // Construct the selector string or ID based on the trackType.
    // For custom audio and video tracks, we'll use a unique ID based on the track type
    let selector;
    console.log(
      'Starting or updating track:',
      trackType,
      'for participant:',
      participantId,
      track
    );
    const isCustomAudio = track.kind === 'audio';
    const isCustomVideo = track.kind === 'video';

    if (isCustomAudio) {
      // Custom audio tracks get their own dedicated audio element
      selector = `${trackType}-${participantId}`;
    } else if (isCustomVideo) {
      // Custom video tracks get their own dedicated video element in a custom container
      selector = `#video-container-${trackType}-${participantId} video.video-element`;
      console.log('Custom video selector:', selector);
    } else if (trackType === 'video') {
      selector = `#video-container-${participantId} video.video-element`;
    } else {
      // Regular audio track
      selector = `audio-${participantId}`;
    }

    // Retrieve the specific media element from the DOM.
    const trackEl =
      trackType === 'video' || isCustomVideo
        ? document.querySelector(selector)
        : document.getElementById(selector);

    // Error handling if the target media element does not exist.
    if (!trackEl) {
      console.error(
        `${trackType} element does not exist for participant: ${participantId}`
      );
      return;
    }

    // Check for the need to update the media source. This is determined by
    // checking whether the existing srcObject's tracks include the new
    // persistentTrack. If there are no existing tracks or the new track is not
    // among them, an update is necessary.
    const existingTracks = trackEl.srcObject?.getTracks();
    const needsUpdate = !existingTracks?.includes(track.persistentTrack);

    // Perform the media source update if needed by setting the srcObject of
    // the target element to a new MediaStream containing the provided
    // persistentTrack.
    if (needsUpdate) {
      trackEl.srcObject = new MediaStream([track.persistentTrack]);

      // Once the media metadata is loaded, attempts to play the track. Error
      // handling for play failures is included to catch and log issues such as
      // autoplay policies blocking playback.
      trackEl.onloadedmetadata = () => {
        trackEl
          .play()
          .catch((e) =>
            console.error(
              `Error playing ${trackType} for participant ${participantId}:`,
              e
            )
          );
      };
    }
  }

  /**
   * Shows or hides the video element for a participant, including managing
   * the visibility of the video based on the track state.
   * @param {Object} track - The video track object.
   * @param {string} participantId - The ID of the participant.
   */
  /**
   * Shows or hides the video element for a participant, including managing
   * the visibility of the video based on the track state.
   * @param {Object} track - The video track object.
   * @param {string} participantId - The ID of the participant.
   * @param {string} trackType - The type of track (e.g., 'video', 'customVideo-mytrack').
   */
  updateVideoUi(track, participantId, trackType = 'video') {
    // Determine the correct container ID based on track type
    const isCustomVideo = track.customTrack && track.kind === 'video';
    const containerId = isCustomVideo
      ? `video-container-${trackType}-${participantId}`
      : `video-container-${participantId}`;

    const videoContainer = document.getElementById(containerId);
    if (!videoContainer) {
      console.error(`Video container ${containerId} not found`);
      return;
    }

    const videoEl = videoContainer.querySelector('video.video-element');
    if (!videoEl) {
      console.error(`Video element not found in container ${containerId}`);
      return;
    }

    switch (track.state) {
      case 'off':
      case 'interrupted':
      case 'blocked':
        videoEl.style.display = 'none'; // Hide video but keep container
        break;
      case 'playable':
      default:
        // Here we handle all other states the same as we handle 'playable'.
        // In your code, you may choose to handle them differently.
        videoEl.style.display = '';
        break;
    }
  }

  /**
   * Cleans up specified media tracks for a given participant by stopping the
   * tracks and removing their corresponding elements from the DOM. This is
   * essential for properly managing resources when participants leave or
   * change their track states.
   * @param {Array} trackData - An array of objects with {trackType, trackInfo},
   * e.g., [{trackType: 'video', trackInfo: {...}}, ...].
   * @param {string} participantId - The ID of the participant.
   */
  destroyTracks(trackData, participantId) {
    trackData.forEach(({ trackType, trackInfo }) => {
      let elementId;

      // Determine the correct element ID based on track type
      if (trackInfo?.kind === 'audio') {
        // Custom audio tracks have dedicated audio elements
        elementId = `${trackType}-${participantId}`;
      } else if (trackInfo?.kind === 'video') {
        // Custom video tracks have dedicated video containers
        elementId = `video-container-${trackType}-${participantId}`;
      } else {
        // Regular tracks use standard naming
        elementId = `${trackType}-${participantId}`;
      }

      const element = document.getElementById(elementId);
      if (element) {
        // For video containers, clean up the video element inside
        const isCustomVideo = trackInfo?.kind === 'video';
        if (trackType === 'video' || isCustomVideo) {
          const videoEl = element.querySelector('video.video-element');
          if (videoEl) {
            videoEl.srcObject = null;
          }
        } else {
          // For audio elements, clean up directly
          element.srcObject = null;
        }
        element.parentNode.removeChild(element); // Remove element from the DOM
      }
    });
  }

  /**
   * Toggles the local video track's mute state.
   */
  toggleCamera() {
    this.call.setLocalVideo(!this.call.localVideo());
  }

  /**
   * Toggles the local audio track's mute state.
   */
  toggleMicrophone() {
    this.call.setLocalAudio(!this.call.localAudio());
  }

  /**
   * Updates the UI to reflect the current states of the local participant's
   * camera and microphone.
   * @param {string} trackType - The type of track, either 'video' for cameras
   * or 'audio' for microphones, or custom track types.
   * @param {Object} trackInfo - The track object.
   */
  updateUiForDevicesState(trackType, trackInfo) {
    // For video, set the camera state
    if (trackType === 'video') {
      document.getElementById('camera-state').textContent = `Camera: ${
        this.call.localVideo() ? 'On' : 'Off'
      }`;
    } else if (trackType === 'audio') {
      // For audio, set the mic state
      document.getElementById('mic-state').textContent = `Mic: ${
        this.call.localAudio() ? 'On' : 'Off'
      }`;
    } else if (trackInfo?.kind === 'audio') {
      // For custom audio tracks, update UI to show custom track name
      // Extract track name from trackType (format: customAudio-name)
      const trackName = trackType.replace('customAudio-', '');
      document.getElementById(
        'mic-state'
      ).textContent = `Custom Audio (${trackName}): ${
        trackInfo.state === 'playable' ? 'On' : 'Off'
      }`;
    } else if (trackInfo?.kind === 'video') {
      // For custom video tracks, update UI to show custom track name
      // Extract track name from trackType (format: customVideo-name)
      const trackName = trackType.replace('customVideo-', '');
      document.getElementById(
        'camera-state'
      ).textContent = `Custom Video (${trackName}): ${
        trackInfo.state === 'playable' ? 'On' : 'Off'
      }`;
    }
  }

  /**
   * Sets up device selectors for cameras and microphones by dynamically
   * populating them with available devices and attaching event listeners to
   * handle device selection changes.
   */
  async setupDeviceSelectors() {
    // Fetch current input devices settings and an array of available devices.
    const selectedDevices = await this.call.getInputDevices();
    const { devices: allDevices } = await this.call.enumerateDevices();

    // Element references for camera and microphone selectors.
    const selectors = {
      videoinput: document.getElementById('camera-selector'),
      audioinput: document.getElementById('mic-selector'),
    };

    // Prepare selectors by clearing existing options and adding a
    // non-selectable prompt.
    Object.values(selectors).forEach((selector) => {
      selector.innerHTML = '';
      const promptOption = new Option(
        `Select a ${selector.id.includes('camera') ? 'camera' : 'microphone'}`,
        '',
        true,
        true
      );
      promptOption.disabled = true;
      selector.appendChild(promptOption);
    });

    // Create and append options to the selectors based on available devices.
    allDevices.forEach((device) => {
      if (device.label && selectors[device.kind]) {
        const isSelected =
          selectedDevices[device.kind === 'videoinput' ? 'camera' : 'mic']
            .deviceId === device.deviceId;
        const option = new Option(
          device.label,
          device.deviceId,
          isSelected,
          isSelected
        );
        selectors[device.kind].appendChild(option);
      }
    });

    // Listen for user device change requests.
    Object.entries(selectors).forEach(([deviceKind, selector]) => {
      selector.addEventListener('change', async (e) => {
        const deviceId = e.target.value;
        const deviceOptions = {
          [deviceKind === 'videoinput' ? 'videoDeviceId' : 'audioDeviceId']:
            deviceId,
        };
        await this.call.setInputDevicesAsync(deviceOptions);
      });
    });
  }

  /**
   * Updates the UI with the current number of participants.
   * This method combines getting the participant count and updating the UI.
   */
  updateAndDisplayParticipantCount() {
    const participantCount =
      this.call.participantCounts().present +
      this.call.participantCounts().hidden;
    document.getElementById(
      'participant-count'
    ).textContent = `Participants: ${participantCount}`;
  }

  /**
   * Leaves the call and performs necessary cleanup operations like removing
   * video elements.
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
 * Main entry point: Setup and event listener bindings after the DOM is fully
 * loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const dailyCallManager = new DailyCallManager();

  // Bind the join call action to the join button.
  document.getElementById('join-btn').addEventListener('click', async () => {
    const roomUrl = document.getElementById('room-url').value.trim();
    const joinToken =
      document.getElementById('join-token').value.trim() || null;
    await dailyCallManager.joinRoom(roomUrl, joinToken);
  });

  // Bind the leave call action to the leave button.
  document.getElementById('leave-btn').addEventListener('click', () => {
    dailyCallManager.leave();
  });
});
