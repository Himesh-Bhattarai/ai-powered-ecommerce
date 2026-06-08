"use client";

import { useCart } from "@/components/cart/CartProvider";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import type { Product } from "@/types/product";

type ProductPurchaseActionsProps = {
  product: Product;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

export default function ProductPurchaseActions({
  product,
}: ProductPurchaseActionsProps) {
  const { addItem } = useCart();
  const { isSaved, toggleItem } = useWishlist();
  const saved = isSaved(product._id);

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => addItem(product)}
          className="h-12 rounded-lg bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Add to cart
        </button>
        <button
          type="button"
          aria-pressed={saved}
          onClick={() => toggleItem(product)}
          className="h-12 rounded-lg border border-slate-200 px-6 text-sm font-bold text-slate-800 transition hover:border-slate-400"
        >
          {saved ? "Saved" : "Save item"}
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-2xl shadow-slate-950/10 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-500">{product.name}</p>
            <p className="text-lg font-black text-slate-950">
              {formatPrice(product.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => addItem(product)}
            className="h-11 shrink-0 rounded-lg bg-slate-950 px-5 text-sm font-black text-white"
          >
            Add to cart
          </button>
        </div>
      </div>
    </>
  );
}
