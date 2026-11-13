import React from 'react';

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percent,
  size = 92,
  strokeWidth = 9,
  label
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const center = size / 2;
  const offset = circumference * (1 - clamped / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flex: 'none' }}
      role="img"
      aria-label={label}
    >
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="var(--sf)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="var(--ac)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--ink)"
        fontFamily="var(--font-display)"
        fontWeight="700"
        fontSize={size > 120 ? 34 : 18}
      >
        {label}
      </text>
    </svg>
  );
};

