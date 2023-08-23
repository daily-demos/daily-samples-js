import "./admin-panel.css";

const ParticipantListItem = ({
  p,
  makeAdmin,
  removeFromCall,
  isOwner,
  count,
}) => (
  <li>
    <span>
      {`${count}. `}
      <b>
        {p.permissions.canAdmin && "Admin | "}
        {p.local && "(You) "}
      </b>
      {p.user_name}: {p.session_id}
    </span>{" "}
    {!p.local && !p.permissions.canAdmin && isOwner && (
      <span className="buttons">
        <button className="red-button-secondary" onClick={removeFromCall}>
          Remove from call
        </button>
        <button onClick={makeAdmin}>Make admin</button>
      </span>
    )}
  </li>
);

export default function AdminPanel({
  participants,
  makeAdmin,
  removeFromCall,
  isOwner,
}) {
  return (
    <div className="admin-panel">
      <h3>Participant list</h3>
      {isOwner ? (
        <p>
          You are a meeting owner and can remove <b>non-admins</b> or make them
          admins
        </p>
      ) : (
        <p>
          You are a call attendee. If a meeting owner gives you admin
          privileges, additional actions will become available.
        </p>
      )}

      <ul>
        {Object.values(participants).map((p, i) => {
          const handleMakeAdmin = () => makeAdmin(p.session_id);
          const handleRemoveFromCall = () => removeFromCall(p.session_id);
          return (
            <ParticipantListItem
              count={i + 1} // for numbered list
              key={p.session_id}
              p={p}
              isOwner={isOwner}
              makeAdmin={handleMakeAdmin}
              removeFromCall={handleRemoveFromCall}
            />
          );
        })}
      </ul>
    </div>
  );
}
