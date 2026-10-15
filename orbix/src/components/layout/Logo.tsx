type Props = { className?: string }

/** A cell (center) and the orbit its materials travel back on. */
export function Logo({ className }: Props) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <ellipse
        cx="16"
        cy="16"
        rx="12"
        ry="5.2"
        transform="rotate(-28 16 16)"
        stroke="rgb(var(--accent))"
        strokeWidth="2.2"
      />
      <circle cx="16" cy="16" r="4.2" fill="currentColor" />
    </svg>
  )
}
