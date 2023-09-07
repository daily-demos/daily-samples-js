import { hideTestResults, removeAllParticipantEles } from './dom.js';

/**
 * Configures the test button onclick handler
 * @param {()} handler
 */
export function setupTestBtn(handler) {
  const testBtn = getTestBtn();
  testBtn.onclick = (ev) => {
    ev.preventDefault();
    handler();
  };
}

/**
 * Enables the test button
 */
export function enableTestBtn() {
  const testBtn = getTestBtn();
  testBtn.disabled = false;
}

/**
 * Disables the test button
 */
export function disableTestBtn() {
  const testBtn = getTestBtn();
  testBtn.disabled = true;
}

/**
 * Configures the leave button onclick handler
 * @param {()} handler
 */
export function setupLeaveBtn(handler) {
  const btn = getLeaveBtn();
  btn.onclick = (ev) => {
    ev.preventDefault();
    disableControls();
    removeAllParticipantEles();
    hideTestResults();
    handler();
  };
}

/**
 * Enables the call controls
 */
export function enableControls() {
  const incallEle = document.getElementById('incall');
  const allButtons = incallEle.getElementsByTagName('button');
  for (let i = 0; i < allButtons.length; i += 1) {
    const btn = allButtons[i];
    btn.disabled = false;
  }
}

/**
 * Disables the call controls
 */
export function disableControls() {
  const incallEle = document.getElementById('incall');
  const allButtons = incallEle.getElementsByTagName('button');
  for (let i = 0; i < allButtons.length; i += 1) {
    const btn = allButtons[i];
    btn.disabled = true;
  }
}

function getLeaveBtn() {
  return document.getElementById('leave');
}

function getTestBtn() {
  return document.getElementById('test');
}
