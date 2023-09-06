const hiddenClassName = 'hidden';

/**
 * Updates the given participant's DOM element with the provided media track.
 * @param {*} sessionID 
 * @param {*} newTrack 
 * @returns 
 */
export function updateMediaTrack(sessionID, newTrack) {
  const participantEle = getParticipantEle(sessionID);
  if (!participantEle) return;
  const trackKind = newTrack.kind;

  if (trackKind === 'video') {
    tryUpdateVideo(newTrack, participantEle);
    return;
  }
  if (trackKind === 'audio') {
    tryUpdateAudio(newTrack, participantEle);
  }
}

export function updateConnectionTestResult(result) {
  const ele = getConnectionTestEle();
  ele.innerText = result;
}

export function updateConnectivityTestResult(result) {
  const ele = getConnectivtityTestEle();
  ele.innerText = result;
}

export function updateWebsocketTestResult(result) {
  const ele = getWebsocketTestEle();
  ele.innerText = result;
}

export function showTestResults() {
  getTestsEle().classList.remove(hiddenClassName);
}

export function hideTestResults() {
  getTestsEle().classList.add(hiddenClassName);
}

export function resetTestResults() {
  const connectionTestEle = getConnectionTestEle();
  connectionTestEle.innerText = '';
  connectionTestEle.append(createSpinner());

  const connectivityTestEle = getConnectivtityTestEle();
  connectivityTestEle.innerText = '';
  connectivityTestEle.append(createSpinner());

  const wsTestEle = getWebsocketTestEle();
  wsTestEle.innerText = '';
  wsTestEle.append(createSpinner());
}

/**
 * Adds a DOM element for the given participant
 * @param {DailyParticipant} participant 
 * @param {HTMLElement} parentEle 
 * @returns 
 */
export function addParticipantEle(participant, parentEle) {
  const sessionID = participant.session_id;
  const existingParticipantEle = getParticipantEle(sessionID);
  if (existingParticipantEle) return;

  const participantEle = document.createElement('div');
  participantEle.id = getParticipantEleID(sessionID);
  participantEle.className = 'participant';
  parentEle.appendChild(participantEle);

  // Add video tag
  const video = document.createElement('video');
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  participantEle.appendChild(video);

  // If this is a local participant, early-out as
  // we won't need to play their audio.
  if (participant.local) return;

  // Add audio tag
  const audio = document.createElement('audio');
  video.autoplay = true;
  participantEle.appendChild(audio);
}

/**
 * Removes all participant DOM elements
 */
export function removeAllParticipantEles() {
  const participantsContainer = document.getElementById('participants');
  const participants =
    participantsContainer.getElementsByClassName('participant');
  while (participants.length > 0) {
    const pEle = participants[0];
    removeMedia(pEle);
    pEle.remove();
  }
}

function getParticipantEle(sessionID) {
  return document.getElementById(getParticipantEleID(sessionID));
}

function tryUpdateVideo(newTrack, parentEle) {
  maybeUpdateTrack(newTrack, parentEle, 'video');
}

function tryUpdateAudio(newTrack, parentEle) {
  maybeUpdateTrack(newTrack, parentEle, 'audio');
}

/**
 * Updates a media stream track if the track has changed.
 * @param {MediaStreamTrack} newTrack 
 * @param {HTMLElement} parentEle 
 * @param {'video' | 'audio'} trackKind 
 * @returns 
 */
function maybeUpdateTrack(newTrack, parentEle, trackKind) {
  const mediaEles = parentEle.getElementsByTagName(trackKind);
  if (!mediaEles || mediaEles.length === 0) return;

  const mediaEle = mediaEles[0];
  const currentSrc = mediaEle.srcObject;
  if (!currentSrc) {
    mediaEle.srcObject = new MediaStream([newTrack]);
    return;
  }
  const currentTrack = currentSrc.getTracks()[0];

  // Replace tracks if IDs are not the same
  if (currentTrack.id !== newTrack) {
    currentSrc.removeTrack(currentTrack);
    currentSrc.addTrack(newTrack);
  }
}

/**
 * Removes any media on the given parent element.
 * @param {HTMLElement} parentEle 
 */
function removeMedia(parentEle) {
  const videoTag = parentEle.getElementsByTagName('video')[0];
  videoTag.srcObject = null;

  const audioTags = parentEle.getElementsByTagName('audio');
  if (audioTags && audioTags.length > 0) {
    audioTags[0].srcObject = null;
  }
}


function getParticipantEleID(sessionID) {
  return `participant-${sessionID}`;
}


function getTestsEle() {
  return document.getElementById('tests');
}

function getConnectionTestEle() {
  return document.getElementById('connection-test-results');
}

function getConnectivtityTestEle() {
  return document.getElementById('connectivity-test-results');
}
function getWebsocketTestEle() {
  return document.getElementById('websocket-test-results');
}

function createSpinner() {
  const ele = document.createElement('div');
  ele.className = 'spinner';
  return ele;
}
