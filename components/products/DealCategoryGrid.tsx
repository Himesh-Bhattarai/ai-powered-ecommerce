"use client";

import Image from "next/image";
import Link from "next/link";
import { trackUserEvent } from "@/lib/personalization/client";
import type { Product } from "@/types/product";

type DealCategoryGridProps = {
  products: Product[];
  loading: boolean;
};

const dealSections = [
  {
    title: "Featured picks",
    label: "Popular products",
    start: 0,
  },
  {
    title: "Offer ideas",
    label: "Smart picks",
    start: 4,
  },
  {
    title: "Bundle ideas",
    label: "Complete the set",
    start: 8,
  },
];

function pickProducts(products: Product[], start: number) {
  if (products.length === 0) {
    return [];
  }

  return Array.from({ length: Math.min(4, products.length) }, (_, index) => {
    return products[(start + index) % products.length];
  });
}

export default function DealCategoryGrid({ products, loading }: DealCategoryGridProps) {
  const imageProducts = products.filter((product) => product.image);

  if (loading) {
    return (
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {dealSections.map((section) => (
          <div
            key={section.title}
            className="relative h-80 overflow-hidden rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="buffer-sheen absolute inset-0" />
            <div className="space-y-4">
              <div className="h-5 w-32 rounded-full bg-slate-100" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="aspect-square rounded-lg bg-slate-100" />
                    <div className="h-3 w-4/5 rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (imageProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 grid gap-4 lg:grid-cols-3">
      {dealSections.map((section) => {
        const sectionProducts = pickProducts(imageProducts, section.start);

        return (
          <article
            key={section.title}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">{section.title}</h2>
                <p className="mt-1 text-xs font-bold uppercase text-teal-700">
                  {section.label}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                Featured
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {sectionProducts.map((product) => (
                <Link
                  key={`${section.title}-${product._id}`}
                  href={`/products/${product._id}`}
                  onClick={() =>
                    void trackUserEvent({
                      eventType: "product_click",
                      productId: product._id,
                      productName: product.name,
                      category: product.category,
                      metadata: {
                        source: "deal-category-grid",
                      },
                    })
                  }
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                    <Image
                      src={product.image || ""}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 16vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 line-clamp-1 text-xs font-bold text-slate-800">
                    {product.name}
                  </p>
                </Link>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}
