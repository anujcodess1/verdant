export function Sparkline({ values, color = '#2f9e44', width = 132, height = 34, showArea = true }) {
  const data = values.length > 1 ? values : [0, 0];
  const max = Math.max(...data, 1);
  const step = width / (data.length - 1);
  const points = data.map((value, index) => [index * step, height - (value / max) * (height - 4) - 2]);
  const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true" className="overflow-visible">
      {showArea ? <path d={area} fill={color} fillOpacity="0.13" /> : null}
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3" fill={color} />
    </svg>
  );
}
