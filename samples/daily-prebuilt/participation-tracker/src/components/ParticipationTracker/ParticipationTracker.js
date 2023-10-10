import './participation-tracker.css';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import colors from '../../app/colors';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

// const options = {
//   responsive: true,
//   plugins: {
//     legend: {
//       position: 'top' as const,
//     },
//     title: {
//       display: true,
//       text: 'Chart.js Line Chart',
//     },
//   },
// };

const getTotalTime = (entry) => entry?.total || Date.now() - entry.startTime;

export default function ParticipationTracker({ activeSpeakerTally }) {
  if (!activeSpeakerTally) return null;

  const speakers = Object.values(activeSpeakerTally);
  const speakerNames = speakers.map((s) => s.name);

  // If the speaker is the current active speaker, they won't have a total time count yet. Use the current time as a placeholder.
  const totalSpeakerTimes = speakers.map((s) =>
    s.entries.reduce((total, entry) => total + getTotalTime(entry), 0)
  );

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

  const lineChartDataSets = speakers.map((s, i) => ({
    label: s.name,
    data: s.entries.map((e) => getTotalTime(e)),
    backgroundColor: backgroundColors[i],
  }));

  console.log(lineChartDataSets);

  const lineChartData = {
    labels: speakerNames,
    datasets: lineChartDataSets,
  };
  return (
    <div className='participation-tracker-container'>
      <div className='participation-tracker-graph'>
        <Doughnut data={barChartData} />
      </div>
      <div className='participation-tracker-graph'>
        <Line data={lineChartData} />
      </div>
    </div>
  );
}
