import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-base-100 px-6">
      <section className="w-full max-w-md rounded-lg border border-base-300 bg-white p-8 shadow-panel">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">InvestorWeb</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Logowanie</h1>
          <p className="mt-2 text-sm leading-6 text-neutral/70">
            Po zalogowaniu klucz danych będzie odblokowywany lokalnie w przeglądarce.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
