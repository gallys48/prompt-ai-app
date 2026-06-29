import { PageContainer } from "@/components/page-container";

export default function RegisterPage() {
  return (
    <PageContainer>
      <div className="mx-auto mt-12 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Регистрация</h1>
        <p className="mb-6 text-sm text-zinc-500">
          После регистрации аккаунт должен подтвердить администратор.
        </p>

        <div className="space-y-4">
          <input
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="ФИО"
          />

          <input
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="Username"
          />

          <input
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="Email"
          />

          <input
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="Организация"
          />

          <input
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-950"
            placeholder="Пароль"
            type="password"
          />

          <button className="w-full rounded-lg bg-zinc-950 px-4 py-3 text-white hover:bg-zinc-800">
            Зарегистрироваться
          </button>
        </div>
      </div>
    </PageContainer>
  );
}