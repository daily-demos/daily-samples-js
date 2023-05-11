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
  const allButtons = document.getElementsByTagName('button');
  for (let i = 0; i < allButtons.length; i += 1) {
    const btn = allButtons[i];
    btn.disabled = false;
  }
}

export function disableControls() {
  const allButtons = document.getElementsByTagName('button');
  for (let i = 0; i < allButtons.length; i += 1) {
    const btn = allButtons[i];
    btn.disabled = true;
  }
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
