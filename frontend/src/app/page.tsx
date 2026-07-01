import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-100">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500 text-2xl font-bold text-white shadow-lg shadow-emerald-500/20">
          AI
        </div>

        <p className="mb-4 rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-400">
          FastAPI · Next.js · GigaChat · RabbitMQ · Celery
        </p>

        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
          Платформа для промптов и AI-чатов
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-400 md:text-lg">
          Создавай промпты, запускай чаты, редактируй сообщение перед отправкой
          и получай ответы от AI через backend на FastAPI.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/chats"
            className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-400"
          >
            Открыть чат
          </Link>

          <Link
            href="/prompts"
            className="rounded-2xl border border-neutral-700 px-6 py-3 text-sm font-medium text-neutral-100 transition hover:bg-neutral-900"
          >
            Перейти к промптам
          </Link>
        </div>

        <div className="mt-16 grid w-full gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-left">
            <h2 className="mb-2 text-lg font-semibold text-white">
              Промпты
            </h2>
            <p className="text-sm leading-6 text-neutral-400">
              Храни готовые шаблоны запросов под SQL, GIS, Python и рабочие
              задачи.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-left">
            <h2 className="mb-2 text-lg font-semibold text-white">
              Чаты
            </h2>
            <p className="text-sm leading-6 text-neutral-400">
              Веди диалоги с AI, отслеживай статус ответа и повторяй неудачные
              запросы.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-left">
            <h2 className="mb-2 text-lg font-semibold text-white">
              Контроль доступа
            </h2>
            <p className="text-sm leading-6 text-neutral-400">
              Регистрация через pending-статус, роли пользователей и защищённые
              страницы.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}