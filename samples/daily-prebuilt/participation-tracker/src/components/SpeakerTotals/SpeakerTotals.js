import './speaker-totals.css';

export default function SpeakerTotals({ speakers, backgroundColors }) {
  if (!speakers || speakers.length < 1) {
    return <div className='speaker-totals'></div>;
  }
  return (
    <div className='speaker-totals'>
      <table>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Time (s)</th>
        </tr>
        {speakers.map((s, i) => (
          <tr key={i}>
            <td
              className='color-cell'
              style={{ backgroundColor: backgroundColors[i] }}></td>
            <td>{s.name}</td>
            <td>{s.total / 1000}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}
