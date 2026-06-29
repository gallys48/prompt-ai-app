import Link from "next/link";
import { PageContainer } from "@/components/page-container";

export default function HomePage() {
  return (
    <PageContainer>
      <section className="flex flex-1 flex-col items-start justify-center py-20">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-500">
            Prompt AI App
          </p>

          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            Платформа для промптов и AI-чатов
          </h1>

          <p className="mb-8 text-lg leading-8 text-zinc-600">
            Создавай промпты, запускай чаты на их основе и получай ответы от
            GigaChat через backend на FastAPI, RabbitMQ и Celery.
          </p>

          <div className="flex gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-zinc-950 px-5 py-3 text-white hover:bg-zinc-800"
            >
              Начать
            </Link>

            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-5 py-3 hover:bg-zinc-100"
            >
              Войти
            </Link>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}