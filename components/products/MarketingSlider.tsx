"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/product";

type MarketingSliderProps = {
  products: Product[];
  loading: boolean;
};

const promoLabels = [
  "Featured",
  "Popular pick",
  "Fresh find",
  "Marketplace pick",
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

export default function MarketingSlider({ products, loading }: MarketingSliderProps) {
  const slides = useMemo(
    () => products.filter((product) => product.image).slice(0, 7),
    [products]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || paused) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, [paused, slides.length]);

  if (loading) {
    return (
      <div className="relative mb-8 h-80 overflow-hidden rounded-lg border border-slate-200 bg-white sm:h-[22.5rem] lg:h-[25rem]">
        <div className="buffer-sheen absolute inset-0" />
        <div className="absolute left-6 top-1/2 w-full max-w-xl -translate-y-1/2 space-y-4 sm:left-10">
          <div className="h-6 w-28 rounded-full bg-slate-100" />
          <div className="h-8 w-4/5 rounded-full bg-slate-100" />
          <div className="h-8 w-3/5 rounded-full bg-slate-100" />
          <div className="h-4 w-2/3 rounded-full bg-slate-100" />
          <div className="h-10 w-32 rounded-lg bg-slate-100" />
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  const safeActiveIndex = activeIndex % slides.length;
  const activeProduct = slides[safeActiveIndex];
  const promoLabel = promoLabels[safeActiveIndex % promoLabels.length];

  const goToPreviousSlide = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? slides.length - 1 : currentIndex - 1
    );
  };

  const goToNextSlide = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
  };

  return (
    <section
      className="mb-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-80 sm:h-[22.5rem] lg:h-[25rem]">
        <Image
          src={activeProduct.image || ""}
          alt={activeProduct.name}
          fill
          priority={safeActiveIndex === 0}
          sizes="(max-width: 768px) 100vw, 1500px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent" />

        <div className="relative z-10 flex h-full max-w-2xl flex-col justify-center px-5 py-6 sm:px-8 lg:px-10">
          <p className="w-fit rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase text-slate-950">
            {promoLabel}
          </p>
          <h2 className="mt-4 max-w-xl text-2xl font-black leading-tight text-white sm:text-4xl">
            {activeProduct.name}
          </h2>
          <p className="mt-3 line-clamp-2 max-w-lg text-sm leading-6 text-slate-200 sm:text-base">
            {activeProduct.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <p className="text-2xl font-black text-white">
              {formatPrice(activeProduct.price)}
            </p>
            <Link
              href={`/products/${activeProduct._id}`}
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-teal-400"
            >
              Shop deal
            </Link>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous promotion"
              onClick={goToPreviousSlide}
              className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-white/40"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next promotion"
              onClick={goToNextSlide}
              className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-white/40"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {slides.map((product, index) => (
                <button
                  key={product._id}
                  type="button"
                  aria-label={`Show promotion ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition ${
                    index === safeActiveIndex ? "w-8 bg-white" : "w-2.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
