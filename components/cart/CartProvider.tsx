"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Product } from "@/types/product";

type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  subtotal: number;
  totalQuantity: number;
  addItem: (product: Product, quantity?: number) => void;
  clearCart: () => void;
  closeCart: () => void;
  openCart: () => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
};

const CART_STORAGE_KEY = "bazar-cart";
const CartContext = createContext<CartContextValue | null>(null);

function readInitialCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];

    return Array.isArray(parsedCart)
      ? parsedCart.filter((item) => item?.product?._id && item.quantity > 0)
      : [];
  } catch {
    return [];
  }
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readInitialCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const closeCart = useCallback(() => setIsOpen(false), []);
  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.product._id === product._id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...currentItems, { product, quantity }];
    });
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((currentItems) => {
      if (quantity <= 0) {
        return currentItems.filter((item) => item.product._id !== productId);
      }

      return currentItems.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.product._id !== productId)
    );
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      ),
    [items]
  );
  const totalQuantity = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isOpen,
      subtotal,
      totalQuantity,
      addItem,
      clearCart,
      closeCart,
      openCart,
      removeItem,
      setQuantity,
    }),
    [
      addItem,
      clearCart,
      closeCart,
      isOpen,
      items,
      openCart,
      removeItem,
      setQuantity,
      subtotal,
      totalQuantity,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}

function CartDrawer() {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const {
    closeCart,
    isOpen,
    items,
    removeItem,
    setQuantity,
    subtotal,
    totalQuantity,
  } = useCart();
  const freeShippingThreshold = 75;
  const amountUntilFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress =
    subtotal === 0 ? 0 : Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const shippingEstimate = items.length === 0 || amountUntilFreeShipping === 0 ? 0 : 6.99;
  const estimatedTotal = subtotal + shippingEstimate;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeCart, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className="absolute inset-0 bg-slate-950/50"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p id="cart-title" className="text-lg font-black text-slate-950">Shopping cart</p>
            <p className="mt-1 text-sm text-slate-500">
              {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close cart"
            onClick={closeCart}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-base font-bold text-slate-950">Your cart is empty</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add products to see subtotal and checkout options.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.product._id}
                  className="grid grid-cols-[84px_1fr] gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="84px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-bold leading-5 text-slate-950">
                      {item.product.name}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {formatPrice(item.product.price)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            setQuantity(item.product._id, item.quantity - 1)
                          }
                          className="flex h-full w-9 items-center justify-center text-slate-600 hover:text-slate-950"
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            setQuantity(item.product._id, item.quantity + 1)
                          }
                          className="flex h-full w-9 items-center justify-center text-slate-600 hover:text-slate-950"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product._id)}
                        className="text-xs font-bold text-red-600 transition hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <p className="font-bold text-slate-600">Subtotal</p>
              <p className="font-black text-slate-950">{formatPrice(subtotal)}</p>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <p className="font-bold text-slate-600">Shipping estimate</p>
              <p className="font-black text-slate-950">
                {shippingEstimate === 0 ? "Free" : formatPrice(shippingEstimate)}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <p>Tax</p>
              <p>Calculated at checkout</p>
            </div>
            <div className="my-3 h-px bg-slate-200" />
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-slate-950">Estimated total</p>
              <p className="text-2xl font-black text-slate-950">
                {formatPrice(estimatedTotal)}
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <div className="mt-4 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                <span>
                  {amountUntilFreeShipping === 0
                    ? "Free shipping unlocked"
                    : `${formatPrice(amountUntilFreeShipping)} away from free shipping`}
                </span>
                <span>{Math.round(freeShippingProgress)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setAppliedCoupon(couponCode.trim().toUpperCase());
            }}
            className="mt-4 grid grid-cols-[1fr_auto] gap-2"
          >
            <label className="sr-only" htmlFor="cart-coupon">
              Promo code
            </label>
            <input
              id="cart-coupon"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Promo code"
              className="h-11 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
            <button
              type="submit"
              disabled={!couponCode.trim()}
              className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              Apply
            </button>
          </form>
          {appliedCoupon && (
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              {appliedCoupon} added. Final discount validates at checkout.
            </p>
          )}

          {items.length === 0 ? (
            <button
              type="button"
              disabled
              className="mt-4 h-12 w-full rounded-lg bg-slate-200 text-sm font-black text-slate-500"
            >
              Proceed to checkout
            </button>
          ) : (
            <Link
              href="/checkout"
              onClick={closeCart}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-teal-500 text-sm font-black text-slate-950 transition hover:bg-teal-400"
            >
              Proceed to checkout
            </Link>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-slate-500">
            <span className="rounded-lg bg-slate-50 px-2 py-2">Secure checkout</span>
            <span className="rounded-lg bg-slate-50 px-2 py-2">Easy returns</span>
            <span className="rounded-lg bg-slate-50 px-2 py-2">Order tracking</span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="mt-3 h-11 w-full rounded-lg border border-slate-200 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Continue shopping
          </button>
        </div>
      </aside>
    </div>
  );
}
