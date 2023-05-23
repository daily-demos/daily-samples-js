export function setupJoinForm(callObject) {
  const joinForm = getJoinForm();
  joinForm.onsubmit = (ev) => {
    ev.preventDefault();

    // Disable join button to avoid double-join attempts
    const btn = joinForm.getElementsByTagName('button')[0];
    btn.disabled = true;

    const roomURLInput = joinForm.getElementsByTagName('input')[0];
    try {
      callObject.join({ url: roomURLInput.value });
    } catch (e) {
      console.error('Failed to join Daily room', e);
      enableJoinForm();
    }
  };
}

export function enableJoinForm() {
  const joinForm = getJoinForm();
  const btn = joinForm.getElementsByTagName('button')[0];
  btn.disabled = false;
}

export function setupMicToggle(callObject) {
  const btn = getMicBtn();
  btn.onclick = () => {
    const micOn = callObject.localAudio();
    callObject.setLocalAudio(!micOn);
  };
}

export function updateMicLabel(isOn) {
  const btn = getMicBtn();
  if (isOn) {
    btn.innerText = 'Disable Mic';
  } else {
    btn.innerText = 'Enable Mic';
  }
}

export function updateCamLabel(isOn) {
  const btn = getCamBtn();
  if (isOn) {
    btn.innerText = 'Disable Cam';
  } else {
    btn.innerText = 'Enable Cam';
  }
}

export function setupCamToggle(callObject) {
  const btn = getCamBtn();
  btn.onclick = () => {
    const camOn = callObject.localVideo();
    callObject.setLocalVideo(!camOn);
  };
}

export function setupLeave(callObject) {
  const btn = getLeaveBtn();
  btn.onclick = () => {
    callObject.leave();
  };
}

export function enableControls(callObject) {
  setupMicToggle(callObject);
  setupCamToggle(callObject);
  setupLeave(callObject);
  const incallEle = document.getElementById('incall');
  const allButtons = incallEle.getElementsByTagName('button');
  for (let i = 0; i < allButtons.length; i += 1) {
    const btn = allButtons[i];
    btn.disabled = false;
  }
}

export function disableControls() {
  const incallEle = document.getElementById('incall');
  const allButtons = incallEle.getElementsByTagName('button');
  for (let i = 0; i < allButtons.length; i += 1) {
    const btn = allButtons[i];
    btn.disabled = true;
  }
  enableJoinForm();
}

function getMicBtn() {
  return document.getElementById('mic');
}

function getCamBtn() {
  return document.getElementById('cam');
}

function getLeaveBtn() {
  return document.getElementById('leave');
}

function getJoinForm() {
  return document.getElementById('join');
}
