interface Props {
  progress: number // 0–1
  size?: number    // viewBox/container size, default 16
}

export function ProgressArc({ progress, size = 16 }: Props) {
  const r = size * 0.375
  const circ = 2 * Math.PI * r
  const cx = size / 2
  const sw = size * 0.15625

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
      <circle cx={cx} cy={cx} r={r} fill="none" strokeWidth={sw} className="stroke-primary/25" />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        strokeWidth={sw}
        strokeLinecap="round"
        className="stroke-primary"
        strokeDasharray={`${progress * circ} ${circ}`}
      />
    </svg>
  )
}
