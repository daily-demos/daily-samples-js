import { useCallback, useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import JoinForm from '../JoinForm/JoinForm';
import './daily-container.css';
import ParticipationTracker from '../ParticipationTracker/ParticipationTracker';
import useInterval from '../../app/hooks/useInterval';

export default function DailyContainer() {
  const containerRef = useRef(null);
  const [callFrame, setCallFrame] = useState(null);
  const [roomUrl, setRoomUrl] = useState(null);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeSpeakerTally, setActiveSpeakerTally] = useState({});
  const [currentActiveSpeaker, setCurrentActiveSpeaker] = useState(null);
  const prevActiveSpeaker = useRef();

  const delay = 2000; // Used to update speaker's total speaking time every ten seconds.

  useEffect(() => {
    console.log('current speaker updated');
    prevActiveSpeaker.current = currentActiveSpeaker;
  }, [currentActiveSpeaker]);

  // Start interval to update their speaking time as they speaker. This will be cleared when a new speaker change occurs.
  useInterval(
    () =>
      setActiveSpeakerTally((as) => {
        const tally = {
          ...as,
        };
        tally[currentActiveSpeaker.id].total += delay;
        return tally;
      }),
    currentActiveSpeaker ? delay : null
  );

  const endLastActiveSpeakerEntry = (speakerEntry) => {
    console.log('add end time');

    const { id, total } = speakerEntry;

    // Update state for active speaker list: add end time
    setActiveSpeakerTally((as) => {
      const tally = {
        ...as,
      };
      // If they've already spoken, we can update the existing total by setting the final speaking time
      if (tally[id]) {
        tally[id].total = total;
        console.log(tally);
      }
      return tally;
    });
  };

  const addCurrentActiveSpeakerToTally = (speakerEntry) => {
    console.log('start speaker time');

    // Update the AS tally with the current speaker and (optionally) add the previous speaker's end time
    setActiveSpeakerTally((as) => {
      // Make a copy of the current tally
      const tally = {
        ...as,
      };

      const { id, name } = speakerEntry;

      // If they haven't spoken, add their info to the tally.
      // Their speaking time will be 0ms to start and will be updated as they speak.
      if (!tally[id]) {
        tally[id] = {
          total: 0,
          name,
        };
      }
      return tally;
    });
  };

  /**
   * 1. End previous active speaker's time and add their total to the tally.
   * 2. Track new active speaker's start time to currentActiveSpeaker state and add them to the tally if they're not already in it.
   * 3. Start interval to update the tally while they're still speaking to let the tracker graph refresh as they speak.
   */
  const handleActiveSpeakerChange = useCallback(
    (e, cf) => {
      console.log(e);
      const activeSpeakerId = e.activeSpeaker.peerId;
      console.log('new current speaker', activeSpeakerId);
      const prevASRef = prevActiveSpeaker.current;

      console.log(activeSpeakerId, prevASRef?.id);

      // If *somehow* it's the same speaker, early out. (This shouldn't happen but just in case.)
      if (prevASRef?.id === activeSpeakerId) return;

      // Get the current time
      const currentTime = Date.now();
      let prevASEntry = null;
      // First, check if this is not the first speaker in the call and add the total speaking time to the previous speaker's stats to end their AS status.
      if (prevASRef) {
        prevASEntry = {
          ...prevASRef,
          total: currentTime - prevASRef.startTime,
        };
        endLastActiveSpeakerEntry(prevASEntry);
        setCurrentActiveSpeaker(null);
      }

      // If there's no current active speaker or there was a previous one, clear it in state to ensure the interval updating their total speaking time has stopped.
      if (!activeSpeakerId) {
        setCurrentActiveSpeaker(null);
        return;
      }

      // Next, update the state for this new speaker.

      // Retrieve all current call participants
      const participants = cf.participants();
      // Get the active speaker's user name from the participants object
      const activeSpeakerName = participants[activeSpeakerId]
        ? participants[activeSpeakerId].user_name
        : participants.local.user_name;
      console.log('active speaker name: ', activeSpeakerName);
      const speaker = {
        name: activeSpeakerName,
        startTime: currentTime,
        id: activeSpeakerId,
      };
      // Update the speaker tally
      addCurrentActiveSpeakerToTally(speaker);
      // Update the current speaker data
      setCurrentActiveSpeaker(speaker);
    },
    [prevActiveSpeaker]
  );

  const handleError = (e) => {
    console.log(e.action);
    setError(e.errorMsg);
  };

  const handleTrackStopped = (e) => {
    console.log('STOPPED!');
    console.log(e);
  };

  const handleLeftMeeting = useCallback(
    (e) => {
      console.log(e.action);

      if (callFrame) {
        // https://docs.daily.co/reference/daily-js/instance-methods/off
        callFrame
          .off('track-stopped', handleTrackStopped)
          .off('active-speaker-change', handleActiveSpeakerChange)
          .off('error', handleError);
      }

      // Reset state
      setCallFrame(null);
      setSubmitting(false);
      setActiveSpeakerTally({});
      setCurrentActiveSpeaker(null);
    },
    [callFrame]
  );

  const addDailyEvents = (dailyCallFrame) => {
    // https://docs.daily.co/reference/daily-js/instance-methods/on
    dailyCallFrame
      .on('left-meeting', handleLeftMeeting)
      .on('track-stopped', handleTrackStopped)
      .on('active-speaker-change', (e) =>
        handleActiveSpeakerChange(e, dailyCallFrame)
      )
      .on('error', handleError);
  };

  const joinRoom = async ({ name, url }) => {
    const callContainerDiv = containerRef.current;
    // https://docs.daily.co/reference/daily-js/factory-methods/create-frame
    const dailyCallFrame = DailyIframe.createFrame(callContainerDiv, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        aspectRatio: '16/10',
      },
    });

    addDailyEvents(dailyCallFrame);

    const options = { userName: name, url };

    setSubmitting(true);
    try {
      // https://docs.daily.co/reference/daily-js/instance-methods/join
      await dailyCallFrame.join(options);
      setCallFrame(dailyCallFrame);
      setRoomUrl(url);
      setSubmitting(false);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  const handleSubmitJoinForm = async (e) => {
    e.preventDefault();
    // Clear previous error
    setError(null);
    const { target } = e;
    const options = { name: target.name.value, url: target.url.value };

    joinRoom(options);
  };

  const leaveCall = useCallback(() => {
    // https://docs.daily.co/reference/daily-js/instance-methods/leave
    callFrame.leave();
    // https://docs.daily.co/reference/daily-js/instance-methods/destroy
    callFrame.destroy();
  }, [callFrame]);

  return (
    <div className='daily-container'>
      {error && (
        <p className='error-msg'>
          Error message: {error}. Refresh to start over.
        </p>
      )}
      {!callFrame && !submitting && !error && (
        <>
          <h2>Display participation stats while live in a Daily call</h2>
          <JoinForm handleSubmitForm={handleSubmitJoinForm} url={roomUrl} />
        </>
      )}
      {submitting && <p>Loading...</p>}
      {callFrame && (
        <>
          <p>
            External Daily room URL:{' '}
            <a href={roomUrl} target='_blank' rel='noopener noreferrer'>
              {roomUrl}
            </a>
          </p>
          <p>
            Current speaker:{' '}
            {currentActiveSpeaker?.name || 'No one is speaking'}
          </p>
          <p>Start time:{currentActiveSpeaker?.startTime || 'N/A'}</p>
        </>
      )}
      {callFrame && (
        <div className='call-header'>
          <button className='red-button' onClick={leaveCall}>
            Leave this call
          </button>
        </div>
      )}

      <div className='call-container'>
        <div className='call' ref={containerRef}></div>
        {callFrame && (
          <ParticipationTracker activeSpeakerTally={activeSpeakerTally} />
        )}
      </div>
    </div>
  );
}
