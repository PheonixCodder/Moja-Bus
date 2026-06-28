import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-accent/30">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
