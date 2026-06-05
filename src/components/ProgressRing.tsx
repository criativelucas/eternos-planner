interface ProgressRingProps {
  progress: number;
  secondaryProgress?: number;
  size?: number;
  strokeWidth?: number;
}

const ProgressRing = ({ progress, secondaryProgress, size = 160, strokeWidth = 8 }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const innerRadius = radius - strokeWidth - 4;
  const innerCircumference = innerRadius * 2 * Math.PI;
  const innerOffset = secondaryProgress !== undefined
    ? innerCircumference - (secondaryProgress / 100) * innerCircumference
    : 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        {secondaryProgress !== undefined && innerRadius > 0 && (
          <>
            <circle cx={size / 2} cy={size / 2} r={innerRadius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} opacity={0.5} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={innerRadius}
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth={strokeWidth}
              strokeDasharray={innerCircumference}
              strokeDashoffset={innerOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </>
        )}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-accent text-3xl text-foreground leading-none">{Math.round(progress)}%</span>
        <span className="text-[10px] text-muted-foreground font-body mt-1">concluído</span>
        {secondaryProgress !== undefined && (
          <>
            <span className="font-accent text-lg text-accent-foreground leading-none mt-1">{Math.round(secondaryProgress)}%</span>
            <span className="text-[10px] text-muted-foreground font-body">pago</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
