import React, { useEffect, useState } from 'react';

export default function Gauge({ value, label, size = 180, isNovelty = true }) {
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    const progress = Math.max(0, Math.min(100, Number(value)));
    const targetOffset = circumference - (progress / 100) * circumference;
    
    const frame = requestAnimationFrame(() => {
      setDashOffset(targetOffset);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, circumference]);

  const getStrokeColor = () => {
    const val = Number(value);
    if (isNovelty) {
      if (val >= 75) return 'var(--color-success)';   // High novelty is good (Green)
      if (val >= 45) return 'var(--color-warning)';   // Medium novelty is moderate (Orange)
      return 'var(--color-danger)';                  // Low novelty is bad (Red)
    } else {
      if (val >= 55) return 'var(--color-danger)';   // High similarity is bad (Red)
      if (val >= 25) return 'var(--color-warning)';   // Medium similarity is moderate (Orange)
      return 'var(--color-success)';                  // Low similarity is good (Green)
    }
  };

  return (
    <div className="gauge-container" style={{ width: size, height: size }}>
      <svg className="gauge-svg" width={size} height={size} viewBox="0 0 160 160">
        <circle
          className="gauge-bg"
          cx="80"
          cy="80"
          r={radius}
        />
        <circle
          className="gauge-fill"
          cx="80"
          cy="80"
          r={radius}
          stroke={getStrokeColor()}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 4px ${getStrokeColor()})` }}
        />
      </svg>
      <div className="gauge-center-text">
        <span className="gauge-value" style={{ color: getStrokeColor() }}>
          {value}%
        </span>
        <div className="gauge-label">{label}</div>
      </div>
    </div>
  );
}
