import Link from "next/link";

import { AuthNav } from "@/components/auth-nav";

export function AppHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold">
          Prompt AI App
        </Link>

        <AuthNav />
      </div>
    </header>
  );
}