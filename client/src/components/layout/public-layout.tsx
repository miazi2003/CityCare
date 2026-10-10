import type { ReactNode } from "react";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <PublicHeader />
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </div>
  );
}

