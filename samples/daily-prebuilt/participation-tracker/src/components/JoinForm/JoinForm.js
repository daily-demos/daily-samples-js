import './join-form.css';

export default function JoinForm({ handleSubmitForm }) {
  return (
    <div>
      <form className='join-form' onSubmit={handleSubmitForm}>
        <h3>Start by joining a Daily room of your choice.</h3>
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
