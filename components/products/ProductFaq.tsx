"use client";

import { useState } from "react";
import type { Product } from "@/types/product";

type ProductFaqProps = {
  product: Product;
};

function getFallbackFaqs(product: Product) {
  return [
    {
      question: `Is ${product.name} good for everyday use?`,
      answer: `${product.name} is listed in ${product.category} and is described as a practical option for regular use. Check the product description and images to make sure it fits your exact need.`,
    },
    {
      question: "What should I check before buying?",
      answer: `Review the price, stock status, product image, and category details before checkout. For ${product.category}, also compare the key features in the description with what you already need.`,
    },
    {
      question: "Does this product match the listing description?",
      answer: `The listing highlights: ${product.description}. Use that as the main reference for what the product should offer.`,
    },
    {
      question: "Can this be bought as a gift?",
      answer: `${product.name} can work as a gift if the buyer is interested in ${product.category}. Confirm the recipient's preference before ordering.`,
    },
    {
      question: "What happens if the product is unavailable?",
      answer: product.stock && product.stock > 0
        ? "This item is currently shown as available, but stock can change before checkout."
        : "This item is currently shown as limited or unavailable, so check related products in the same category.",
    },
  ];
}

export default function ProductFaq({ product }: ProductFaqProps) {
  const [openIndex, setOpenIndex] = useState(0);
  const faqs = getFallbackFaqs(product);

  return (
    <section className="mt-10 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
            <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <span className="absolute h-full w-full animate-ping rounded-full bg-teal-300/40" />
              <svg
                aria-hidden="true"
                className="relative h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16h6M5 19.5V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v13.5l-3-2-3 2-3-2-3 2-2-1.5Z"
                />
              </svg>
            </span>
            AI product FAQ
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Questions buyers may ask
          </h2>
        </div>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">
          Fallback preview
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <article
              key={faq.question}
              className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-bold text-slate-950 sm:text-base">
                  {faq.question}
                </span>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 transition ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
                  </svg>
                </span>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm leading-6 text-slate-600">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
