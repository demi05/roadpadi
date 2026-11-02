import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function TopBar() {
  return (
    <header className="flex items-center justify-between">
      <Link href="/home" aria-label="RoadPadi home">
        <Logo className="text-[16.5px]" />
      </Link>
      <Link
        href="/notifications"
        aria-label="Notifications"
        className="grid size-10 place-items-center rounded-full text-forest transition-colors hover:bg-mint"
      >
        <Bell className="size-[30px]" strokeWidth={2} aria-hidden />
      </Link>
    </header>
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mt-[44px] font-display text-[24px] leading-none tracking-[-0.04em]">{children}</h1>;
}
