"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { trackUserEvent } from "@/lib/personalization/client";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { isSaved, toggleItem } = useWishlist();
  const saved = isSaved(product._id);
  const trackProductClick = () => {
    void trackUserEvent({
      eventType: "product_click",
      productId: product._id,
      productName: product.name,
      category: product.category,
    });
  };

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <Link
          href={`/products/${product._id}`}
          onClick={trackProductClick}
          className="block h-full"
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
              No image
            </div>
          )}
        </Link>

        <div className="absolute right-2 top-2 flex flex-col gap-2">
          <button
            type="button"
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={saved}
            onClick={() => toggleItem(product)}
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition ${
              saved
                ? "bg-rose-500 text-white"
                : "bg-white/95 text-slate-700 hover:text-rose-600"
            }`}
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill={saved ? "currentColor" : "none"}
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
          </button>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <Link
          href={`/products/${product._id}`}
          onClick={trackProductClick}
          className="block space-y-3"
        >
          <div className="space-y-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase text-teal-700">
                {product.category}
              </p>
              <h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-950">
                {product.name}
              </h2>
            </div>
            <p className="text-sm font-bold text-slate-950">
              {formatPrice(product.price)}
            </p>
          </div>

          <p className="line-clamp-2 text-xs leading-5 text-slate-600">
            {product.description}
          </p>
        </Link>

        <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-slate-100 pt-3 text-xs">
          <span className="font-medium text-slate-500">
            Stock: {product.stock ?? 0}
          </span>
          <Link
            href={`/products/${product._id}`}
            onClick={trackProductClick}
            className="font-bold text-teal-700 transition hover:text-teal-800"
          >
            Details
          </Link>
          <button
            type="button"
            onClick={() => addItem(product)}
            className="col-span-2 h-10 rounded-lg bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Quick add
          </button>
        </div>
      </div>
    </article>
  );
}
