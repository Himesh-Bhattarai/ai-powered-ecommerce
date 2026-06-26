"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useCartStore } from "@/components/cart/cartStore";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

type NavbarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
};

type AccountUser = {
  fullName: string;
  email: string;
};

const navLinks = [
  { href: "/help-support", label: "Help & Support" },
  { href: "/become-seller", label: "Become a Seller" },
];

export default function Navbar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
}: NavbarProps) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const openCart = useCartStore((state) => state.openCart);
  const totalQuantity = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );
  const { totalItems: wishlistCount } = useWishlist();
  const showSearch = typeof searchValue === "string" && onSearchChange;

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedSearchValue = searchValue?.trim();

    if (trimmedSearchValue) {
      onSearchSubmit?.(trimmedSearchValue);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (isMounted && data.authenticated) {
          setUser(data.user);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthChecked(true);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="bg-white/95">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-3 py-1.5 text-[11px] font-semibold text-slate-600 sm:justify-end sm:px-4 lg:px-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap transition hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <nav className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-3 py-3 sm:px-4 lg:px-4">
        <Link href="/" aria-label="Bazar home" className="shrink-0">
          <h1 className="text-xl font-semibold uppercase tracking-[0.22em] text-teal-700 sm:text-2xl sm:tracking-[0.30em]">
            Bazar
          </h1>
        </Link>

        {showSearch ? (
          <form
            onSubmit={handleSearchSubmit}
            className="col-span-3 row-start-2 w-full sm:col-span-1 sm:row-start-auto sm:justify-self-center lg:max-w-2xl"
          >
            <label className="relative flex-1">
              <span className="sr-only">Search products</span>
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                  />
                </svg>
              </span>
              <input
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search products with AI"
                className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 sm:h-12"
              />
            </label>
          </form>
        ) : (
          <div />
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label={`Open cart with ${totalQuantity} items`}
            onClick={openCart}
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l2.2 10.7A2 2 0 0 0 9.2 15h7.6a2 2 0 0 0 2-1.6L20 7H6M10 19.5h.01M18 19.5h.01"
              />
            </svg>
            {totalQuantity > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1 text-[11px] font-black text-slate-950">
                {totalQuantity}
              </span>
            )}
          </button>

          <Link
            href="/wishlist"
            aria-label={`Open wishlist with ${wishlistCount} items`}
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:border-slate-400 hover:text-rose-600"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill={wishlistCount > 0 ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.5c0 5.25-9 10.5-9 10.5S3 13.75 3 8.5A4.5 4.5 0 0 1 11.25 6 4.5 4.5 0 0 1 21 8.5Z"
              />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-black text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {!authChecked ? (
            <div className="h-8 w-24 rounded-md bg-slate-100" aria-hidden="true" />
          ) : user ? (
            <Link
              href="/account"
              className="rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 sm:px-3 sm:text-sm"
            >
              My Account
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 sm:px-3 sm:text-sm"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 sm:px-3 sm:text-sm"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
