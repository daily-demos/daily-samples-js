import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import DailyIframe from "@daily-co/daily-js";
import JoinForm from "../JoinForm/JoinForm";
import AdminPanel from "../AdminPanel/AdminPanel";
import { api } from "../../daily";
import "./daily-container.css";

export default function DailyContainer() {
  const searchParams = useSearchParams();
  const containerRef = useRef(null);
  const [callFrame, setCallFrame] = useState(null);
  const [url, setUrl] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [participants, setParticipants] = useState({});
  const prevParticipants = useRef();

  useEffect(() => {
    prevParticipants.current = participants;
  }, [participants]);

  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setUrl(urlParam);
    }
  }, [searchParams]);

  const handleJoinedMeeting = (e) => {
    console.log(e.action);
    setParticipants((participants) => ({
      ...participants,
      [e.participants.local.session_id]: e.participants.local,
    }));
  };

  const handleParticipantJoined = (e) => {
    console.log(e.action);
    setParticipants((participants) => ({
      ...participants,
      [e.participant.session_id]: e.participant,
    }));
  };

  const handleParticipantUpdate = (e) => {
    console.log(e.action);
    // // Return early if the participant list isn't set yet.
    // // This event is sometimes emitted before the joined-meeting event.
    if (!prevParticipants.current[e.participant.session_id]) return;
    // Only update the participants list if the permission has changed.
    // Daily Prebuilt handles all other call changes for us.
    if (
      prevParticipants.current[e.participant.session_id].permissions
        .canAdmin !== e.participant.permissions.canAdmin
    ) {
      setParticipants((participants) => ({
        ...participants,
        [e.participant.session_id]: e.participant,
      }));
      if (e.participant.local) {
        setIsOwner(e.participant.permissions.canAdmin);
      }
    }
  };

  const handleParticipantLeft = (e) => {
    console.log(e.action);
    setParticipants((participants) => {
      const currentParticipants = { ...participants };
      delete currentParticipants[e.participant.session_id];
      return currentParticipants;
    });
  };

  const handleLeftMeeting = useCallback(
    (e) => {
      console.log(e.action);

      //Reset state
      setCallFrame(null);
      setIsOwner(false);
      setSubmitting(false);
      setParticipants({});
    },
    [callFrame]
  );

  const handleError = (e) => {
    console.log(e.action);
    setError(e.errorMsg);
  };

  const addDailyEvents = (callFrame) => {
    // https://docs.daily.co/reference/daily-js/events
    callFrame
      .on("joined-meeting", handleJoinedMeeting)
      .on("participant-joined", handleParticipantJoined)
      .on("participant-updated", handleParticipantUpdate)
      .on("participant-left", handleParticipantLeft)
      .on("left-meeting", handleLeftMeeting)
      .on("error", handleError);
  };

  const removeDailyEvents = (callFrame) => {
    callFrame
      .off("joined-meeting", handleJoinedMeeting)
      .off("participant-joined", handleParticipantJoined)
      .off("participant-updated", handleParticipantUpdate)
      .off("participant-left", handleParticipantLeft)
      .off("left-meeting", handleLeftMeeting)
      .off("error", handleError);
  };

  const joinRoom = async ({ name, url, token, isOwner }) => {
    name, url, token;
    const callContainerDiv = containerRef.current;
    // https://docs.daily.co/reference/daily-js/factory-methods/create-frame
    const dailyCallFrame = DailyIframe.createFrame(callContainerDiv, {
      iframeStyle: {
        width: "100%",
        height: "100%",
      },
    });

    addDailyEvents(dailyCallFrame);

    const options = { userName: name, url };
    if (token) {
      setIsOwner(isOwner);
      options.token = token;
    }

    setSubmitting(true);
    try {
      // https://docs.daily.co/reference/daily-js/instance-methods/join
      await dailyCallFrame.join(options);
      setCallFrame(dailyCallFrame);
      setUrl(url);
      setSubmitting(false);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  const createToken = async (options) => {
    const { token } = await api.createToken(options);
    if (token) {
      return token;
    } else {
      console.error("Token creation failed.");
      return null;
    }
  };

  const createNewRoom = async () => {
    const newRoom = await api.createRoom();
    if (!newRoom.url) {
      console.error("Room could not be created. Please try again.");
      return null;
    }
    return newRoom;
  };

  const handleSubmitJoinForm = async (e) => {
    e.preventDefault();
    // Clear previous error
    setError(null);
    const { target } = e;
    let options = { name: target.name.value };

    // Use the existing room supplied in the query param if it's provided (or create a new room)
    const existingRoomUrl = target?.url?.value;
    if (target?.url?.value) {
      options.url = existingRoomUrl;
      options.roomName = existingRoomUrl.split(".co/")[1];
      options.isOwner = false;
    } else {
      // Create a new Daily room when the form is submitted
      const newRoom = await createNewRoom();
      if (!newRoom) return; // error is thrown in createNewRoom
      options.url = newRoom.url;
      options.roomName = newRoom.name;
      options.isOwner = true;

      // Create an owner meeting token
      const newToken = await createToken({
        roomName: newRoom.name,
        isOwner: true,
      });
      if (!newToken) return; // error is thrown in createToken
      options.token = newToken;
    }

    joinRoom(options);
  };

  const removeFromCall = useCallback(
    (participantId) => {
      // https://docs.daily.co/reference/daily-js/instance-methods/update-participant#setaudio-setvideo-and-eject
      callFrame.updateParticipant(participantId, {
        eject: true,
      });
    },
    [callFrame]
  );

  const makeAdmin = useCallback(
    (participantId) => {
      // https://docs.daily.co/reference/daily-js/instance-methods/update-participant#permissions
      callFrame.updateParticipant(participantId, {
        updatePermissions: {
          canAdmin: true,
        },
      });
    },
    [callFrame]
  );

  const leaveCall = useCallback(() => {
    // https://docs.daily.co/reference/daily-js/instance-methods/leave
    callFrame.leave();
    removeDailyEvents(callFrame);
    callFrame.destroy();
  }, [callFrame, removeDailyEvents]);

  const localLink = useCallback(
    () => `http://localhost:3000/?url=${url}`,
    [url]
  );

  return (
    <div className="daily-container">
      {error && (
        <p className="error-msg">
          Error message: {error}. Refresh to start over.
        </p>
      )}
      {!callFrame && !submitting && !error && (
        <>
          <h3>Create a new Daily room and join as an owner.</h3>
          <JoinForm handleSubmitForm={handleSubmitJoinForm} url={url} />
        </>
      )}
      {submitting && <p>Loading...</p>}
      {callFrame && (
        <>
          <p>
            <span>Share this link to let others join:</span>{" "}
            <a href={localLink()} target="_blank" rel="noopener noreferrer">
              {localLink()}
            </a>
          </p>
          <p>
            External Daily room URL:{" "}
            <a href={url} target="_blank" rel="noopener noreferrer">
              {url}
            </a>
          </p>
        </>
      )}

      {callFrame && (
        <>
          <AdminPanel
            participants={participants}
            isOwner={isOwner}
            makeAdmin={makeAdmin}
            removeFromCall={removeFromCall}
          />
          <div className="call-header">
            <button className="red-button" onClick={leaveCall}>
              Leave this call
            </button>
          </div>
        </>
      )}
      <div className="call" ref={containerRef}></div>
    </div>
  );
}
