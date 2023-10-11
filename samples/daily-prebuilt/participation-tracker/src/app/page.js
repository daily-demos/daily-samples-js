'use client';

import Header from '../components/Header/Header';
import './page.css';
import DailyContainer from '../components/DailyContainer/DailyContainer';

export default function Home() {
  return (
    <main className='main'>
      <div className='container'>
        <Header />
        <h1>Daily participation tracker demo</h1>

        <div className='content'>
          <DailyContainer />
        </div>
      </div>
    </main>
  );
}
