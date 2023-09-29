'use client';

import Header from '../components/Header/Header';
import './page.css';
import DailyContainer from '../components/DailyContainer/DailyContainer';

export default function Home() {
  return (
    <main className='main'>
      <div className='container'>
        <Header />
        <h1>Daily permissions demo</h1>
        <h2>
          Display participant participation stats while live in a Daily call
        </h2>

        <div className='content'>
          <DailyContainer />
        </div>
      </div>
    </main>
  );
}
