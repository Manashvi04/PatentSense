import React from 'react';

export default function AreaChart({ data = [], height = 160 }) {
  if (!data || data.length === 0) {
    return <div className="text-[#666666] text-xs text-center py-8">No statistics recorded</div>;
  }

  const padding = 25;
  const width = 500;
  
  const values = data.map(d => d.count || d.value || 0);
  const maxVal = Math.max(...values, 10);
  const minVal = 0;
  const valRange = maxVal - minVal;

  const points = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / (data.length - 1 || 1);
    const val = d.count !== undefined ? d.count : (d.value !== undefined ? d.value : 0);
    const y = height - padding - ((val - minVal) * (height - 2 * padding)) / valRange;
    return { x, y, value: val, label: d.date || d.label || '' };
  });

  let pathD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
  }

  const fillD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
    : "";

  return (
    <div className="w-full select-none">
      <svg className="w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} height={height}>
        <defs>
          <linearGradient id="monoChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding + ratio * (height - 2 * padding);
          return (
            <line
              key={idx}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#262626"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Gradient fill */}
        {fillD && <path d={fillD} fill="url(#monoChartGrad)" />}

        {/* Curve line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}

        {/* Circular nodes */}
        {points.map((p, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#0A0A0A"
              stroke="#FFFFFF"
              strokeWidth="2"
              className="transition-all duration-150 group-hover:scale-150"
            />
            {/* Tooltip */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
              <rect
                x={p.x - 20}
                y={p.y - 26}
                width="40"
                height="18"
                rx="4"
                fill="#262626"
                stroke="#404040"
                strokeWidth="1"
              />
              <text
                x={p.x}
                y={p.y - 14}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#FFF"
              >
                {p.value}
              </text>
            </g>
          </g>
        ))}

        {/* Timeline labels */}
        {points.map((p, idx) => (
          <text
            key={idx}
            x={p.x}
            y={height - 5}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="#666666"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
