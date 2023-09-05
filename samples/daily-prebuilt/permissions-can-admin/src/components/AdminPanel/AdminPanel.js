import './admin-panel.css';

const ParticipantListItem = ({
  p,
  makeAdmin,
  removeFromCall,
  localIsOwner,
  localIsAdmin,
  count,
}) => (
  <li>
    <span>
      {`${count}. `}
      {p.permissions.canAdmin && <b>{p.owner ? 'Owner | ' : 'Admin | '}</b>}
      <b>{p.local && '(You) '}</b>
      {p.user_name}: {p.session_id}
    </span>{' '}
    {!p.local && !p.owner && (localIsAdmin || localIsOwner) && (
      <span className='buttons'>
        {(!p.permissions.canAdmin || localIsOwner) && (
          <button className='red-button-secondary' onClick={removeFromCall}>
            Remove from call
          </button>
        )}
        {!p.permissions.canAdmin && (
          <button onClick={makeAdmin}>Make admin</button>
        )}
      </span>
    )}
  </li>
);

export default function AdminPanel({
  participants,
  makeAdmin,
  removeFromCall,
  localIsOwner,
  localIsAdmin,
}) {
  return (
    <div className='admin-panel'>
      <h3>Participant list</h3>
      {localIsOwner && (
        <p>
          You are a meeting owner and can remove <b>non-owners</b>
          or make them admins.
        </p>
      )}

      {localIsAdmin && (
        <p>
          You have meeting admin privileges to remove <b>non-admins</b>
          or make them admins.
        </p>
      )}

      {!localIsOwner && !localIsAdmin && (
        <p>
          You are a call attendee. If a meeting owner or admin gives you admin
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
              localIsOwner={localIsOwner}
              localIsAdmin={localIsAdmin}
              makeAdmin={handleMakeAdmin}
              removeFromCall={handleRemoveFromCall}
            />
          );
        })}
      </ul>
    </div>
  );
}
