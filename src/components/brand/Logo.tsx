import { MARK_PATH, MARK_VIEWBOX } from "./mark-path";

type MarkProps = {
  className?: string;
  color?: string;
  title?: string;
};

export function Mark({ className, color = "#1DAE00", title }: MarkProps) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path fill={color} fillRule="evenodd" d={MARK_PATH} />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  /** "light" = black "Road" (default), "dark" = white "Road" for dark backgrounds */
  tone?: "light" | "dark";
};

/** Primary lock-up: shield mark + "Road" + green "Padi" set in Krona One. */
export function Logo({ className = "", tone = "light" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-[0.32em] ${className}`} aria-label="RoadPadi">
      <Mark className="h-[1.35em] w-auto shrink-0" />
      <span className="font-display leading-none tracking-[-0.02em]" aria-hidden>
        <span className={tone === "dark" ? "text-white" : "text-ink"}>Road</span>
        <span className="text-green">Padi</span>
      </span>
    </span>
  );
}
