// https://docs.daily.co/reference/daily-js/daily-iframe-class
let callObject;

// Log events as they are triggered to see what's happening throughout the call
const logEvent = (e) => console.log('Daily event: ', e);

/**
 *
 * FUNCTIONS TO TOGGLE DOM ELEMENT VISIBILITY
 */

const showOwnerPanel = () => {
  // Show the allow/deny buttons for anyone in the waiting room
  const buttons = document.getElementById('ownerKnockingButtons');
  buttons.classList.remove('hide');
};

const hideOwnerPanel = () => {
  // Hide the allow/deny buttons for anyone in the waiting room
  const buttons = document.getElementById('ownerKnockingButtons');
  buttons.classList.add('hide');
};

const showWaitingRoomText = () => {
  // Show waiting room message after knocking
  const guestKnockingMsg = document.getElementById('guestKnocking');
  guestKnockingMsg.classList.remove('hide');
};

const hideWaitingRoomText = () => {
  // Show waiting room message after knocking
  const guestKnockingMsg = document.getElementById('guestKnocking');
  guestKnockingMsg.classList.add('hide');
};

const showLoadingText = (type) => {
  // Show loading text when a participant is joining/knocking
  const id = type === 'owner' ? 'ownerLoading' : 'guestLoading';
  const loading = document.getElementById(id);
  loading.classList.remove('hide');
};

const hideLoadingText = (type) => {
  // Hide loading text in UI
  const id = type === 'owner' ? 'ownerLoading' : 'guestLoading';
  const loading = document.getElementById(id);
  loading.classList.add('hide');
};

const showRejectedFromCallText = () => {
  // Show message a knocking request was denied
  const guestDenied = document.getElementById('guestDenied');
  guestDenied.classList.remove('hide');
};

const hideRejectedFromCallText = () => {
  // Hide message a knocking request was denied
  const guestDenied = document.getElementById('guestDenied');
  guestDenied.classList.add('hide');
};

const showLeaveButton = () => {
  const leaveButton = document.getElementById('leaveButton');
  leaveButton.classList.remove('hide');
};

const hideLeaveButton = () => {
  const leaveButton = document.getElementById('leaveButton');
  leaveButton.classList.add('hide');
};

const showVideos = () => {
  const videos = document.getElementsByClassName('video-container');
  console.log('videos:', videos);
  for (let i = 0; i < videos.length; i += 1) {
    const video = videos[i];
    video.classList.remove('hide');
  }
};

const hideVideos = () => {
  const videos = document.getElementsByClassName('video-container');
  console.log('videos2:', videos);
  for (let i = 0; i < videos.length; i += 1) {
    const video = videos[i];
    video.classList.add('hide');
  }
};

const showForms = () => {
  const forms = document.getElementsByClassName('form-container');
  console.log('showing forms:', forms);
  for (let i = 0; i < forms.length; i += 1) {
    const form = forms[i];
    form.classList.remove('invisible');
  }
};

const hideForms = (formToHide) => {
  const forms = document.getElementsByClassName(`form-container ${formToHide}`);
  for (let i = 0; i < forms.length; i += 1) {
    const form = forms[i];
    // Keep in DOM but don't show to avoid elements shifting
    form.classList.add('invisible');
  }
};

/**
 *
 * VIDEO/EVENT-RELATED FUNCTIONS
 */

const findVideoForParticipant = (sessionId) => {
  // Find the video element with a session id that matches
  const videos = document.getElementsByTagName('video');
  const participantVideo = Array.from(videos).filter(
    (v) => v.session_id === sessionId
  );
  if (participantVideo.length > 0) {
    return participantVideo[0];
  }
  return null;
};

const addParticipantVideo = async (participant) => {
  if (!participant) return;
  // If the participant is an owner, we'll put them up top; otherwise, in the guest container
  const videoContainer = document.getElementById(
    participant.owner ? 'ownerVideo' : 'guestVideo'
  );

  let vid = findVideoForParticipant(participant.session_id);
  // Only add the video if it's not already in the UI
  if (!vid && participant.video) {
    // Create video element, set attributes
    vid = document.createElement('video');
    vid.session_id = participant.session_id;
    vid.style.width = '100%';
    vid.autoplay = true;
    vid.muted = true;
    vid.playsInline = true;
    // Append video to container (either guest or owner section)
    videoContainer.appendChild(vid);
    // Set video track
    vid.srcObject = new MediaStream([participant.tracks.video.persistentTrack]);
  }
};

const checkAccessLevel = async () => {
  // https://docs.daily.co/reference/daily-js/instance-methods/access-state
  const state = await callObject.accessState();
  /* Access level could be:
   - lobby (must knock to enter)
   - full (allowed to join the call)
   - none (can't join)
  */
  return state.access.level;
};

