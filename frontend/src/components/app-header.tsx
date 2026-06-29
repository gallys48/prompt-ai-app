import Link from "next/link";

export function AppHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold">
          Prompt AI App
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-zinc-700 hover:text-zinc-950">
            Войти
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-zinc-950 px-4 py-2 text-white hover:bg-zinc-800"
          >
            Регистрация
          </Link>
        </nav>
      </div>
    </header>
  );
}