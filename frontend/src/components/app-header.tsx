import Link from "next/link";

import { AuthNav } from "@/components/auth-nav";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-white">
            AI
          </div>

          <div className="text-sm font-semibold text-neutral-100">
            Prompt AI
          </div>
        </Link>

        <AuthNav />
      </div>
    </header>
  );
}