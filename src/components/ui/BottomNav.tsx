"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, House, User } from "lucide-react";

const items = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/claims", label: "Claims", Icon: FileText },
  { href: "/profile", label: "Profile", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-green bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex h-[66px] max-w-[430px] items-center justify-between px-[38px]">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-[3px] text-[10px] font-semibold ${active ? "text-forest" : "text-ink/70"}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.5} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
