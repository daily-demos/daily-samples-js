let callFrame = null;

document.addEventListener('DOMContentLoaded', () => {
  const joinForm = document.getElementById('joinForm');
  const callContainer = document.getElementById('dailyContainer');

  function handleLeftMeeting() {
    // Show the form and hide the call container
    joinForm.style.display = 'block';
    callContainer.style.display = 'none';
    callFrame.destroy().then(() => {
      callFrame = null;
    });
  }

  function createAndJoinCall(e) {
    e.preventDefault();
    const dailyRoomUrl = e.target.url.value;
    callFrame = window.DailyIframe.createFrame(callContainer);
    callFrame.on('left-meeting', handleLeftMeeting);

    // Hide the form and show the call container
    joinForm.style.display = 'none';
    callContainer.style.display = 'block';

    try {
      callFrame.join({
        url: dailyRoomUrl,
        showLeaveButton: true,
      });
    } catch (error) {
      console.error(error);
    }
  }

  joinForm.onsubmit = createAndJoinCall;
});

/**
 * SCROLL EVENT: UPDATE VIDEO CALL ELEMENT SIZE ON SCROLL
 */

// Reusable throttle function for scroll event
function throttle(func, timeFrame) {
  let lastTime = 0;
  function checkTime() {
    const now = new Date();
    if (now - lastTime >= timeFrame) {
      func();
      lastTime = now;
    }
  }
  return checkTime;
}

// Add the `scrolled` class when the window is scrolled
function handleScroll() {
  const callContainer = document.getElementById('dailyContainer');
  const notInCall = window.getComputedStyle(callContainer).display === 'none';
  const { top } = callContainer.getBoundingClientRect();
  const scrolled = callContainer.classList.contains('scrolled');
  const threshold = 80;

  // Don't apply scroll logic when local participant isn't in the call or it just updated.
  if (notInCall) return;
  // Don't update the class list if it's already marked correctly for its placement.
  if ((scrolled && top === 0) || (!scrolled && top > 0)) return;

  // Remove scrolled class if it's scrolled back up.
  if (scrolled && top > threshold) {
    callContainer.classList.remove('scrolled');
  }
  // Add scrolled class otherwise.
  else {
    callContainer.classList.add('scrolled');
  }
}

document.addEventListener('scroll', throttle(handleScroll, 100));
