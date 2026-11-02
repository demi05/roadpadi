type Props = {
  className?: string;
  variant?: "solid" | "outline" | "check" | "slash";
};

/** Simplified shield silhouette from the brand mark, used inside pills and badges. */
export function ShieldIcon({ className, variant = "solid" }: Props) {
  const shape = "M5 2.5h14a2.5 2.5 0 0 1 2.5 2.5v7.5a9.5 9.5 0 0 1-19 0V5A2.5 2.5 0 0 1 5 2.5Z";
  if (variant === "solid") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path d={shape} fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d={shape} strokeLinejoin="round" />
      {variant === "check" ? <path d="m7.5 11 4.5 4 6-6" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {variant === "slash" ? <path d="M4 20.5 20.5 3.5" strokeLinecap="round" /> : null}
    </svg>
  );
}
