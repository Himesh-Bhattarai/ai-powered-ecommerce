"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import ProductCard from "@/components/products/ProductCard";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

export default function WishlistPage() {
  const { items } = useWishlist();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-rose-600">Saved items</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Your wishlist
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Products saved on this device appear here until account sync is connected.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Continue shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-black text-slate-950">No saved products yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Tap the heart on a product card to save it for later.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
