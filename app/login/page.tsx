import Navbar from "@/components/layout/Navbar";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="mx-auto grid min-h-[calc(100vh-96px)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="hidden lg:block">
          <p className="text-sm font-semibold text-teal-700">Welcome back</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            Continue shopping with your Bazar account.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
            Sign in to track orders, save products, manage seller tools, and get faster checkout.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
