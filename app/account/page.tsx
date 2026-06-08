import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import connectDB from "@/lib/database/db";
import { verifyToken } from "@/lib/jwt";
import User from "@/models/User";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const { valid, decoded } = verifyToken(accessToken);

  if (!valid || !decoded?.id) {
    redirect("/login");
  }

  await connectDB();

  const user = await User.findById(decoded.id).select(
    "fullName email phoneNumber address"
  );

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-700">My Account</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Account dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Manage shopping activity, saved items, delivery details, and support.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Shop now
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-xl font-black uppercase text-teal-800">
              {String(user.fullName || user.email).slice(0, 1)}
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-950">{user.fullName}</h2>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>

            <dl className="mt-5 space-y-4 border-t border-slate-100 pt-5">
              <div>
                <dt className="text-xs font-black uppercase text-slate-400">Phone</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {user.phoneNumber}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase text-slate-400">Default address</dt>
                <dd className="mt-1 text-sm font-semibold leading-6 text-slate-800">
                  {user.address}
                </dd>
              </div>
            </dl>
          </aside>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardCard title="Orders" value="0 active" text="Track purchases and returns" />
              <DashboardCard title="Returns" value="0 open" text="Return requests and support" />
              <DashboardCard title="Addresses" value="1 saved" text="Delivery profile" />
              <Link
                href="/wishlist"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-sm font-black text-slate-950">Saved items</p>
                <p className="mt-3 text-2xl font-black text-rose-600">Wishlist</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Continue from products you saved
                </p>
              </Link>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Recent orders</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Orders will appear here after checkout is connected.
                  </p>
                </div>
                <Link
                  href="/checkout"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                >
                  Go to checkout
                </Link>
              </div>
              <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="font-black text-slate-950">No orders yet</p>
                <p className="mt-2 text-sm text-slate-600">
                  Completed orders, tracking, invoices, and returns will live here.
                </p>
              </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">Delivery details</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                  {user.address}
                </p>
                <p className="mt-2 text-sm text-slate-500">{user.phoneNumber}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">Support</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Get help with orders, seller questions, returns, and account issues.
                </p>
                <Link
                  href="/help-support"
                  className="mt-4 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                >
                  Help center
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardCard({
  text,
  title,
  value,
}: {
  text: string;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
