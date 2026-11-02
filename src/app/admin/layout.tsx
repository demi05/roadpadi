"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Users } from "lucide-react";
import { Mark } from "@/components/brand/Logo";
import { useMe } from "@/lib/hooks";

const NAV = [
  { href: "/admin/claims", label: "Claims", Icon: FileText },
  { href: "/admin/drivers", label: "Drivers", Icon: Users },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const pathname = usePathname();
  const me = useMe();
  const allowed = me.data?.profile.role === "admin";

  return (
    <div className="min-h-dvh bg-wash lg:flex">
      <aside className="bg-forest text-white lg:sticky lg:top-0 lg:h-dvh lg:w-[279px] lg:shrink-0">
        <div className="flex items-center gap-4 px-5 py-4 lg:px-[46px] lg:pt-[65px] lg:pb-0">
          <Mark color="#ffffff" className="h-[50px] w-auto" />
          <span className="text-[26px] font-medium tracking-[-0.01em]">Admin</span>
        </div>
        <nav className="flex gap-2 px-5 pb-4 lg:mt-[39px] lg:flex-col lg:gap-[46px] lg:px-[46px]">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-12 items-center gap-[17px] rounded-btn px-4 text-[18px] font-semibold transition-colors lg:h-[71px] lg:px-[20px] ${
                  active ? "bg-lime text-ink" : "text-white hover:bg-white/10"
                }`}
              >
                <Icon className={`size-[30px] ${active ? "text-forest" : "text-white"}`} strokeWidth={1.5} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 lg:px-[89px] lg:pt-[80px]">
        {me.loading ? (
          <div className="h-40 max-w-[896px] animate-pulse rounded-card bg-mint" />
        ) : allowed ? (
          children
        ) : (
          <div className="max-w-md rounded-card bg-mint p-6">
            <h1 className="text-[22px] font-semibold">Admins only</h1>
            <p className="mt-2 text-[16px]">
              This account doesn&apos;t have admin access. Ask the team to promote your account (see
              supabase/make-admin.sql).
            </p>
            <Link href="/home" className="mt-4 inline-block font-semibold text-green underline underline-offset-4">
              Back to the app
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
