import { useCallback, useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import JoinForm from '../JoinForm/JoinForm';
import './daily-container.css';
import ParticipationTracker from '../ParticipationTracker/ParticipationTracker';

export default function DailyContainer() {
  const containerRef = useRef(null);
  const [callFrame, setCallFrame] = useState(null);
  const [roomUrl, setRoomUrl] = useState(null);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeSpeakerTally, setActiveSpeakerTally] = useState({});
  const [currentActiveSpeaker, setCurrentActiveSpeaker] = useState(null);
  const prevActiveSpeaker = useRef();

  useEffect(() => {
    console.log('current speaker updated');
    prevActiveSpeaker.current = currentActiveSpeaker;
  }, [currentActiveSpeaker]);

  useEffect(() => {
    // console.log(activeSpeakerTally);
  }, [activeSpeakerTally]);

  const addEndTimeToLastActiveSpeaker = () => {
    console.log('add end time');
    const prevASRef = prevActiveSpeaker.current;
    // Get the current time
    const time = Date.now();

    // Update state for active speaker list: add end time
    setActiveSpeakerTally((as) => {
      const tally = {
        ...as,
      };

      // Update last entry with the end and total speaking times
      const lastActiveSpeakerTimeEntry = {
        ...prevASRef,
        currentActiveSpeaker: false,
        endTime: time,
        total: time - prevASRef.startTime, // Speaking time
      };

      const lastASEntries = tally[prevASRef.id].entries;
      // Update the tally to include the end and total times
      lastASEntries[lastASEntries.length - 1] = lastActiveSpeakerTimeEntry;
      return tally;
    });
    setCurrentActiveSpeaker(null);
  };

  const addAndUpdateCurrentActiveSpeakerList = (
    newActiveSpeakerEntry,
    currentTime
  ) => {
    // Update the AS tally with the current speaker and (optionally) add the previous speaker's end time
    setActiveSpeakerTally((as) => {
      // Make a copy of the current tally
      const tally = {
        ...as,
      };

      const speakerId = newActiveSpeakerEntry.id;
      // Create a new item in the active speakers obj or push in the new entry
      if (!tally[speakerId]) {
        tally[speakerId] = {
          name: newActiveSpeakerEntry.name,
          entries: [newActiveSpeakerEntry],
        };
      } else {
        tally[speakerId].entries.push(newActiveSpeakerEntry);
      }

      const prevASRef = prevActiveSpeaker.current;

      // *IF* there was a previous active speaker, log their end time. (This will only be false the first time someone speaks or if everyone was muted.)
      if (prevASRef) {
        // Update last entry with the end and total speaking times
        const prevActiveSpeakerTimeEntry = {
          ...prevASRef,
          currentSpeaker: false,
          endTime: currentTime,
          total: currentTime - prevASRef.startTime, // Speaking time
        };

        const prevASEntries = tally[prevASRef.id].entries;
        // Update the tally to include the end and total times
        prevASEntries[prevASEntries.length - 1] = prevActiveSpeakerTimeEntry;
      }
      console.log(tally);
      return tally;
    });
    setCurrentActiveSpeaker(newActiveSpeakerEntry);
  };

  const handleActiveSpeakerChange = useCallback(
    (e, cf) => {
      console.log(e);
      const activeSpeakerId = e.activeSpeaker.peerId;
      const prevASRef = prevActiveSpeaker.current;

      console.log(activeSpeakerId, prevASRef?.id);

      // If *somehow* it's the same speaker, early out. (This shouldn't happen but just in case.)
      if (prevASRef?.id === activeSpeakerId) return;
      // If the active speaker ID is null, everyone is muted. Add an end time to last active speaker.
      if (!activeSpeakerId) {
        addEndTimeToLastActiveSpeaker();
        return;
      }

      // Get the current time
      const time = Date.now();

      // Retrieve all current call participants
      const participants = cf.participants();
      // Get the active speaker's user name from the participants object
      const activeSpeakerName = participants[activeSpeakerId]
        ? participants[activeSpeakerId].user_name
        : participants.local.user_name;

      // The new active speaker will have a start time but no end time (yet) since they're still speaking
      const newActiveSpeakerEntry = {
        name: activeSpeakerName,
        currentSpeaker: true,
        id: activeSpeakerId,
        startTime: time,
      };

      addAndUpdateCurrentActiveSpeakerList(newActiveSpeakerEntry, time);
    },
    [prevActiveSpeaker]
  );

  const handleError = (e) => {
    console.log(e.action);
    setError(e.errorMsg);
  };

  const handleLeftMeeting = useCallback(
    (e) => {
      console.log(e.action);

      if (callFrame) {
        // https://docs.daily.co/reference/daily-js/instance-methods/off
        callFrame
          .off('active-speaker-change', handleActiveSpeakerChange)
          .off('error', handleError);
      }

      // Reset state
      setCallFrame(null);
      setSubmitting(false);
    },
    [callFrame]
  );

  const addDailyEvents = (dailyCallFrame) => {
    // https://docs.daily.co/reference/daily-js/instance-methods/on
    dailyCallFrame
      .on('left-meeting', handleLeftMeeting)
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

      <div className='call' ref={containerRef}></div>
      {callFrame && (
        <ParticipationTracker activeSpeakerTally={activeSpeakerTally} />
      )}
    </div>
  );
}
