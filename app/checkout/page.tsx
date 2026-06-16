"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, ReactNode, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import Navbar from "@/components/layout/Navbar";
import { trackUserEvent } from "@/lib/personalization/client";
import {useAuth} from "@/context/authContext";
const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

export default function CheckoutPage() {
  const { clearCart, items, setQuantity, subtotal } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const shipping = items.length === 0 || subtotal >= 75 ? 0 : 6.99;
  const estimatedTax = subtotal * 0.08;
  const total = subtotal + shipping + estimatedTax;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await Promise.all(
      items.map((item) =>
        trackUserEvent({
          eventType: "purchase",
          productId: item.product._id,
          productName: item.product.name,
          category: item.product.category,
          quantity: item.quantity,
          metadata: {
            itemTotal: item.product.price * item.quantity,
          },
        })
      )
    );
    setOrderTotal(total);
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <Navbar />
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg
                aria-hidden="true"
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
              </svg>
            </div>
            <p className="mt-5 text-sm font-semibold text-emerald-700">
              Checkout skeleton complete
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Order preview created
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              The frontend flow is ready. Backend order creation, payment capture,
              and email confirmation can connect to this submit point later.
            </p>
            <p className="mt-5 text-2xl font-black text-slate-950">
              {formatPrice(orderTotal)}
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-700">Checkout</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Review and place order
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Continue shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-black text-slate-950">Your cart is empty</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Add products before starting checkout.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start"
          >
            <div className="space-y-6">
              <CheckoutSection title="Contact">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email address" name="email" type="email" required />
                  <Field label="Phone number" name="phone" type="tel" required />
                </div>
              </CheckoutSection>

              <CheckoutSection title="Delivery address">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" name="fullName" required />
                  <Field label="City" name="city" required />
                </div>
                <Field label="Street address" name="address" required />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Region / state" name="region" required />
                  <Field label="Postal code" name="postalCode" required />
                </div>
              </CheckoutSection>

              <CheckoutSection title="Delivery method">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-950 bg-slate-50 p-4">
                    <input
                      type="radio"
                      name="delivery"
                      value="standard"
                      defaultChecked
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-black text-slate-950">
                        Standard delivery
                      </span>
                      <span className="mt-1 block text-sm text-slate-600">
                        3-5 business days
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-white p-4">
                    <input type="radio" name="delivery" value="express" className="mt-1" />
                    <span>
                      <span className="block text-sm font-black text-slate-950">
                        Express delivery
                      </span>
                      <span className="mt-1 block text-sm text-slate-600">
                        1-2 business days
                      </span>
                    </span>
                  </label>
                </div>
              </CheckoutSection>

              <CheckoutSection title="Payment">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-950 bg-slate-50 p-4">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      defaultChecked
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-black text-slate-950">
                        Cash on delivery
                      </span>
                      <span className="mt-1 block text-sm text-slate-600">
                        Pay when the package arrives
                      </span>
                    </span>
                  </label>
                  <label className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 text-slate-400">
                    <input type="radio" name="payment" value="card" disabled className="mt-1" />
                    <span>
                      <span className="block text-sm font-black">Card payment</span>
                      <span className="mt-1 block text-sm">Connect payment provider later</span>
                    </span>
                  </label>
                </div>
              </CheckoutSection>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-lg font-black text-slate-950">Order summary</h2>
              <div className="mt-4 space-y-4">
                {items.map((item) => (
                  <article
                    key={item.product._id}
                    className="grid grid-cols-[64px_1fr] gap-3"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-bold text-slate-950">
                        {item.product.name}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <select
                          aria-label={`Quantity for ${item.product.name}`}
                          value={item.quantity}
                          onChange={(event) =>
                            setQuantity(item.product._id, Number(event.target.value))
                          }
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold"
                        >
                          {Array.from({ length: 10 }).map((_, index) => (
                            <option key={index + 1} value={index + 1}>
                              Qty {index + 1}
                            </option>
                          ))}
                        </select>
                        <p className="text-sm font-black text-slate-950">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
                <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
                <SummaryRow
                  label="Shipping"
                  value={shipping === 0 ? "Free" : formatPrice(shipping)}
                />
                <SummaryRow label="Estimated tax" value={formatPrice(estimatedTax)} />
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <p className="font-black text-slate-950">Total</p>
                  <p className="text-2xl font-black text-slate-950">
                    {formatPrice(total)}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="mt-5 h-12 w-full rounded-lg bg-teal-500 text-sm font-black text-slate-950 transition hover:bg-teal-400"
              >
                Place order
              </button>
              <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                Secure checkout, returns, and tracking are part of the frontend flow.
              </p>
            </aside>
          </form>
        )}
      </section>
    </main>
  );
}

function CheckoutSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="font-semibold text-slate-600">{label}</p>
      <p className="font-black text-slate-950">{value}</p>
    </div>
  );
}
