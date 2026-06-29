import { PageContainer } from "@/components/page-container";

export default function LoginPage() {
  return (
    <PageContainer>
      <div className="mx-auto mt-20 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Вход</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Авторизация появится на следующем этапе.
        </p>

        <div className="space-y-4">
          <input
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="Логин или email"
          />

          <input
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="Пароль"
            type="password"
          />

          <button className="w-full rounded-lg bg-zinc-950 px-4 py-3 text-white hover:bg-zinc-800">
            Войти
          </button>
        </div>
      </div>
    </PageContainer>
  );
}