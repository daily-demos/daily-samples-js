import {
  disableControls,
  enableControls,
  updateCamLabel,
  updateMicLabel,
} from './controls.js';
import {
  addParticipantEle,
  removeAllParticipantEles,
  removeParticipantEle,
  updateMedia,
} from './dom.js';

const dailyRoomURL = '[DAILY_ROOM_URL]';

window.addEventListener('DOMContentLoaded', () => {
  joinRoom();
});

function joinRoom() {
  const callObject = window.DailyIframe.createCallObject();

  const participantParentEle = document.getElementById('participants');
  callObject
    .on('meeting-session-state-updated', (e) => {
      setJoke(e.meetingSessionState.data.joke);
    })
    .on('joined-meeting', (e) => {
      const p = e.participants.local;
      addParticipantEle(e.participants.local, participantParentEle);
      updateMedia(p);
      enableControls(callObject);
      setupJokeButton(callObject);
    })
    .on('left-meeting', () => {
      disableControls();
      removeAllParticipantEles();
      disableJokeButton();
      hideJoke();
    })
    .on('participant-updated', (e) => {
      const p = e.participant;
      if (!p.local) return;
      updateCamLabel(callObject.localVideo());
      updateMicLabel(callObject.localAudio());
    })
    .on('participant-joined', (e) => {
      addParticipantEle(e.participant, participantParentEle);
    })
    .on('participant-left', (e) => {
      removeParticipantEle(e.participant.session_id);
    })
    .on('track-started', (e) => {
      updateMedia(e.participant);
    });

  callObject.join({ url: dailyRoomURL });
}

function setupJokeButton(callObject) {
  const btn = getJokeButton();
  btn.onclick = () => {
    getJoke().then((joke) => {
      callObject.setMeetingSessionData({
        joke,
      });
    });
  };
  enableJokeButton();
}

function enableJokeButton() {
  const btn = getJokeButton();
  btn.disabled = false;
}

function disableJokeButton() {
  const btn = getJokeButton();
  btn.disabled = true;
}

function setJoke(joke) {
  const ele = getJokeEle();
  ele.innerText = joke;
  ele.classList.remove('hidden');
}

function hideJoke() {
  const ele = getJokeEle();
  ele.classList.add('hidden');
}

function getJokeButton() {
  return document.getElementById('joke');
}

function getJokeEle() {
  return document.getElementById('jokeEle');
}
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