const handleJoinedMeeting = (e) => {
  // Hide form that wasn't used
  hideForms(e?.participants?.local.owner ? 'guest' : 'owner');
  showVideos();
  showLeaveButton();
  const participant = e?.participants?.local;
  // This demo assumes videos are on when the call starts since there aren't media controls in the UI.
  if (!participant?.tracks?.video) {
    // Update the room's settings to enable cameras by default.
    // https://docs.daily.co/reference/rest-api/rooms/config#start_video_off
    console.error(
      'Video is off. Ensure "start_video_off" setting is false for your room'
    );
    return;
  }
  addParticipantVideo(participant);
};

const handleLeftMeeting = (e) => {
  logEvent(e);
  showForms();
  hideVideos();
  hideLeaveButton();
};

const handleParticipantUpdate = async (e) => {
  const level = await checkAccessLevel();
  console.log('current level: ', level);
  // Don't use this event for participants who are waiting to join
  if (level === 'lobby') return;

  // Don't use this event for the local participant
  const participant = e?.participant;
  if (!participant || participant.local) return;

  // In a complete video call app, you would listen for different remote participant updates (e.g. toggling video/audio).
  // For now, we'll just see if a video element exists for them and add it if not.
  const vid = findVideoForParticipant(participant.session_id);
  if (!vid) {
    // No video found for remote participant after update. Add one.
    console.log('Adding new video');
    addParticipantVideo(participant);
  }
};

const handleParticipantLeft = (e) => {
  // Remove the video element for a participant who left
  const participant = e?.participant;
  const vid = findVideoForParticipant(participant.session_id);
  if (vid) {
    vid.remove();
  }
};

const handleAccessStateUpdate = (e) => {
  // If the access level has changed to full, the knocking participant has been let in.
  if (e.access.level === 'full') {
    // Add the participant's video (it will only be added if it doesn't already exist)
    const { local } = callObject.participants();
    addParticipantVideo(local);
    // Update messaging in UI
    hideWaitingRoomText();
  } else {
    logEvent(e);
  }
};

const leaveCall = async () => {
  if (callObject) {
    console.log('leaving call');
    // Clean up callObject so the demo can be used again
    await callObject.leave();
    await callObject.destroy();
    callObject = null;

    // Remove all video elements
    const videoEls = [...document.getElementsByTagName('video')];
    videoEls.forEach((v) => v.remove());

    // Reset UI messaging
    hideOwnerPanel();
    hideWaitingRoomText();
    hideRejectedFromCallText();

    // Todo: add .off() events: https://docs.daily.co/reference/rn-daily-js/instance-methods/off
  } else {
    console.log('not in a call to leave');
  }
};

/**
 *
 * OWNER-RELATED FUNCTIONS
 */

// Add a new participant to the "waiting" list in the UI
const addWaitingParticipant = (e) => {
  const list = document.getElementById('knockingList');
  const li = document.createElement('li');
  li.setAttribute('id', e.participant.id);
  li.innerHTML = `${e.participant.name}: ${e.participant.id}`;
  // Add new list item to ul element for owner to see
  list.appendChild(li);
};

// Update "waiting participants" list owner sees
const updateWaitingParticipant = (e) => {
  logEvent(e);
  // Get the li of the waiting participant who was removed from the list
  // They would be "removed" whether they were accepted or rejected -- they're just not waiting anymore.
  const { id } = e.participant;
  const li = document.getElementById(id);
  // If the li exists, remove it from the list
  if (li) {
    li.remove();
  }
};

const allowAccess = () => {
  console.log('allow guest in');
  // Retrieve list of waiting participants
  const waiting = callObject.waitingParticipants();

  const waitList = Object.keys(waiting);
  // We'll let the whole list in to keep this functionality simple.
  // You could also add a button next to each name to let individual guests in and then have an "Accept all" and "Deny all" option to respond in one batch.
  waitList.forEach(async (id) => {
    await callObject.updateWaitingParticipant(id, {
      grantRequestedAccess: true,
    });
  });
  // You could also use callObject.updateWaitingParticipants(*) to let everyone in at once. The example above to is show the more common example of programmatically letting people in one at a time.
};

const denyAccess = () => {
  console.log('deny guest access');
  const waiting = callObject.waitingParticipants();

  const waitList = Object.keys(waiting);
  // We'll deny the whole list to keep the UI simple
  waitList.forEach(async (id) => {
    await callObject.updateWaitingParticipant(id, {
      grantRequestedAccess: false,
    });
  });
};

const addOwnerEvents = () => {
  callObject
    .on('joined-meeting', handleJoinedMeeting)
    .on('left-meeting', handleLeftMeeting)
    .on('participant-joined', logEvent)
    .on('participant-updated', handleParticipantUpdate)
    .on('participant-left', handleParticipantLeft)
    .on('waiting-participant-added', addWaitingParticipant)
    .on('waiting-participant-updated', logEvent)
    .on('waiting-participant-removed', updateWaitingParticipant)
    .on('error', logEvent);
};

