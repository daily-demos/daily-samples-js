import "./join-form.css";

export default function JoinForm({ handleSubmitForm, url }) {
  return (
    <div>
      <form className="join-form" onSubmit={handleSubmitForm}>
        <label htmlFor="name">Your name</label>
        <input id="name" type="text" />
        {url && (
          <>
            <label htmlFor="url">Daily room URL</label>
            <input
              defaultValue={url}
              id="url"
              type="url"
              pattern="https://.*"
              placeholder="https://your-domain.daily.co/room-name"
              disabled
            />
          </>
        )}
        <input type="submit" />
      </form>
    </div>
  );
}
