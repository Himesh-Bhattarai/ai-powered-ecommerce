"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useAuth } from "@/context/authContext";

type SellerProductDraft = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  status: "Draft";
};

type ProductFormState = {
  name: string;
  category: string;
  price: string;
  stock: string;
  image: string;
  description: string;
};

type AuthSellerUser = {
  fullName?: string;
  email?: string;
  role?: string;
  accountType?: string;
  isSeller?: boolean;
  sellerStatus?: string;
  verificationStatus?: string;
  seller?: {
    status?: string;
    verificationStatus?: string;
  };
};

const initialProductForm: ProductFormState = {
  name: "",
  category: "",
  price: "",
  stock: "",
  image: "",
  description: "",
};

const productCategories = [
  "Electronics",
  "Home & Kitchen",
  "Fashion",
  "Beauty",
  "Sports",
  "Grocery",
  "Books",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

const navItems = [
  { label: "Home", active: true },
  { label: "Orders", active: false },
  { label: "Inventory", active: false },
  { label: "Listings", active: false },
  { label: "Pricing", active: false },
  { label: "Advertising", active: false },
  { label: "Payments", active: false },
  { label: "Reports", active: false },
  { label: "Account Health", active: false },
  { label: "Support", active: false },
];

const metrics = [
  {
    label: "Today sales",
    value: "$1,284.40",
    change: "+12.4%",
    tone: "text-emerald-700",
  },
  {
    label: "Units ordered",
    value: "86",
    change: "+9 today",
    tone: "text-emerald-700",
  },
  {
    label: "Open orders",
    value: "18",
    change: "6 unshipped",
    tone: "text-amber-700",
  },
  {
    label: "Available payout",
    value: "$3,920.15",
    change: "Next cycle Friday",
    tone: "text-slate-600",
  },
];

const actionItems = [
  {
    title: "Confirm 6 unshipped orders",
    meta: "Due today before 5:00 PM",
    priority: "High",
  },
  {
    title: "Restock 4 low-inventory SKUs",
    meta: "Projected stockout within 7 days",
    priority: "Medium",
  },
  {
    title: "Fix 2 suppressed listings",
    meta: "Missing product attributes",
    priority: "Medium",
  },
  {
    title: "Respond to 3 buyer messages",
    meta: "Average response time target: under 24h",
    priority: "High",
  },
];

const orders = [
  {
    id: "BZ-10482",
    customer: "Aarav K.",
    items: "Wireless mouse, Desk mat",
    total: "$42.80",
    status: "Unshipped",
  },
  {
    id: "BZ-10481",
    customer: "Mina S.",
    items: "Cotton hoodie",
    total: "$36.00",
    status: "Ready",
  },
  {
    id: "BZ-10480",
    customer: "Rajan P.",
    items: "Kitchen storage set",
    total: "$58.25",
    status: "Packed",
  },
  {
    id: "BZ-10479",
    customer: "Nisha T.",
    items: "Yoga mat",
    total: "$24.50",
    status: "Delivered",
  },
];

const inventoryAlerts = [
  {
    sku: "EL-MOUSE-01",
    name: "Bluetooth Mouse",
    stock: 8,
    days: "5 days left",
    status: "Restock",
  },
  {
    sku: "HK-JAR-SET",
    name: "Kitchen Jar Set",
    stock: 14,
    days: "9 days left",
    status: "Watch",
  },
  {
    sku: "CL-HOODIE-BK",
    name: "Black Cotton Hoodie",
    stock: 3,
    days: "2 days left",
    status: "Urgent",
  },
];

const listingHealth = [
  { label: "Active listings", value: "124" },
  { label: "Inactive", value: "7" },
  { label: "Suppressed", value: "2" },
  { label: "Buyable rate", value: "94%" },
];

const accountHealth = [
  { label: "Order defect rate", value: "0.4%", state: "Good" },
  { label: "Late shipment rate", value: "1.2%", state: "Good" },
  { label: "Cancellation rate", value: "0.8%", state: "Good" },
  { label: "Message response", value: "92%", state: "Review" },
];

const quickLinks = [
  "Add a product",
  "Create promotion",
  "Download sales report",
  "Manage returns",
  "Update bank details",
  "Open seller support",
];

function hasSellerAccess(user: AuthSellerUser | null) {
  if (!user) {
    return false;
  }

  return Boolean(
    user.isSeller ||
      user.role === "seller" ||
      user.accountType === "seller" ||
      user.sellerStatus === "approved" ||
      user.verificationStatus === "verified" ||
      user.seller?.status === "approved" ||
      user.seller?.verificationStatus === "verified" ||
      user.email
  );
}

function StatusPill({ value }: { value: string }) {
  const tone =
    value === "Urgent" || value === "Unshipped" || value === "High"
      ? "border-red-200 bg-red-50 text-red-700"
      : value === "Medium" || value === "Restock" || value === "Review"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${tone}`}>
      {value}
    </span>
  );
}

function MetricCard({
  change,
  label,
  tone,
  value,
}: {
  change: string;
  label: string;
  tone: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className={`mt-2 text-sm font-bold ${tone}`}>{change}</p>
    </article>
  );
}

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth() as {
    user: AuthSellerUser | null;
    loading: boolean;
  };
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productForm, setProductForm] =
    useState<ProductFormState>(initialProductForm);
  const [productDrafts, setProductDrafts] = useState<SellerProductDraft[]>([]);
  const [notice, setNotice] = useState("");
  const sellerCanUseDashboard = hasSellerAccess(user);
  const sellerName = user?.fullName || "Seller";


  const openAddProduct = () => {
    setNotice("");
    setIsAddProductOpen(true);
  };

  const closeAddProduct = () => {
    setIsAddProductOpen(false);
  };

  const updateProductForm = (field: keyof ProductFormState, value: string) => {
    setProductForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

// normalize, validate and prepare payload
const productPrepare = () => {
  const productName = productForm.name.trim();
  const category = productForm.category.trim();
  const price = Number(productForm.price);
  const stock = Number(productForm.stock || 0);
  const description = productForm.description.trim();
  const image = productForm.image.trim();

  if (
    !productName ||
    !category ||
    !description ||
    Number.isNaN(price) ||
    price <= 0 ||
    Number.isNaN(stock) ||
    stock < 0
  ) {
    return null;
  }

  return {
    name: productName,
    category,
    price,
    stock,
    description,
    image,
  };
};

// Add product
const handleAddProduct = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const payload = productPrepare();

  if (!payload) {
    setNotice("Please fill all the necessary fields correctly.");
    return;
  }

  try {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      setNotice(data.message || "Failed to add product.");
      return;
    }

    const newDraft: SellerProductDraft = {
      id: data.product?._id || `DRAFT-${Date.now()}`,
      name: payload.name,
      category: payload.category,
      price: payload.price,
      stock: payload.stock,
      image: payload.image,
      description: payload.description,
      status: "Draft",
    };

    setProductDrafts((currentDrafts) => [newDraft, ...currentDrafts]);

    setNotice("Product successfully added and is currently under review.");
    setProductForm(initialProductForm);
    setIsAddProductOpen(false);
  } catch {
    setNotice("Network/server error. Failed to add product.");
  }
};

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-950">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-black uppercase text-teal-700">
            Seller Center
          </p>
          <h1 className="mt-2 text-2xl font-black">Checking seller access</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Verifying your active session from AuthContext.
          </p>
        </section>
      </main>
    );
  }

  if (!sellerCanUseDashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-950">
        <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-black uppercase text-teal-700">
            Seller Center
          </p>
          <h1 className="mt-2 text-2xl font-black">Seller access required</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Sign in first, then open or complete your seller profile to manage
            listings.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Login
            </Link>
            <Link
              href="/become-seller"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            >
              Become a seller
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-slate-950 text-white lg:block">
          <div className="border-b border-slate-800 px-5 py-5">
            <Link href="/" className="text-xl font-black uppercase tracking-wide">
              Bazar Seller
            </Link>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Marketplace operations
            </p>
          </div>
          <nav className="px-3 py-4">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`mb-1 flex h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-bold transition ${item.active
                    ? "bg-teal-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
              >
                {item.label}
                {item.label === "Orders" ? (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] text-white">
                    6
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </aside>

        <section>
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-teal-700">
                  Seller Center
                </p>
                <h1 className="text-xl font-black text-slate-950">
                  Dashboard
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="hidden h-10 min-w-72 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 md:flex">
                  <span className="mr-2 text-slate-400">Search</span>
                  <input
                    placeholder="Orders, SKUs, products"
                    className="min-w-0 flex-1 bg-transparent font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </label>
                <Link
                  href="/become-seller"
                  className="h-10 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                >
                  Seller profile
                </Link>
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Add product
                </button>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Sunday, June 14, 2026
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Good afternoon, {sellerName}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Review sales, urgent orders, inventory risks, payments, and
                  account health before publishing more products.
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-black uppercase text-emerald-700">
                  Account health
                </p>
                <p className="mt-1 text-lg font-black text-emerald-800">Healthy</p>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </section>

            {notice ? (
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                {notice}
              </div>
            ) : null}

            <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Draft listings
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    New products prepared from this seller workspace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Add product
                </button>
              </div>

              {productDrafts.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="font-black text-slate-950">
                    No draft listings yet
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                    Add a product to prepare its title, category, price, stock,
                    image URL, and description.
                  </p>
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-400">
                        <th className="py-3 pr-4">Product</th>
                        <th className="py-3 pr-4">Category</th>
                        <th className="py-3 pr-4">Price</th>
                        <th className="py-3 pr-4">Stock</th>
                        <th className="py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productDrafts.map((product) => (
                        <tr key={product.id}>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    sizes="48px"
                                    unoptimized
                                    className="object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-black text-slate-400">
                                    IMG
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-black text-slate-950">
                                  {product.name}
                                </p>
                                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                                  {product.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 font-semibold text-slate-700">
                            {product.category}
                          </td>
                          <td className="py-3 pr-4 font-black text-slate-950">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="py-3 pr-4 font-semibold text-slate-700">
                            {product.stock}
                          </td>
                          <td className="py-3">
                            <StatusPill value={product.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">
                        Action required
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Keep operations moving and protect seller performance.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400"
                    >
                      View all
                    </button>
                  </div>
                  <div className="mt-5 divide-y divide-slate-100">
                    {actionItems.map((item) => (
                      <div
                        key={item.title}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div>
                          <p className="font-black text-slate-950">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                        </div>
                        <StatusPill value={item.priority} />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">
                        Manage orders
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Unshipped, packed, delivered, and pending orders.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      Print labels
                    </button>
                  </div>
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-400">
                          <th className="py-3 pr-4">Order</th>
                          <th className="py-3 pr-4">Customer</th>
                          <th className="py-3 pr-4">Items</th>
                          <th className="py-3 pr-4">Total</th>
                          <th className="py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td className="py-3 pr-4 font-black text-slate-950">
                              {order.id}
                            </td>
                            <td className="py-3 pr-4 font-semibold text-slate-700">
                              {order.customer}
                            </td>
                            <td className="py-3 pr-4 text-slate-600">
                              {order.items}
                            </td>
                            <td className="py-3 pr-4 font-black text-slate-950">
                              {order.total}
                            </td>
                            <td className="py-3">
                              <StatusPill value={order.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-black text-slate-950">
                      Inventory health
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Restock risks and stockout warnings.
                    </p>
                    <div className="mt-5 space-y-3">
                      {inventoryAlerts.map((item) => (
                        <div
                          key={item.sku}
                          className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black text-slate-950">
                                {item.name}
                              </p>
                              <p className="mt-1 text-xs font-bold text-slate-500">
                                {item.sku}
                              </p>
                            </div>
                            <StatusPill value={item.status} />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-600">
                              {item.stock} units
                            </span>
                            <span className="font-bold text-slate-950">
                              {item.days}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-black text-slate-950">
                      Listing quality
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Product visibility and buyable listing status.
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {listingHealth.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                        >
                          <p className="text-xs font-black uppercase text-slate-400">
                            {item.label}
                          </p>
                          <p className="mt-2 text-2xl font-black text-slate-950">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-4 h-11 w-full rounded-lg border border-slate-200 text-sm font-black text-slate-700 transition hover:border-slate-400"
                    >
                      Improve listings
                    </button>
                  </div>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-black text-slate-950">
                    Sales snapshot
                  </h2>
                  <div className="mt-5 h-44 rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div className="flex h-full items-end gap-2">
                      {[42, 58, 46, 70, 62, 88, 78].map((height, index) => (
                        <div
                          key={index}
                          className="flex flex-1 items-end rounded-t bg-teal-100"
                          style={{ height: `${height}%` }}
                        >
                          <div className="h-2/3 w-full rounded-t bg-teal-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-black text-slate-950">7 days</p>
                      <p className="mt-1 text-slate-500">$8,420.30</p>
                    </div>
                    <div>
                      <p className="font-black text-slate-950">Conversion</p>
                      <p className="mt-1 text-slate-500">8.4%</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-black text-slate-950">
                    Account health
                  </h2>
                  <div className="mt-4 space-y-3">
                    {accountHealth.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-700">
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.value}
                          </p>
                        </div>
                        <StatusPill value={item.state} />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-black text-slate-950">
                    Payments
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Next settlement is estimated for Friday after completed
                    orders, refunds, fees, and adjustments are reconciled.
                  </p>
                  <div className="mt-4 rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase text-slate-400">
                      Reserve balance
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-950">
                      $640.00
                    </p>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-black text-slate-950">
                    Quick actions
                  </h2>
                  <div className="mt-4 grid gap-2">
                    {quickLinks.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={item === "Add a product" ? openAddProduct : undefined}
                        className="h-10 rounded-lg border border-slate-200 px-3 text-left text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </section>
              </aside>
            </section>
          </div>
        </section>
      </div>
      {isAddProductOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-product-title"
          className="fixed inset-0 z-50"
        >
          <button
            type="button"
            aria-label="Close add product"
            onClick={closeAddProduct}
            className="absolute inset-0 h-full w-full bg-slate-950/45"
          />
          <section className="relative ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-teal-700">
                    Seller listing
                  </p>
                  <h2
                    id="add-product-title"
                    className="mt-1 text-2xl font-black text-slate-950"
                  >
                    Add product
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeAddProduct}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 transition hover:border-slate-400"
                >
                  Close
                </button>
              </div>
            </div>

            <form onSubmit={handleAddProduct} className="flex flex-1 flex-col">
              <div className="grid gap-5 px-5 py-5">
                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    Product name
                  </span>
                  <input
                    value={productForm.name}
                    onChange={(event) =>
                      updateProductForm("name", event.target.value)
                    }
                    required
                    placeholder="Bluetooth desk speaker"
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-black text-slate-700">
                      Category
                    </span>
                    <select
                      value={productForm.category}
                      onChange={(event) =>
                        updateProductForm("category", event.target.value)
                      }
                      required
                      className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    >
                      <option value="">Select category</option>
                      {productCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-slate-700">
                      Image URL
                    </span>
                    <input
                      value={productForm.image}
                      onChange={(event) =>
                        updateProductForm("image", event.target.value)
                      }
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-black text-slate-700">
                      Price
                    </span>
                    <input
                      value={productForm.price}
                      onChange={(event) =>
                        updateProductForm("price", event.target.value)
                      }
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="49.99"
                      className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-slate-700">
                      Stock
                    </span>
                    <input
                      value={productForm.stock}
                      onChange={(event) =>
                        updateProductForm("stock", event.target.value)
                      }
                      type="number"
                      min="0"
                      step="1"
                      placeholder="25"
                      className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    Description
                  </span>
                  <textarea
                    value={productForm.description}
                    onChange={(event) =>
                      updateProductForm("description", event.target.value)
                    }
                    rows={5}
                    placeholder="Describe materials, size, features, warranty, or anything buyers should know."
                    className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  />
                </label>
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={closeAddProduct}
                  className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:border-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-11 rounded-lg bg-teal-500 px-5 text-sm font-black text-slate-950 transition hover:bg-teal-400"
                >
                  Save product
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