// The owner will go right into the call since they have appropriate permissions
const createOwnerCall = async ({ name, url, token }) => {
  showLoadingText('owner');

  // Create call object
  callObject = await window.DailyIframe.createCallObject();

  // Add Daily event listeners (not an exhaustive list)
  // See: https://docs.daily.co/reference/daily-js/events
  addOwnerEvents();

  // Let owner join the meeting
  try {
    const join = await callObject.join({ userName: name, url, token });

    // Confirm the participant is an owner of the call (i.e. can respond to knocking)
    if (join.local.owner !== true) {
      console.error('This participant is not a meeting owner!');
    } else {
      console.log('This participant is a meeting owner! :)');
    }

    // Update UI after call is joined
    hideLoadingText('owner');
    showOwnerPanel();
  } catch (error) {
    console.log('Owner join failed: ', error);
    hideLoadingText('owner');
  }
};

// Handle onsubmit event for the owner form
const submitOwnerForm = (e) => {
  e.preventDefault();
  // Do not try to create new call object if it already exists
  if (callObject) return;
  // Get form values
  const name = e.target.name.value;
  const url = e.target.url.value;
  const token = e.target.token.value;
  // Log error if any form input is empty
  if (!name.trim() || !url.trim() || !token.trim()) {
    console.error('Fill out form');
    return;
  }
  // Initialize the call object and let the owner join/enter the call
  createOwnerCall({ name, url, token });
};

/**
 *
 * GUEST-RELATED FUNCTIONS
 */

const handleRejection = (e) => {
  logEvent(e);
  // The request to join (knocking) was rejected :(
  if (e.errorMsg === 'Join request rejected') {
    // Update UI so the guest knows their request was denied
    hideWaitingRoomText();
    showRejectedFromCallText();
  }
};

const addGuestEvents = () => {
  callObject
    .on('joined-meeting', checkAccessLevel)
    .on('left-meeting', logEvent)
    .on('participant-joined', logEvent)
    .on('participant-updated', handleParticipantUpdate)
    .on('participant-left', handleParticipantLeft)
    .on('error', handleRejection)
    .on('access-state-updated', handleAccessStateUpdate);
};

// This function will create the call object and "join" the call.
// Joining for guests means going into the lobby and waiting for an owner to let them in.
const createGuestCall = async ({ name, url }) => {
  showLoadingText('guest');

  // Create call object
  callObject = await window.DailyIframe.createCallObject();

  // Add Daily event listeners (not an exhaustive list)
  // See: https://docs.daily.co/reference/daily-js/events
  addGuestEvents();

  try {
    // Pre-authenticate the guest so we can confirm they need to knock before calling join() method
    await callObject.preAuth({ userName: name, url });

    // Confirm that the guest actually needs to knock
    const permissions = await checkAccessLevel();
    console.log('access level: ', permissions);

    // If they're in the lobby, they need to knock
    if (permissions === 'lobby') {
      // Guests must call .join() before they can knock to enter the call
      await callObject.join();

      // Update UI to show they're now in the waiting room
      hideLoadingText('guest');
      showWaitingRoomText();
      hideForms('owner');
      showLeaveButton();
      showVideos();

      // Request full access to the call (i.e. knock to enter)
      await callObject.requestAccess({ name });
    } else if (permissions === 'full') {
      // If the guest can join the call, it's probably not a private room.
      console.error(
        'Participant does not need to knock. Please review the README instructions.'
      );
      // Update UI
      hideLoadingText('guest');
      // Join the call
      await callObject.join();
    } else {
      console.error('Something went wrong while joining.');
    }
  } catch (error) {
    console.log('Guest knocking failed: ', error);
  }
};

const submitKnockingForm = (e) => {
  e.preventDefault();

  // Get form values
  const name = e.target.name.value;
  const url = e.target.url.value;

  // Log error if either form input is empty
  if (!name.trim() || !url.trim()) {
    console.error('Fill out form');
    return;
  }

  // If the user is trying to join after a failed attempt, hide the previous error message
  hideRejectedFromCallText();

  // Initialize guest call so they can knock to enter
  createGuestCall({ name, url });
};

/**
 *
 * EVENT LISTENERS
 */
const knockingForm = document.getElementById('knockingForm');
knockingForm.addEventListener('submit', submitKnockingForm);

const ownerForm = document.getElementById('ownerForm');
ownerForm.addEventListener('submit', submitOwnerForm);

const allowAccessButton = document.getElementById('allowAccessButton');
allowAccessButton.addEventListener('click', allowAccess);

const denyAccessButton = document.getElementById('denyAccessButton');
denyAccessButton.addEventListener('click', denyAccess);

const leaveButton = document.getElementById('leaveButton');
leaveButton.addEventListener('click', leaveCall);
