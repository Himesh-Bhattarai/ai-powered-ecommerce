"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import ChatbotButton from "@/components/chat/ChatbotButton";
import Navbar from "@/components/layout/Navbar";
import DealCategoryGrid from "@/components/products/DealCategoryGrid";
import MarketingSlider from "@/components/products/MarketingSlider";
import ProductCard from "@/components/products/ProductCard";
import {
  fetchPersonalizedRecommendations,
  trackUserEvent,
  type RecommendationResponse,
} from "@/lib/personalization/client";
import type { Product } from "@/types/product";

type PriceFilter = "all" | "under-25" | "25-100" | "over-100";
type AvailabilityFilter = "all" | "in-stock" | "low-stock";
type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc" | "stock-desc";

const priceFilters: { id: PriceFilter; label: string }[] = [
  { id: "all", label: "All prices" },
  { id: "under-25", label: "Under $25" },
  { id: "25-100", label: "$25 - $100" },
  { id: "over-100", label: "Over $100" },
];

const availabilityFilters: { id: AvailabilityFilter; label: string }[] = [
  { id: "all", label: "All inventory" },
  { id: "in-stock", label: "In stock" },
  { id: "low-stock", label: "Low stock" },
];

const sortOptions: { id: SortOption; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "name-asc", label: "Name: A to Z" },
  { id: "stock-desc", label: "Most stock" },
];

const matchesPriceFilter = (product: Product, filter: PriceFilter) => {
  if (filter === "under-25") {
    return product.price < 25;
  }

  if (filter === "25-100") {
    return product.price >= 25 && product.price <= 100;
  }

  if (filter === "over-100") {
    return product.price > 100;
  }

  return true;
};

const matchesAvailabilityFilter = (
  product: Product,
  filter: AvailabilityFilter
) => {
  const stock = product.stock ?? 0;

  if (filter === "in-stock") {
    return stock > 0;
  }

  if (filter === "low-stock") {
    return stock > 0 && stock <= 5;
  }

  return true;
};

const searchProductsLocally = (products: Product[], query: string) => {
  const trimmedQuery = query.trim().toLowerCase();

  if (!trimmedQuery) {
    return products;
  }

  return products.filter((product) =>
    [product.name, product.description, product.category]
      .join(" ")
      .toLowerCase()
      .includes(trimmedQuery)
  );
};

const readInitialUrlValue = (key: string) => {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get(key) || "";
};

