export function setupTestBtn(handler) {
  const testBtn = getTestBtn();
  testBtn.onclick = (ev) => {
    ev.preventDefault();
    handler();
  };
}

export function enableTestBtn() {
  const testBtn = getTestBtn();
  testBtn.disabled = false;
}

export function disableTestBtn() {
  const testBtn = getTestBtn();
  testBtn.disabled = true;
}

export function setupLeaveBtn(handler) {
  const btn = getLeaveBtn();
  btn.onclick = () => {
    ev.preventDefault();
    handler();
  };
}

export function enableControls() {
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
  enableTestBtn();
}

function getLeaveBtn() {
  return document.getElementById('leave');
}

function getTestBtn() {
  return document.getElementById('test');
}
