/**
 * Class managing Daily.co call functionalities including joining, leaving,
 * handling audio/video tracks and UI updates for track states.
 */
class DailyCallManager {
  constructor() {
    this.call = DailyIframe.createCallObject();
    this.isCameraMuted = null;
    this.isMicMuted = null;
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
      'participant-joined': this.handleJoin.bind(this),
      'participant-left': this.handleJoin.bind(this),
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
   * Handler for participant join events, updating participant count in the UI.
   */
  handleJoin() {
    document.getElementById('participant-count').textContent = `Participants: ${
      Object.keys(this.call.participants()).length
    }`;
    this.getTrackStates();
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
    let videosDiv = document.getElementById('videos');
    let videoEl = document.createElement('video');
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
    let audioEl = document.createElement('audio'); // Create <audio> element
    document.body.appendChild(audioEl); // Add <audio> element to DOM
    audioEl.srcObject = new MediaStream([event.track]); // Attach audio track to <audio> element
    audioEl.play(); // Play audio track
  }

  /**
   * Removes the track's element (audio or video) from the DOM when it stops.
   * @param {Object} event - The track event object.
   */
  destroyTrack(event) {
    let tracks = document.querySelectorAll('video, audio');
    tracks.forEach((el) => {
      if (el.srcObject && el.srcObject.getTracks().includes(event.track)) {
        el.remove();
      }
    });
  }

  /**
   * Updates UI for track state changes (e.g., mute states).
   */
  handleParticipantStateUpdate(event) {
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

    const joinOptions = { url: roomUrl };
    if (joinToken) {
      joinOptions.token = joinToken;
      console.log('Joining with token:', joinToken);
    } else {
      console.log('Joining without a token.');
    }

    try {
      await this.call.join(joinOptions);
      console.log(`Successfully joined: ${roomUrl}`);
    } catch (e) {
      console.error('Join failed:', e);
    }
  }

  /**
   * Retrieves the track states of the local participant's tracks and updates the UI.
   */
  getTrackStates() {
    if (this.call && this.call.participants().local) {
      const localParticipant = this.call.participants().local;
      this.isCameraMuted = localParticipant.tracks.video.state === 'off';
      this.isMicMuted = localParticipant.tracks.audio.state === 'off';
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
   * Leaves the call and performs necessary cleanup operations like removing video elements.
   */
  async leave() {
    try {
      await this.call.leave();
      console.log('Successfully left the call');

      // Remove video and audio elements
      document.querySelectorAll('#videos video, audio').forEach((el) => {
        el.remove();
      });

      document.getElementById(
        'participant-count'
      ).textContent = `Participants: 0`;
      document.getElementById(
        'active-speaker'
      ).textContent = `Active Speaker: None`;
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
