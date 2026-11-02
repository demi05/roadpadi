import type { ComponentProps, ReactNode } from "react";

const box =
  "w-full rounded-card bg-mint text-[16px] text-ink placeholder:text-ink/45 outline-none ring-green/60 transition-shadow focus:ring-2";

type FieldShellProps = { label: string; htmlFor: string; children: ReactNode; className?: string };

/** "Label Above" field from the style guide. */
export function FieldShell({ label, htmlFor, children, className = "" }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-[9px] block text-[12px] font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

type InputProps = ComponentProps<"input"> & { label: string; icon?: ReactNode };

export function TextField({ label, icon, id, className = "", ...rest }: InputProps) {
  const fieldId = id ?? rest.name ?? label;
  return (
    <FieldShell label={label} htmlFor={fieldId} className={className}>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute top-1/2 left-[19px] -translate-y-1/2 text-ink/80">{icon}</span>
        ) : null}
        <input id={fieldId} className={`${box} h-[58px] pr-4 pl-[49px]`} {...rest} />
      </div>
    </FieldShell>
  );
}

type AreaProps = ComponentProps<"textarea"> & { label: string };

export function TextArea({ label, id, className = "", ...rest }: AreaProps) {
  const fieldId = id ?? rest.name ?? label;
  return (
    <FieldShell label={label} htmlFor={fieldId} className={className}>
      <textarea id={fieldId} className={`${box} min-h-[216px] resize-none px-5 py-4`} {...rest} />
    </FieldShell>
  );
}

/** Read-only info card (style guide "Info Card"). */
export function InfoRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex min-h-[39px] items-center rounded-[8px] bg-mint px-5 text-[16px] font-semibold ${className}`}>
      {children}
    </div>
  );
}
