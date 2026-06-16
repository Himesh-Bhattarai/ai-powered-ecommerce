import Navbar from "@/components/layout/Navbar";

const supportSections = [
  {
    id: "returns",
    title: "Returns & refunds",
    text: "Start return requests for eligible items, review refund status, and get help when a delivery arrives damaged or incorrect.",
  },
  {
    id: "shipping",
    title: "Shipping information",
    text: "Check delivery timelines, address details, shipping fees, and handoff updates from marketplace sellers.",
  },
  {
    id: "buyer-protection",
    title: "Buyer protection",
    text: "Shop with support for order issues, seller disputes, payment questions, and product problems after delivery.",
  },
  {
    id: "seller-support",
    title: "Seller support",
    text: "Get help with product listings, inventory, order handling, payout questions, and marketplace account setup.",
  },
  {
    id: "contact",
    title: "Contact us",
    text: "Send order, account, or seller questions through support. Include your email, order details, and a short issue summary.",
  },
  {
    id: "privacy",
    title: "Privacy notice",
    text: "Bazar uses account, cart, wishlist, and shopping behavior data to operate the marketplace and personalize product discovery.",
  },
  {
    id: "terms",
    title: "Terms of use",
    text: "Use Bazar for lawful shopping, accurate account information, respectful seller communication, and secure checkout activity.",
  },
  {
    id: "seller-policy",
    title: "Seller policy",
    text: "Sellers are expected to provide accurate listings, fair pricing, reliable stock updates, and timely customer support.",
  },
];

export default function HelpSupportPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-teal-700">Support</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          Help & Support
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">
          Find help with orders, returns, payments, seller questions, and account
          access.
        </p>

        <section
          id="about"
          className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm font-black uppercase text-teal-700">About Bazar</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Marketplace support for buyers and sellers
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
            Bazar connects shoppers with marketplace products, saved items,
            checkout, seller tools, and AI-assisted product discovery.
          </p>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {supportSections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-black text-slate-950">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {section.text}
              </p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
