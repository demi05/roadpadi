import type { ReactNode } from "react";
import { SuccessBlob } from "./SuccessBlob";

type Props = {
  title: string;
  message: string;
  children?: ReactNode;
  action: ReactNode;
};

/** "Claim submitted" / "Payment set up" confirmation layout. */
export function SuccessScreen({ title, message, children, action }: Props) {
  return (
    <div className="min-h-dvh bg-wash">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-screen">
        <main className="flex flex-1 flex-col items-center pt-[172px] text-center">
          <SuccessBlob className="size-[190px]" />
          <h1 className="animate-fade-up mt-[26px] text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
          <p className="animate-fade-up mt-[16px] text-[16px]">{message}</p>
          {children}
        </main>
        <div className="pt-6 pb-[67px]">{action}</div>
      </div>
    </div>
  );
}