export default function ProductShowcase() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [aiProducts, setAiProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState(() => readInitialUrlValue("q"));
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    () => readInitialUrlValue("category") || "All"
  );
  const [selectedPriceFilter, setSelectedPriceFilter] =
    useState<PriceFilter>("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recommendations, setRecommendations] =
    useState<RecommendationResponse | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const loadRecommendations = useCallback(
    async ({
      forceAi = false,
      trigger = "catalog",
    }: {
      forceAi?: boolean;
      trigger?: string;
    } = {}) => {
      setRecommendationsLoading(true);

      try {
        const data = await fetchPersonalizedRecommendations({ forceAi, trigger });

        if (data) {
          setRecommendations(data);
        }
      } finally {
        setRecommendationsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const data = (await response.json()) as Product[];
        setAllProducts(data);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const handlePersonalizationReady = () => {
      void loadRecommendations({ trigger: "event-signal" });
    };

    window.addEventListener(
      "bazar:personalization-ready",
      handlePersonalizationReady
    );

    return () => {
      window.removeEventListener(
        "bazar:personalization-ready",
        handlePersonalizationReady
      );
    };
  }, [loadRecommendations]);

  const runAiSearch = useCallback(async (value: string) => {
    const trimmedQuery = value.trim();

    if (!trimmedQuery) {
      return;
    }

    try {
      setSearching(true);
      setError("");

      const response = await fetch("/api/ai-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: trimmedQuery }),
      });

      if (!response.ok) {
        throw new Error("AI search failed");
      }

      const data = (await response.json()) as Product[];
      setAiProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI search failed");
    } finally {
      setSearching(false);
    }
  }, []);

  const writeCatalogUrl = (searchValue: string, categoryValue: string) => {
    const params = new URLSearchParams();
    const trimmedValue = searchValue.trim();

    if (trimmedValue) {
      params.set("q", trimmedValue);
    }

    if (categoryValue !== "All") {
      params.set("category", categoryValue);
    }

    const nextQueryString = params.toString();
    window.history.replaceState(
      null,
      "",
      nextQueryString ? `/?${nextQueryString}` : "/"
    );
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setAiProducts([]);
    writeCatalogUrl(value, selectedCategory);
  };

  const updateCategory = (category: string) => {
    setSelectedCategory(category);
    writeCatalogUrl(query, category);
  };

  const submitSearch = (value: string) => {
    updateQuery(value);
    void runAiSearch(value);
    void trackUserEvent({
      eventType: "search",
      query: value,
      metadata: {
        source: "catalog-navbar",
      },
    });
  };

  const submitAssistantQuery = (value: string) => {
    updateQuery(value);
    void runAiSearch(value);
    void trackUserEvent({
      eventType: "ai_chat_request",
      query: value,
      metadata: {
        source: "catalog-chatbot",
      },
    });
    void loadRecommendations({
      forceAi: true,
      trigger: "ai-chat-request",
    });
  };

  const selectBundle = (queryValue: string, title: string) => {
    updateQuery(queryValue);
    void runAiSearch(queryValue);
    void trackUserEvent({
      eventType: "search",
      query: queryValue,
      metadata: {
        source: "recommendation-bundle",
        title,
      },
    });
  };

  const shouldUseAiResults = Boolean(query.trim());
  const localQueryProducts = useMemo(
    () => searchProductsLocally(allProducts, query),
    [allProducts, query]
  );
  const visibleProducts = shouldUseAiResults
    ? aiProducts.length > 0
      ? aiProducts
      : localQueryProducts
    : allProducts;
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(allProducts.map((product) => product.category))).sort(),
    ],
    [allProducts]
  );
  const filteredProducts = useMemo(() => {
    const nextProducts = visibleProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;

      return (
        matchesCategory &&
        matchesPriceFilter(product, selectedPriceFilter) &&
        matchesAvailabilityFilter(product, availabilityFilter)
      );
    });

    return [...nextProducts].sort((firstProduct, secondProduct) => {
      if (sortOption === "price-asc") {
        return firstProduct.price - secondProduct.price;
      }

      if (sortOption === "price-desc") {
        return secondProduct.price - firstProduct.price;
      }

      if (sortOption === "name-asc") {
        return firstProduct.name.localeCompare(secondProduct.name);
      }

      if (sortOption === "stock-desc") {
        return (secondProduct.stock ?? 0) - (firstProduct.stock ?? 0);
      }

      return 0;
    });
  }, [
    availabilityFilter,
    selectedCategory,
    selectedPriceFilter,
    sortOption,
    visibleProducts,
  ]);
  const activeFilterCount = [
    selectedCategory !== "All",
    selectedPriceFilter !== "all",
    availabilityFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedPriceFilter("all");
    setAvailabilityFilter("all");
    setSortOption("featured");
    writeCatalogUrl(query, "All");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar
        searchValue={query}
        onSearchChange={updateQuery}
        onSearchSubmit={submitSearch}
      />
      <ChatbotButton onQuery={submitAssistantQuery} />

      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <MarketingSlider products={allProducts} loading={loading} />

        <PersonalizedRecommendations
          loading={recommendationsLoading}
          recommendations={recommendations}
          onBundleSelect={selectBundle}
        />

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-slate-950">Shop by category</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Pick a department, then refine products below.
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="hidden text-sm font-bold text-teal-700 transition hover:text-teal-800 sm:inline-flex"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => updateCategory(category)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
                  selectedCategory === category
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"
                }`}
              >
                {category === "All" ? "All categories" : category}
              </button>
            ))}
          </div>
        </section>

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-teal-700">
              {shouldUseAiResults ? "AI matched results" : "Fresh inventory"}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Browse products
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"} shown
              {query.trim() ? ` for "${query.trim()}"` : ""}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-400 lg:hidden"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M7 12h10M10 17h4" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-teal-500 px-2 py-0.5 text-xs text-slate-950">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm">
              <span className="font-semibold text-slate-500">Sort</span>
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="bg-transparent font-bold text-slate-950 outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
          <aside className="hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:block">
            <ProductFilters
              availabilityFilter={availabilityFilter}
              categories={categories}
              onAvailabilityChange={setAvailabilityFilter}
              onCategoryChange={updateCategory}
              onClearFilters={clearFilters}
              onPriceChange={setSelectedPriceFilter}
              selectedCategory={selectedCategory}
              selectedPriceFilter={selectedPriceFilter}
            />
          </aside>

          <div>
            {activeFilterCount > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-400">
                  Active
                </span>
                {selectedCategory !== "All" && (
                  <FilterPill label={selectedCategory} onRemove={() => updateCategory("All")} />
                )}
                {selectedPriceFilter !== "all" && (
                  <FilterPill
                    label={
                      priceFilters.find((filter) => filter.id === selectedPriceFilter)
                        ?.label || "Price"
                    }
                    onRemove={() => setSelectedPriceFilter("all")}
                  />
                )}
                {availabilityFilter !== "all" && (
                  <FilterPill
                    label={
                      availabilityFilters.find((filter) => filter.id === availabilityFilter)
                        ?.label || "Availability"
                    }
                    onRemove={() => setAvailabilityFilter("all")}
                  />
                )}
              </div>
            )}

            {loading && (
              <ProductGridBuffer />
            )}

            {!loading && error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {!loading && searching && (
              <div className="mb-4 rounded-lg border border-teal-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-teal-700">
                    Matching products...
                  </p>
                  <p className="text-xs font-bold text-slate-400">Live catalog</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="buffer-bar h-full w-1/2 rounded-full bg-teal-500" />
                </div>
              </div>
            )}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                <h3 className="text-lg font-bold text-slate-950">No products found</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Try another search, category, or filter.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Reset filters
                </button>
              </div>
            )}

            {!loading && !error && filteredProducts.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DealCategoryGrid products={allProducts} loading={loading} />

        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
              className="absolute inset-0 bg-slate-950/50"
            />
            <section
              role="dialog"
              aria-modal="true"
              aria-label="Product filters"
              className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-950">Filters</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Refine product results.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setFiltersOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600"
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

              <ProductFilters
                availabilityFilter={availabilityFilter}
                categories={categories}
                onAvailabilityChange={setAvailabilityFilter}
                onCategoryChange={updateCategory}
                onClearFilters={clearFilters}
                onPriceChange={setSelectedPriceFilter}
                selectedCategory={selectedCategory}
                selectedPriceFilter={selectedPriceFilter}
              />

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="mt-5 h-12 w-full rounded-lg bg-slate-950 text-sm font-black text-white"
              >
                Show {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
              </button>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

type PersonalizedRecommendationsProps = {
  loading: boolean;
  recommendations: RecommendationResponse | null;
  onBundleSelect: (query: string, title: string) => void;
};

function PersonalizedRecommendations({
  loading,
  recommendations,
  onBundleSelect,
}: PersonalizedRecommendationsProps) {
  const products = recommendations?.products?.slice(0, 5) || [];
  const bundles = recommendations?.bundles?.slice(0, 3) || [];

  if (!loading && products.length === 0 && bundles.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 rounded-lg border border-teal-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">Personalized picks</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {recommendations?.aiUsed
              ? "AI bundles from your recent shopping signals"
              : "Suggestions from your recent shopping signals"}
          </p>
        </div>
        {recommendations?.signalReady && (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">
            Updated
          </span>
        )}
      </div>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-11 rounded-lg bg-slate-100" />
          ))}
        </div>
      )}

      {!loading && bundles.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {bundles.map((bundle) => {
            const queryValue = bundle.query || bundle.category || bundle.title;

            return (
              <button
                key={`${bundle.title}-${queryValue}`}
                type="button"
                onClick={() => onBundleSelect(queryValue, bundle.title)}
                className="shrink-0 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800 transition hover:border-teal-300 hover:bg-white"
              >
                {bundle.title}
              </button>
            );
          })}
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={`recommended-${product._id}`} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

type ProductFiltersProps = {
  availabilityFilter: AvailabilityFilter;
  categories: string[];
  onAvailabilityChange: (value: AvailabilityFilter) => void;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
  onPriceChange: (value: PriceFilter) => void;
  selectedCategory: string;
  selectedPriceFilter: PriceFilter;
};

function ProductFilters({
  availabilityFilter,
  categories,
  onAvailabilityChange,
  onCategoryChange,
  onClearFilters,
  onPriceChange,
  selectedCategory,
  selectedPriceFilter,
}: ProductFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">Refine products</p>
          <p className="mt-1 text-xs text-slate-500">Category, price, and stock</p>
        </div>
        <button
          type="button"
          onClick={onClearFilters}
          className="text-xs font-bold text-teal-700 transition hover:text-teal-800"
        >
          Reset
        </button>
      </div>

      <FilterGroup title="Category">
        <div className="grid gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`rounded-lg border px-3 py-2 text-left text-sm font-bold transition ${
                selectedCategory === category
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"
              }`}
            >
              {category === "All" ? "All categories" : category}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {priceFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onPriceChange(filter.id)}
              className={`rounded-lg border px-3 py-2 text-left text-sm font-bold transition ${
                selectedPriceFilter === filter.id
                  ? "border-teal-600 bg-teal-50 text-teal-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Availability">
        <div className="grid gap-2">
          {availabilityFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onAvailabilityChange(filter.id)}
              className={`rounded-lg border px-3 py-2 text-left text-sm font-bold transition ${
                availabilityFilter === filter.id
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-black uppercase text-slate-400">More filters</p>
        <div className="mt-3 grid gap-2">
          {["Brand", "Rating", "Delivery speed"].map((label) => (
            <button
              key={label}
              type="button"
              disabled
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-bold text-slate-400"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-black uppercase text-slate-400">{title}</h3>
      {children}
    </section>
  );
}

function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-red-600"
    >
      {label}
      <span aria-hidden="true">×</span>
    </button>
  );
}

function ProductGridBuffer() {
  return (
    <div
      aria-label="Loading products"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    >
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="relative aspect-square bg-slate-100">
            <div className="buffer-sheen absolute inset-0" />
          </div>
          <div className="space-y-3 p-3">
            <div className="h-3 w-20 rounded-full bg-slate-100" />
            <div className="h-4 w-11/12 rounded-full bg-slate-100" />
            <div className="h-4 w-3/5 rounded-full bg-slate-100" />
            <div className="h-3 w-full rounded-full bg-slate-100" />
            <div className="h-10 w-full rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
