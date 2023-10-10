import './join-form.css';

export default function JoinForm({ handleSubmitForm }) {
  return (
    <div>
      <h3>Join a Daily room of your choice.</h3>

      <form className='join-form' onSubmit={handleSubmitForm}>
        <label htmlFor='name'>Your name</label>
        <input id='name' type='text' />
        <label htmlFor='url'>Daily room URL</label>
        <input
          id='url'
          type='url'
          pattern='https://.*'
          placeholder='https://your-domain.daily.co/room-name'
        />
        <input type='submit' />
      </form>
    </div>
  );
}
