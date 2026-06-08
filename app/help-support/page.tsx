import Navbar from "@/components/layout/Navbar";

export default function HelpSupportPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-teal-700">Support</p>
        <h1 className="mt-2 text-3xl font-bold">Help & Support</h1>
        <p className="mt-4 leading-7 text-slate-600">
          Find help with orders, returns, payments, seller questions, and account access.
        </p>
      </section>
    </main>
  );
}
