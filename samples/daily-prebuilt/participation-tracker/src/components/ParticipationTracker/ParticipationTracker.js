import './participation-tracker.css';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  Title,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import colors from '../../app/colors';
import SpeakerTotals from '../SpeakerTotals/SpeakerTotals';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, Title);

const options = {
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Total speaking times',
    },
  },
};

export default function ParticipationTracker({ activeSpeakerTally }) {
  if (!activeSpeakerTally || Object.keys(activeSpeakerTally).length < 1) {
    return <div className='participation-tracker-graph'></div>;
  }

  console.log(activeSpeakerTally);

  const speakers = Object.values(activeSpeakerTally);
  const speakerNames = speakers.map((s) => s.name);
  const totalSpeakerTimes = speakers.map((s) => s.total);

  const backgroundColors = colors.slice(0, speakers.length);

  const barChartData = {
    labels: speakerNames,
    datasets: [
      {
        label: 'Total speaking time',
        data: totalSpeakerTimes,
        backgroundColor: backgroundColors,
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className='participation-tracker-graph'>
      <Doughnut data={barChartData} options={options} />
      <SpeakerTotals speakers={speakers} backgroundColors={backgroundColors} />
    </div>
  );
}
