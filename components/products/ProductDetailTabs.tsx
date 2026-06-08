"use client";

import { useState } from "react";
import type { Product } from "@/types/product";

type ProductDetailTabsProps = {
  product: Product;
  highlights: string[];
};

const tabs = [
  { id: "description", label: "Description", icon: "M4 6h16M4 12h16M4 18h10" },
  { id: "specifications", label: "Specs", icon: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" },
  { id: "details", label: "Details", icon: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" },
  { id: "shipping", label: "Shipping", icon: "M8 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM10 16h4M4 16V6h10v10M14 9h3l3 3v4h-2" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function ProductDetailTabs({
  product,
  highlights,
}: ProductDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("description");
  const specifications = [
    { label: "Category", value: product.category },
    {
      label: "Availability",
      value:
        product.stock && product.stock > 0
          ? `${product.stock} in stock`
          : "Available soon",
    },
    { label: "Product ID", value: product._id },
    { label: "Brand", value: "Not provided" },
    { label: "Material", value: "Not provided" },
    { label: "Warranty", value: "Not provided" },
  ];

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <div
        className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-2"
        role="tablist"
        aria-label="Product information"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-controls={`panel-${tab.id}`}
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-12 min-w-36 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition sm:min-w-40 ${
                isActive
                  ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-950"
              }`}
            >
              <svg
                aria-hidden="true"
                className={`h-4 w-4 ${isActive ? "text-teal-600" : "text-slate-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 min-h-56">
        {activeTab === "description" && (
          <div
            id="panel-description"
            role="tabpanel"
            aria-labelledby="tab-description"
            className="space-y-4"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-950">Description</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                {product.description}
              </p>
            </div>
            <div className="rounded-lg bg-teal-50 p-4">
              <p className="text-sm font-bold text-teal-800">
                Best fit: {product.category}
              </p>
              <p className="mt-2 text-sm leading-6 text-teal-900/80">
                This product is listed for buyers browsing {product.category}.
              </p>
            </div>
          </div>
        )}

        {activeTab === "specifications" && (
          <div
            id="panel-specifications"
            role="tabpanel"
            aria-labelledby="tab-specifications"
            className="rounded-lg border border-slate-200 bg-white"
          >
            <div className="grid sm:grid-cols-2">
              {specifications.map((specification) => (
                <div
                  key={specification.label}
                  className="grid grid-cols-[minmax(120px,0.85fr)_1fr] border-b border-slate-100 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
                >
                  <p className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                    {specification.label}
                  </p>
                  <p className="px-4 py-3 text-sm font-semibold text-slate-950">
                    {specification.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div
            id="panel-details"
            role="tabpanel"
            aria-labelledby="tab-details"
            className="grid gap-3 sm:grid-cols-3"
          >
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Available stock</p>
              <p className="mt-1 text-xl font-bold text-slate-950">
                {product.stock ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Category</p>
              <p className="mt-1 truncate text-sm font-bold text-slate-950">
                {product.category}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Product ID</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                {product._id}
              </p>
            </div>
          </div>
        )}

        {activeTab === "shipping" && (
          <div id="panel-shipping" role="tabpanel" aria-labelledby="tab-shipping">
            <h2 className="text-lg font-bold text-slate-950">About this item</h2>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
