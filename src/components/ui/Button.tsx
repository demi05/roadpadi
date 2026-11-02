import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

/*
  Style guide buttons (radius 10):
  - primary:   #8FFF78 fill, black label
  - cta:       #4CF52A fill, black label (Continue / Submit / Start on flow screens)
  - secondary: green outline, green label
  - alternate: #1DAE00 fill, #FFD3D3 label
*/
export type ButtonVariant = "primary" | "cta" | "secondary" | "alternate" | "dark";
type Size = "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-leaf text-ink hover:brightness-[0.97]",
  cta: "bg-lime text-ink hover:brightness-[0.97]",
  secondary: "border-[1.5px] border-green bg-white text-green hover:bg-mint/40",
  alternate: "bg-green text-blush hover:brightness-[1.05]",
  dark: "bg-forest text-white hover:brightness-110",
};

const sizes: Record<Size, string> = {
  md: "h-12 text-[20px]",
  lg: "h-[58px] text-[20px]",
};

export function buttonClass(variant: ButtonVariant = "primary", size: Size = "md", extra = "") {
  return [
    "inline-flex w-full items-center justify-center gap-2 rounded-btn px-4 font-semibold tracking-[-0.01em]",
    "transition-[filter,background-color,transform] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
    variants[variant],
    sizes[size],
    extra,
  ].join(" ");
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: Size;
  loading?: boolean;
};

export function Button({ variant, size, loading, className = "", children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: Size;
  children: ReactNode;
};

export function LinkButton({ variant, size, className = "", ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
