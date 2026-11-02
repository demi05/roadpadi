import { BottomNav } from "@/components/ui/BottomNav";

/** Home / Claims / Profile share the patterned background and bottom nav. */
export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="pattern-home min-h-dvh bg-fixed">
      <div className="mx-auto w-full max-w-[430px] px-screen pt-[46px] pb-[110px]">{children}</div>
      <BottomNav />
    </div>
  );
}
