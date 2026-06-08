import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import connectDB from "@/lib/database/db";
import Product from "@/models/Product";
import SearchNavbar from "@/components/layout/SearchNavbar";
import ProductCard from "@/components/products/ProductCard";
import ProductDetailTabs from "@/components/products/ProductDetailTabs";
import ProductFaq from "@/components/products/ProductFaq";
import ProductPurchaseActions from "@/components/products/ProductPurchaseActions";
import ReviewUploadForm from "@/components/products/ReviewUploadForm";
import {
  findFallbackProduct,
  getFallbackProducts,
} from "@/lib/catalog/fallbackProducts";
import type { Product as ProductType } from "@/types/product";
import { resolveWithTimeout } from "@/lib/utils/resolveWithTimeout";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

const productHighlights = [
  "Fast dispatch from marketplace sellers",
  "Buyer protection on eligible orders",
  "Secure checkout and saved order history",
];

const purchaseTrustBadges = [
  {
    title: "Delivery",
    text: "Estimated 3-5 business days",
  },
  {
    title: "Returns",
    text: "7-day return window",
  },
  {
    title: "Payment",
    text: "Secure checkout flow",
  },
];

const reviewSummary = {
  average: 4.6,
  total: 128,
  breakdown: [
    { stars: 5, percent: 72 },
    { stars: 4, percent: 18 },
    { stars: 3, percent: 7 },
    { stars: 2, percent: 2 },
    { stars: 1, percent: 1 },
  ],
};

const reviews = [
  {
    name: "Verified buyer",
    rating: 5,
    title: "Great quality for the price",
    body: "The product matched the description and arrived in good condition. Setup was simple and the overall value feels strong.",
    helpful: 18,
  },
  {
    name: "Marketplace customer",
    rating: 4,
    title: "Good purchase",
    body: "Works well for everyday use. Packaging was clean and delivery was faster than expected.",
    helpful: 9,
  },
];

function getFallbackAiReviewSummary(product: ProductType) {
  const topReview = reviews[0];
  const averageRating =
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  const sentiment = averageRating >= 4.5 ? "Strong positive" : "Mostly positive";

  return {
    sentiment,
    headline: "Buyers like the value",
    summary: `${product.name} is getting positive review signals. Customers mention that it matches the description, feels easy to use, and works well for everyday needs.`,
    highlights: [
      topReview.title,
      "Clean delivery experience",
      `Good fit for ${product.category}`,
    ],
  };
}

async function getProduct(id: string): Promise<ProductType | null> {
  const fallbackProduct = findFallbackProduct(id);

  if (fallbackProduct) {
    return fallbackProduct;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  try {
    const product = await resolveWithTimeout(
      (async () => {
        await connectDB();
        return Product.findById(id).lean();
      })()
    );

    if (!product) {
      return null;
    }

    return {
      _id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      stock: product.stock,
    };
  } catch (error) {
    console.error("Unable to load product from MongoDB.", error);
    return null;
  }
}

async function getRelatedProducts(product: ProductType): Promise<ProductType[]> {
  const fallbackRelatedProducts = getFallbackProducts(product.category)
    .filter((item) => item._id !== product._id)
    .slice(0, 6);

  try {
    const products = await resolveWithTimeout(
      (async () => {
        await connectDB();

        return Product.find({
          _id: { $ne: product._id },
          category: product.category,
        })
          .limit(6)
          .lean();
      })()
    );

    if (!products || products.length === 0) {
      return fallbackRelatedProducts;
    }

    return products.map((item) => ({
      _id: item._id.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: item.category,
      stock: item.stock,
    }));
  } catch (error) {
    console.error("Unable to load related products from MongoDB.", error);
    return fallbackRelatedProducts;
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product not found | Bazar",
    };
  }

  return {
    title: `${product.name} | Bazar`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.image ? [product.image] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product);
  const aiReviewSummary = getFallbackAiReviewSummary(product);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image ? [product.image] : undefined,
    category: product.category,
    sku: product._id,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability:
        product.stock && product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: reviewSummary.average,
      reviewCount: reviewSummary.total,
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category,
        item: `/?category=${encodeURIComponent(product.category)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SearchNavbar />
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Back to products
          </Link>
          <Link
            href={`/?category=${encodeURIComponent(product.category)}`}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:text-slate-950"
          >
            {product.category}
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:items-start">
          <div className="relative aspect-[5/4] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                No image
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <p className="text-sm font-semibold uppercase text-teal-700">Product detail</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {product.name}
            </h1>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-5">
              <p className="text-3xl font-bold text-slate-950">
                {formatPrice(product.price)}
              </p>
              <p className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                {product.stock && product.stock > 0 ? "In stock" : "Available soon"}
              </p>
            </div>

            <ProductDetailTabs product={product} highlights={productHighlights} />

            <ProductPurchaseActions product={product} />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {purchaseTrustBadges.map((badge) => (
                <div
                  key={badge.title}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="text-sm font-black text-slate-950">{badge.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    {badge.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="mt-10 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-7 border-b border-slate-100 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                    <span className="absolute h-full w-full animate-ping rounded-full bg-teal-300/50" />
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
                        d="M9.8 4.2 8.7 7.5 5.4 8.6l3.3 1.1 1.1 3.3 1.1-3.3 3.3-1.1-3.3-1.1-1.1-3.3ZM17 12l-.7 2.1-2.1.7 2.1.7.7 2.1.7-2.1 2.1-.7-2.1-.7L17 12Z"
                      />
                    </svg>
                  </span>
                  AI review summary
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  {aiReviewSummary.headline}
                </h2>
              </div>
              <p className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                {aiReviewSummary.sentiment}
              </p>
            </div>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
              {aiReviewSummary.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {aiReviewSummary.highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>

          <ReviewUploadForm />

          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <div>
              <p className="text-sm font-semibold text-teal-700">Ratings & Reviews</p>
              <div className="mt-3 flex items-end gap-2">
                <p className="text-5xl font-bold text-slate-950">
                  {reviewSummary.average}
                </p>
                <p className="pb-2 text-sm font-semibold text-slate-500">
                  / 5
                </p>
              </div>
              <div className="mt-3 flex text-amber-400" aria-label="4.6 out of 5 stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index}>★</span>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Based on {reviewSummary.total} customer ratings
              </p>

              <div className="mt-5 space-y-2">
                {reviewSummary.breakdown.map((item) => (
                  <div key={item.stars} className="grid grid-cols-[42px_1fr_36px] items-center gap-2 text-xs text-slate-600">
                    <span>{item.stars} star</span>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <span className="text-right">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {reviews.map((review) => (
                <article key={review.title} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-950">{review.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm text-slate-500">{review.name}</p>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black uppercase text-emerald-700">
                          Verified purchase
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-amber-500">
                      {"★".repeat(review.rating)}
                      <span className="text-slate-300">
                        {"★".repeat(5 - review.rating)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {review.body}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 transition hover:border-slate-400 hover:text-slate-950"
                    >
                      Helpful ({review.helpful})
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 transition hover:border-slate-400 hover:text-slate-950"
                    >
                      Report
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ProductFaq product={product} />

        {relatedProducts.length > 0 && (
          <section className="mt-10 border-t border-slate-200 pt-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-teal-700">
                  More from {product.category}
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                  Other products you may like
                </h2>
              </div>
              <Link
                href="/"
                className="hidden text-sm font-bold text-slate-700 transition hover:text-slate-950 sm:inline-flex"
              >
                View all
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct._id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
