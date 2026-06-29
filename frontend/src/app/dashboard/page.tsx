import Link from "next/link";
import { PageContainer } from "@/components/page-container";

export default function DashboardPage() {
  return (
    <PageContainer>
      <div className="py-10">
        <h1 className="mb-2 text-3xl font-semibold">Dashboard</h1>
        <p className="mb-8 text-zinc-500">
          Здесь позже будет рабочая область пользователя.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/prompts"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:bg-zinc-50"
          >
            <h2 className="mb-2 text-xl font-semibold">Промпты</h2>
            <p className="text-sm text-zinc-500">
              Создание, редактирование и запуск промптов.
            </p>
          </Link>

          <Link
            href="/chats"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:bg-zinc-50"
          >
            <h2 className="mb-2 text-xl font-semibold">Чаты</h2>
            <p className="text-sm text-zinc-500">
              Диалоги с AI и история сообщений.
            </p>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}