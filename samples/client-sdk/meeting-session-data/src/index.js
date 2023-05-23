import {
  disableControls,
  enableControls,
  enableJoinForm,
  setupJoinForm,
  updateCamLabel,
  updateMicLabel,
} from './call/controls.js';
import {
  addParticipantEle,
  removeAllParticipantEles,
  removeParticipantEle,
  updateMedia,
} from './call/dom.js';

window.addEventListener('DOMContentLoaded', () => {
  const callObject = setupCallObject();
  setupJoinForm(callObject);
});

/**
 * setupCallObject() creates a new instance of Daily's call object
 * and sets up relevant Daily event handlers.
 * @returns {DailyCall}
 */
function setupCallObject() {
  const callObject = window.DailyIframe.createCallObject();

  const participantParentEle = document.getElementById('participants');

  // Set up relevant event handlers
  callObject
    .on('meeting-session-state-updated', (e) => {
      // When a meeting session state update event is received,
      // if it contains a joke, set the joke in the DOM.
      const { joke } = e.meetingSessionState.data;
      if (!joke) return;
      setJoke(joke);
    })
    .on('joined-meeting', (e) => {
      // When the local participant joins the call,
      // set up their call controls and add their video
      // element to the DOM.
      const p = e.participants.local;
      addParticipantEle(e.participants.local, participantParentEle);
      updateMedia(p);
      enableControls(callObject);
      setupJokeButton(callObject);
    })
    .on('left-meeting', () => {
      // When the local participant leaves the call,
      // disable their call controls and remove
      // all media elements from the DOM.
      disableControls();
      removeAllParticipantEles();
      disableJokeButton();
      hideJoke();
    })
    .on('participant-updated', (e) => {
      // When the local participant is updated,
      // check if their mic and cam are on and
      // update their call controls accordingly.
      const p = e.participant;
      if (!p.local) return;
      updateCamLabel(callObject.localVideo());
      updateMicLabel(callObject.localAudio());
    })
    .on('participant-joined', (e) => {
      // When a remote participant joins, add their
      // video and audio to the DOM.
      addParticipantEle(e.participant, participantParentEle);
    })
    .on('participant-left', (e) => {
      // When a remote participant joins, removec their
      // video and audio from the DOM.
      removeParticipantEle(e.participant.session_id);
    })
    .on('track-started', (e) => {
      // When a track starts, update the relevant
      // participant's media elements in the DOM.
      updateMedia(e.participant);
    })
    .on('error', (e) => {
      // If an unrecoverable error is received,
      // allow user to try to re-join the call.
      console.error('An unrecoverable error occurred: ', e);
      enableJoinForm();
    });

  return callObject;
}

/**
 * getJoke() fetches a dad joke and returns it as a string.
 * @returns {string} joke
 */
async function getJoke() {
  const url = 'https://icanhazdadjoke.com/';
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    const json = await res.json();
    const { joke } = json;
    return joke;
  } catch (err) {
    console.error('failed to fetch dad joke: ', err);
    return null;
  }
}

/**
 * setupJokeButton() defines the handler
 * for the "Tell a Joke!" call control button.
 * @param {DailyCall} callObject
 */
function setupJokeButton(callObject) {
  const btn = getJokeButton();
  btn.onclick = () => {
    getJoke().then((joke) => {
      // Update the meeting session data with the
      // new joke!
      callObject.setMeetingSessionData({
        joke,
      });
    });
  };
  enableJokeButton();
}

/**
 * enableJokeButton() makes the joke button clickable.
 */
function enableJokeButton() {
  const btn = getJokeButton();
  btn.disabled = false;
}

/**
 * disableJokeButton() makes the joke button unclickable.
 */
function disableJokeButton() {
  const btn = getJokeButton();
  btn.disabled = true;
}

/**
 * setJoke() sets the given joke as inner text
 * on the joke DOM element and makes the element visible.
 * @param {string} joke
 */
function setJoke(joke) {
  const ele = getJokeEle();
  ele.innerText = joke;
  ele.classList.remove('hidden');
}

/**
 * hidejoke() makes the joke DOM element invisible.
 */
function hideJoke() {
  const ele = getJokeEle();
  ele.classList.add('hidden');
}

/**
 * getJokeButton() returns the "Tell a Joke!" button element.
 * @returns HTMLButton
 */
function getJokeButton() {
  return document.getElementById('joke');
}

/**
 * getJokeEle() returns the joke container DOM element.
 * @returns HTMLElement
 */
function getJokeEle() {
  return document.getElementById('jokeEle');
}
