import {
  disableTestBtn,
  enableControls,
  enableTestBtn,
  setupLeaveBtn,
  setupTestBtn,
} from './call/controls.js';
import {
  addParticipantEle,
  resetTestResults,
  showTestResults,
  updateConnectionTestResult,
  updateConnectivityTestResult,
  updateMediaTrack,
  updateWebsocketTestResult,
} from './call/dom.js';

window.addEventListener('DOMContentLoaded', () => {
  const callObject = setupCallObject();
  // Set up the two main controls we have: running the tests and leaving
  setupTestBtn(() => {
    runTests(callObject);
  });
  setupLeaveBtn(() => {
    leave(callObject);
  });
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
    .on('track-started', (e) => {
      enableControls();
      showTestResults();
      const p = e.participant;
      if (!p.local) return;

      const newTrack = e.track;

      addParticipantEle(p, participantParentEle);
      updateMediaTrack(p.session_id, newTrack);
      enableControls(callObject);
      if (e.type === 'video') {
        doAllTests(callObject, newTrack);
      }
    })
    .on('error', (e) => {
      // If an unrecoverable error is received,
      // allow user to try to re-join the call.
      console.error('An unrecoverable error occurred: ', e);
      enableTestBtn();
    });

  return callObject;
}

/**
 * Runs Daily's connection test methods and presents the results.
 * @param {*} callObject 
 * @returns 
 */
function runTests(callObject) {
  disableTestBtn();

  // Reset results, in case this is a re-run.
  resetTestResults();

  // If local participant already exists and has a track,
  // just run the tests.
  const localParticipant = callObject.participants().local;
  const videoTrack = localParticipant?.tracks?.video?.persistentTrack;
  if (videoTrack) {
    doAllTests(callObject, videoTrack);
    return;
  }

  // If there is not yet a local participant or a video track,
  // start the camera.
  try {
    callObject.startCamera();
  } catch (e) {
    console.error('Failed to start camera', e);
    enableTestBtn();
  }
}

/**
 * Runs all of Daily's connection tests
 * @param {DailyCall} callObject 
 * @param {MediaStreamTrack} videoTrack 
 */
function doAllTests(callObject, videoTrack) {
  Promise.all([
    testConnectionQuality(callObject, videoTrack),
    testNetworkConnectivity(callObject, videoTrack),
    testWebSocketConnectivity(callObject),
  ]).then(() => {
    enableTestBtn();
  });
}

/**
 * Runs Daily's connection quality test and updates DOM with the result.
 * @param {DailyCall} callObject 
 * @param {MediaStreamTrack} videoTrack 
 * @returns 
 */
function testConnectionQuality(callObject, videoTrack) {
  return callObject
    .testConnectionQuality({
      videoTrack,
      duration: 5, // In seconds
    })
    .then((res) => {
      console.log('res:', res);
      const testResult = res.result;
      let resultMsg = '';
      switch (testResult) {
        case 'aborted':
          resultMsg = 'Test aborted before any data was gathered.';
          break;
        case 'failed':
          resultMsg = 'Unable to run test.';
          break;
        case 'bad':
          resultMsg =
            'Your internet connection is bad. Try a different network.';
          break;
        case 'warning':
          resultMsg = 'Video and audio might be choppy.';
          break;
        case 'good':
          resultMsg = 'Your internet connection is good.';
          break;
        default:
          resultMsg = `Unexpected connection test result: ${testResult}`;
      }
      updateConnectionTestResult(resultMsg);
    })
    .catch((e) => {
      console.error('Failed to test connection quality:', e);
    });
}

/**
 * Runs Daily's network connectivity test and updates DOM with the result.
 * @param {DailyCall} callObject 
 * @param {MediaStreamTrack} videoTrack 
 * @returns 
 */
function testNetworkConnectivity(callObject, videoTrack) {
  console.log('testing network connectivity');
  return callObject
    .testNetworkConnectivity(videoTrack)
    .then((res) => {
      const testResult = res.result;
      let resultMsg = '';
      switch (testResult) {
        case 'aborted':
          resultMsg = 'Test aborted.';
          break;
        case 'failed':
          resultMsg =
            'Connection attempt failed. Try a different network, or contact your network admin.';
          break;
        case 'passed':
          resultMsg = 'You are able to connect!';
          break;
        default:
          resultMsg = `Unexpected network connectivity test result: ${testResult}`;
      }
      updateConnectivityTestResult(resultMsg);
    })
    .catch((e) => {
      console.error('Failed to test network connectivity.', e);
    });
}

/**
 * Runs Daily's WebSocket connectivity test and updates DOM with the result.
 * @param {DailyCall} callObject 
 * @returns 
 */
function testWebSocketConnectivity(callObject) {
  console.log('testing WebSocket connectivity');
  return callObject
    .testWebsocketConnectivity()
    .then((res) => {
      const testResult = res.result;
      let resultMsg = '';

      switch (testResult) {
        case 'warning':
          resultMsg = `You are not able to connect to some regions via WebSockets: ${res.failedRegions.toString()}`;
          break;
        case 'failed':
          resultMsg =
            'You are not able to connect to any region via WebSockets. Contact your network admin.';
          break;
        case 'passed':
          resultMsg = 'You are able to connect to WebSockets in all regions.';
          break;
        default:
          resultMsg = `Unexpected network connectivity test result: ${JSON.stringify(
            testResult
          )}`;
      }
      updateWebsocketTestResult(resultMsg);
    })
    .catch((e) => {
      console.error('Failed to test WebSocket connectivity.', e);
    });
}

/**
 * Turns off camera, aborts and running tests, and takes user back to starting state.
 * @param {DailyCall} callObject 
 */
function leave(callObject) {
  callObject.setLocalVideo(false);
  callObject.abortTestNetworkConnectivity();
  callObject.abortTestWebsocketConnectivity();
  callObject.stopTestConnectionQuality();
  disableControls();
  removeAllParticipantEles();
  hideTestResults();
}