"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type FormData = {
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  ownerName: string;
  email: string;
  sellerType: "individual" | "business";
  citizenshipNumber: string;
  personalAddress: string;
  shopName: string;
  businessName: string;
  businessAddress: string;
  warehouseAddress: string;
  returnAddress: string;
  category: string;
  monthlyProducts: string;
  taxNumber: string;
  registrationNumber: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  bankBranch: string;
};

type Step = {
  title: string;
  eyebrow: string;
  fields: (keyof FormData)[];
};

const initialFormData: FormData = {
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  ownerName: "",
  email: "",
  sellerType: "individual",
  citizenshipNumber: "",
  personalAddress: "",
  shopName: "",
  businessName: "",
  businessAddress: "",
  warehouseAddress: "",
  returnAddress: "",
  category: "",
  monthlyProducts: "",
  taxNumber: "",
  registrationNumber: "",
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  bankBranch: "",
};

const steps: Step[] = [
  {
    title: "Seller login",
    eyebrow: "Step 1",
    fields: ["phoneNumber", "password", "confirmPassword"],
  },
  {
    title: "Personal info",
    eyebrow: "Step 2",
    fields: [
      "ownerName",
      "email",
      "sellerType",
      "citizenshipNumber",
      "personalAddress",
    ],
  },
  {
    title: "Shop details",
    eyebrow: "Step 3",
    fields: [
      "shopName",
      "businessName",
      "businessAddress",
      "warehouseAddress",
      "returnAddress",
      "category",
      "monthlyProducts",
    ],
  },
  {
    title: "Bank & verification",
    eyebrow: "Step 4",
    fields: [
      "taxNumber",
      "registrationNumber",
      "bankName",
      "accountHolder",
      "accountNumber",
      "bankBranch",
    ],
  },
];

const benefits = [
  {
    title: "0% launch fee",
    text: "Start selling with a launch-friendly fee period for new sellers.",
  },
  {
    title: "Nationwide reach",
    text: "List products for customers across the country from one storefront.",
  },
  {
    title: "Seller training",
    text: "Get onboarding guidance for catalog, pricing, orders, and support.",
  },
  {
    title: "Marketing tools",
    text: "Use product visibility, category placement, and bundle campaigns.",
  },
  {
    title: "Weekly payouts",
    text: "Connect bank details and prepare for scheduled settlement cycles.",
  },
  {
    title: "Delivery programs",
    text: "Support shipping, returns, and customer communication in one workflow.",
  },
];

const stats = [
  { value: "5M", label: "Monthly marketplace shoppers" },
  { value: "22M", label: "Products ready for discovery" },
  { value: "0%", label: "Launch fee for eligible sellers" },
];

const sellingSteps = [
  "Sign up with your mobile number",
  "Fill contact email and address details",
  "Submit identity, tax, and bank details",
  "Upload products and start receiving orders",
];

const categories = [
  "Electronics",
  "Clothing",
  "Home & Kitchen",
  "Sports & Outdoors",
  "Beauty & Personal Care",
  "Books",
  "Toys & Games",
  "Automotive",
];

const sellerStories = [
  {
    name: "Sanjay Amatya",
    business: "Garments seller",
    text: "After moving online, his product line reached new customers outside his local market and order volume became easier to manage.",
  },
  {
    name: "Rajani Thapa",
    business: "Creative goods seller",
    text: "Training, catalog tools, and marketplace visibility helped her turn a small local shop into a wider ecommerce business.",
  },
];

const programs = [
  {
    id: "tools",
    title: "Local seller program",
    text: "For sellers based locally who want storefront tools, product visibility, and customer reach.",
    points: [
      "You are based locally",
      "Access to seller tools",
      "Launch support for new sellers",
    ],
  },
  {
    id: "advertising",
    title: "Brand seller program",
    text: "For brand owners or authorized sellers who need stronger catalog trust and search visibility.",
    points: [
      "Brand owner or authorized reseller",
      "Improved catalog presentation",
      "Separate campaign visibility",
    ],
  },
  {
    id: "fees",
    title: "Seller fee guidance",
    text: "Review launch fees, promotions, settlement timing, shipping programs, and category rules before onboarding.",
    points: [
      "Transparent payout setup",
      "Category and product review",
      "Support before publishing",
    ],
  },
];

const faqs = [
  {
    question: "What do I need to start selling?",
    answer:
      "You need a working mobile number, email, identity details, shop information, pickup and return addresses, tax or business details, and bank account information.",
  },
  {
    question: "Can individuals sell without a company?",
    answer:
      "Yes. Individual sellers can start with personal identity details. Business sellers should also provide registration and tax information.",
  },
  {
    question: "When do I add products?",
    answer:
      "After your seller profile is reviewed, you can add products, images, prices, stock, and delivery details.",
  },
  {
    question: "How do sellers get paid?",
    answer:
      "Payouts are sent to the bank account connected during onboarding after orders are completed and reconciled.",
  },
];

function sanitizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getFieldLabel(field: keyof FormData) {
  const labels: Record<keyof FormData, string> = {
    phoneNumber: "Mobile number",
    password: "Password",
    confirmPassword: "Confirm password",
    ownerName: "Full legal name",
    email: "Contact email",
    sellerType: "Seller type",
    citizenshipNumber: "Citizenship or ID number",
    personalAddress: "Personal address",
    shopName: "Shop name",
    businessName: "Business or company name",
    businessAddress: "Business address",
    warehouseAddress: "Pickup or warehouse address",
    returnAddress: "Return address",
    category: "Main product category",
    monthlyProducts: "Estimated live products",
    taxNumber: "PAN or VAT number",
    registrationNumber: "Business registration number",
    bankName: "Bank name",
    accountHolder: "Account holder name",
    accountNumber: "Bank account number",
    bankBranch: "Bank branch",
  };

  return labels[field];
}

function TextField({
  error,
  label,
  name,
  onChange,
  placeholder,
  required = true,
  type = "text",
  value,
}: {
  error?: string;
  label: string;
  name: keyof FormData;
  onChange: (name: keyof FormData, value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        className={`mt-2 h-12 w-full rounded-lg border bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-50"
            : "border-slate-200 focus:border-teal-500 focus:ring-teal-100"
        }`}
      />
      {error ? (
        <span className="mt-1 block text-xs font-semibold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function TextAreaField({
  error,
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
  error?: string;
  label: string;
  name: keyof FormData;
  onChange: (name: keyof FormData, value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">
        {label}
        <span className="text-red-600"> *</span>
      </span>
      <textarea
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`mt-2 w-full resize-none rounded-lg border bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-50"
            : "border-slate-200 focus:border-teal-500 focus:ring-teal-100"
        }`}
      />
      {error ? (
        <span className="mt-1 block text-xs font-semibold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export default function SellerSignupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const step = steps[currentStep];
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);
  const completedFields = useMemo(
    () =>
      Object.values(formData).filter((value) => String(value).trim().length > 0)
        .length,
    [formData]
  );

  const updateField = (name: keyof FormData, value: string) => {
    setFormData((currentData) => ({
      ...currentData,
      [name]: name === "phoneNumber" ? sanitizePhone(value) : value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
  };

  const validateStep = () => {
    const nextErrors: Partial<Record<keyof FormData, string>> = {};

    for (const field of step.fields) {
      const value = String(formData[field] || "").trim();

      if (!value) {
        nextErrors[field] = `${getFieldLabel(field)} is required`;
      }
    }

    if (currentStep === 0 && formData.phoneNumber.length !== 10) {
      nextErrors.phoneNumber = "Enter a valid 10 digit mobile number";
    }

    if (currentStep === 0 && formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    if (currentStep === 0 && formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (currentStep === 1 && formData.email && !isValidEmail(formData.email)) {
      nextErrors.email = "Enter a valid email address";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) {
      return;
    }

    setCurrentStep((value) => Math.min(value + 1, steps.length - 1));
  };

  const goBack = () => {
    setCurrentStep((value) => Math.max(value - 1, 0));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateStep()) {
      return;
    }

    setSubmitted(true);
  };

  const resetForm = () => {
    setSubmitted(false);
    setCurrentStep(0);
    setFormData(initialFormData);
    setErrors({});
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <Image
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1800&q=80"
          alt="Online seller packing customer orders"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-slate-950/60" />

        <div className="relative mx-auto grid min-h-[680px] max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase text-teal-300">
              Bazar Seller Signup Benefits
            </p>
            <h1 className="mt-4 text-4xl font-black uppercase leading-tight text-white sm:text-6xl">
              Grow your business with us!
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
              Open a seller account, list products, reach more buyers, and manage
              your ecommerce workflow from one marketplace.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="border-l-4 border-teal-400 bg-white/10 px-4 py-3 backdrop-blur"
                >
                  <p className="text-3xl font-black text-white">{item.value}</p>
                  <p className="mt-1 text-xs font-bold uppercase leading-5 text-slate-200">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <section
            aria-labelledby="seller-signup-title"
            className="rounded-lg bg-white p-5 text-slate-950 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase text-teal-700">
                  {step.eyebrow}
                </p>
                <h2 id="seller-signup-title" className="mt-1 text-2xl font-black">
                  Sign up as a Bazar Seller
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {progress}%
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Already have a seller account?{" "}
              <Link
                href="/seller-dashboard"
                className="font-bold text-teal-700 hover:text-teal-800"
              >
                Open seller dashboard
              </Link>
            </p>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            {submitted ? (
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-lg font-black text-emerald-800">
                  Seller profile ready for review
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  Your details are ready to connect with backend seller
                  onboarding. You completed {completedFields} profile fields.
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-4 h-11 rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Start another signup
                </button>
                <Link
                  href="/seller-dashboard"
                  className="ml-3 mt-4 inline-flex h-11 items-center rounded-lg bg-teal-500 px-4 text-sm font-black text-slate-950 transition hover:bg-teal-400"
                >
                  View seller dashboard
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6">
                {currentStep === 0 && (
                  <div className="grid gap-4">
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        Mobile number <span className="text-red-600">*</span>
                      </span>
                      <div
                        className={`mt-2 grid h-12 grid-cols-[92px_1fr] overflow-hidden rounded-lg border bg-white ${
                          errors.phoneNumber ? "border-red-300" : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2 border-r border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700">
                          <span className="inline-block h-4 w-6 rounded-sm bg-red-600" />
                          +977
                        </div>
                        <input
                          inputMode="numeric"
                          value={formData.phoneNumber}
                          onChange={(event) =>
                            updateField("phoneNumber", event.target.value)
                          }
                          placeholder="9xxxxxxxxx"
                          className="h-full min-w-0 px-4 text-sm outline-none"
                        />
                      </div>
                      {errors.phoneNumber ? (
                        <span className="mt-1 block text-xs font-semibold text-red-600">
                          {errors.phoneNumber}
                        </span>
                      ) : null}
                    </label>
                    <TextField
                      label="Password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={updateField}
                      error={errors.password}
                      placeholder="Minimum 8 characters"
                    />
                    <TextField
                      label="Confirm password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={updateField}
                      error={errors.confirmPassword}
                      placeholder="Repeat password"
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-black text-slate-950">
                        Seller login account
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        This mobile number and password will be used for the
                        seller dashboard, separate from the normal customer login.
                        By clicking Next, you agree to Bazar seller terms,
                        privacy policy, marketplace communication, and seller
                        verification.
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="grid gap-4">
                    <TextField
                      label="Full legal name"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={updateField}
                      error={errors.ownerName}
                      placeholder="Your full name"
                    />
                    <TextField
                      label="Contact email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={updateField}
                      error={errors.email}
                      placeholder="seller@example.com"
                    />
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        Seller type <span className="text-red-600">*</span>
                      </span>
                      <select
                        value={formData.sellerType}
                        onChange={(event) =>
                          updateField(
                            "sellerType",
                            event.target.value as FormData["sellerType"]
                          )
                        }
                        className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                      >
                        <option value="individual">Individual seller</option>
                        <option value="business">Registered business</option>
                      </select>
                    </label>
                    <TextField
                      label="Citizenship or ID number"
                      name="citizenshipNumber"
                      value={formData.citizenshipNumber}
                      onChange={updateField}
                      error={errors.citizenshipNumber}
                      placeholder="Identity document number"
                    />
                    <TextAreaField
                      label="Personal address"
                      name="personalAddress"
                      value={formData.personalAddress}
                      onChange={updateField}
                      error={errors.personalAddress}
                      placeholder="Street, city, province"
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="grid gap-4">
                    <TextField
                      label="Shop name"
                      name="shopName"
                      value={formData.shopName}
                      onChange={updateField}
                      error={errors.shopName}
                      placeholder="Example: Himalayan Home Store"
                    />
                    <TextField
                      label="Business or company name"
                      name="businessName"
                      value={formData.businessName}
                      onChange={updateField}
                      error={errors.businessName}
                      placeholder="Legal business name"
                    />
                    <TextAreaField
                      label="Business address"
                      name="businessAddress"
                      value={formData.businessAddress}
                      onChange={updateField}
                      error={errors.businessAddress}
                      placeholder="Registered or operating address"
                    />
                    <TextAreaField
                      label="Pickup or warehouse address"
                      name="warehouseAddress"
                      value={formData.warehouseAddress}
                      onChange={updateField}
                      error={errors.warehouseAddress}
                      placeholder="Where orders will be picked up"
                    />
                    <TextAreaField
                      label="Return address"
                      name="returnAddress"
                      value={formData.returnAddress}
                      onChange={updateField}
                      error={errors.returnAddress}
                      placeholder="Where returned items should be sent"
                    />
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        Main product category <span className="text-red-600">*</span>
                      </span>
                      <select
                        value={formData.category}
                        onChange={(event) => updateField("category", event.target.value)}
                        className={`mt-2 h-12 w-full rounded-lg border bg-white px-4 text-sm font-bold outline-none transition focus:ring-4 ${
                          errors.category
                            ? "border-red-300 focus:border-red-400 focus:ring-red-50"
                            : "border-slate-200 focus:border-teal-500 focus:ring-teal-100"
                        }`}
                      >
                        <option value="">Choose category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {errors.category ? (
                        <span className="mt-1 block text-xs font-semibold text-red-600">
                          {errors.category}
                        </span>
                      ) : null}
                    </label>
                    <TextField
                      label="Estimated live products"
                      name="monthlyProducts"
                      value={formData.monthlyProducts}
                      onChange={updateField}
                      error={errors.monthlyProducts}
                      placeholder="Example: 50"
                    />
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="grid gap-4">
                    <TextField
                      label="PAN or VAT number"
                      name="taxNumber"
                      value={formData.taxNumber}
                      onChange={updateField}
                      error={errors.taxNumber}
                      placeholder="Tax registration number"
                    />
                    <TextField
                      label="Business registration number"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={updateField}
                      error={errors.registrationNumber}
                      placeholder="Registration or license number"
                    />
                    <TextField
                      label="Bank name"
                      name="bankName"
                      value={formData.bankName}
                      onChange={updateField}
                      error={errors.bankName}
                      placeholder="Bank name"
                    />
                    <TextField
                      label="Account holder name"
                      name="accountHolder"
                      value={formData.accountHolder}
                      onChange={updateField}
                      error={errors.accountHolder}
                      placeholder="Name as shown in bank"
                    />
                    <TextField
                      label="Bank account number"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={updateField}
                      error={errors.accountNumber}
                      placeholder="Account number"
                    />
                    <TextField
                      label="Bank branch"
                      name="bankBranch"
                      value={formData.bankBranch}
                      onChange={updateField}
                      error={errors.bankBranch}
                      placeholder="Branch name"
                    />
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                      <p className="text-sm font-black text-slate-950">
                        Documents to prepare
                      </p>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-slate-600">
                        <li>Citizenship, passport, or national ID image</li>
                        <li>PAN, VAT, or business registration document</li>
                        <li>Bank account proof or cancelled cheque</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={currentStep === 0}
                    className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Back
                  </button>
                  {currentStep < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="h-11 rounded-lg bg-teal-500 px-5 text-sm font-black text-slate-950 transition hover:bg-teal-400"
                    >
                      Submit seller profile
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase text-teal-700">
              New Seller Benefits
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Launch with the support sellers expect
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="text-lg font-black text-slate-950">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {benefit.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-teal-700">
              Steps to Start Selling
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Sign up, verify, list, and sell
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Bazar gives sellers a guided path from phone signup to product
              listing, with the details needed for verification and payouts.
            </p>
            <a
              href="#seller-signup-title"
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Sign up now
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {sellingSteps.map((item, index) => (
              <article
                key={item}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-3xl font-black text-teal-600">
                  {index + 1}.
                </p>
                <h3 className="mt-3 text-base font-black text-slate-950">
                  {item}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase text-teal-700">
                Seller Stories
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Local sellers can grow online
              </h2>
            </div>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {sellerStories.map((story) => (
              <article
                key={story.name}
                className="rounded-lg border border-slate-200 bg-slate-50 p-6"
              >
                <h3 className="text-xl font-black text-slate-950">
                  {story.name}
                </h3>
                <p className="mt-1 text-sm font-bold text-teal-700">
                  {story.business}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {story.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase text-teal-700">
            Seller Program
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Choose the path that fits your business
          </h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {programs.map((program) => (
              <article
                key={program.id}
                id={program.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-black text-slate-950">
                  {program.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {program.text}
                </p>
                <ul className="mt-4 space-y-2">
                  {program.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2 text-sm font-semibold text-slate-700"
                    >
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-teal-700">
              Seller Support
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Support before and after launch
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Sellers need onboarding, catalog training, policy help, and a
              community for practical ecommerce questions.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-black text-slate-950">Onboarding course</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Learn product content, operations, fulfillment, returns, and
                customer support basics.
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-black text-slate-950">Seller community</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Connect with other sellers, discuss ecommerce issues, and share
                practical growth ideas.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase text-teal-700">FAQ</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Seller questions
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <article
                key={item.question}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-black text-slate-950">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-12 text-center text-white">
        <p className="text-sm font-black uppercase text-teal-300">
          What are you waiting for?
        </p>
        <h2 className="mx-auto mt-2 max-w-3xl text-3xl font-black tracking-tight">
          Start selling with Bazar today.
        </h2>
        <a
          href="#seller-signup-title"
          className="mt-6 inline-flex rounded-lg bg-teal-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-400"
        >
          Start seller signup
        </a>
      </section>
    </div>
  );
}
