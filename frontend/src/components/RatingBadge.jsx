export default function RatingBadge({ score, size = 40, label, color = "#38bdf8" }) {
  const display = typeof score === "number" ? score.toFixed(1) : "—";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="17" stroke="#253b61" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="17" stroke={color} strokeWidth="1.5" opacity="0.9" />
        <text x="20" y="25" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="12.5" fontWeight="500" fill="#f8fafc">
          {display}
        </text>
      </svg>
      {label && <span className="text-[10px] font-mono text-muted uppercase tracking-wide">{label}</span>}
    </div>
  );
}