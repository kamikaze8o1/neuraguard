// Lightweight hand-rolled SVG line chart for live-updating numeric traces
// (RR tachogram, raw PPG wave, motion magnitude). Deliberately avoids a
// heavy charting library for anything that re-renders many times per
// second — recharts is reserved for the one-shot averaged AEP plot.
export function SvgSparkline({
  data,
  width = 320,
  height = 80,
  stroke = "#39ff8f",
  fill,
  strokeWidth = 2,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <text x={width / 2} y={height / 2} textAnchor="middle" className="fill-current text-xs opacity-40">
          Waiting for signal…
        </text>
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const areaPath = fill
    ? `${linePath} L${width},${height} L0,${height} Z`
    : undefined;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      {areaPath && <path d={areaPath} fill={fill} opacity={0.15} stroke="none" />}
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
