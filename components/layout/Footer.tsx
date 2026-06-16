import Link from "next/link";

type FooterLink = {
  label: string;
  href: string;
};

type FooterSection = {
  title: string;
  links: FooterLink[];
};

const footerSections: FooterSection[] = [
  {
    title: "Shop",
    links: [
      { label: "All products", href: "/" },
      { label: "Electronics", href: "/?category=Electronics" },
      { label: "Clothing", href: "/?category=Clothing" },
      { label: "Home & Kitchen", href: "/?category=Home%20%26%20Kitchen" },
      { label: "Sports & Outdoors", href: "/?category=Sports%20%26%20Outdoors" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "Help center", href: "/help-support" },
      { label: "Track orders", href: "/account" },
      { label: "Returns & refunds", href: "/help-support#returns" },
      { label: "Shipping information", href: "/help-support#shipping" },
      { label: "Payment options", href: "/checkout" },
    ],
  },
  {
    title: "Sell On Bazar",
    links: [
      { label: "Become a seller", href: "/become-seller" },
      { label: "Seller support", href: "/help-support#seller-support" },
      { label: "Marketplace fees", href: "/become-seller#fees" },
      { label: "Product advertising", href: "/become-seller#advertising" },
      { label: "Vendor tools", href: "/become-seller#tools" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/signup" },
      { label: "Account dashboard", href: "/account" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Checkout", href: "/checkout" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About Bazar", href: "/help-support#about" },
      { label: "Contact us", href: "/help-support#contact" },
      { label: "Buyer protection", href: "/help-support#buyer-protection" },
      { label: "Privacy notice", href: "/help-support#privacy" },
      { label: "Terms of use", href: "/help-support#terms" },
    ],
  },
];

const paymentMethods = [
  "Cash on delivery",
  "Card",
  "eSewa",
  "Khalti",
  "Bank transfer",
];

const serviceHighlights = [
  "Secure checkout",
  "Seller verified listings",
  "Buyer support",
  "Easy returns",
];

const policyLinks: FooterLink[] = [
  { label: "Privacy", href: "/help-support#privacy" },
  { label: "Terms", href: "/help-support#terms" },
  { label: "Returns", href: "/help-support#returns" },
  { label: "Seller policy", href: "/help-support#seller-policy" },
];

function FooterSectionList({ section }: { section: FooterSection }) {
  return (
    <section>
      <h2 className="text-sm font-black text-white">{section.title}</h2>
      <ul className="mt-4 space-y-2.5">
        {section.links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="bg-slate-900 px-4 py-3 text-center">
        <a
          href="#"
          className="text-sm font-bold text-slate-200 transition hover:text-white"
        >
          Back to top
        </a>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_2fr] lg:items-start">
          <section>
            <Link href="/" className="text-2xl font-black uppercase text-white">
              Bazar
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              A marketplace for everyday products, smart shopping, seller listings,
              and AI-assisted product discovery.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {serviceHighlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm font-black text-white">Need help?</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Get support for orders, payments, returns, seller questions, and
                account access.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/help-support"
                  className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-teal-400"
                >
                  Help center
                </Link>
                <Link
                  href="/become-seller"
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Sell with us
                </Link>
              </div>
            </div>
          </section>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-5">
            {footerSections.map((section) => (
              <FooterSectionList key={section.title} section={section} />
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 border-t border-slate-800 pt-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <section>
            <h2 className="text-sm font-black text-white">Payment methods</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <span
                  key={method}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300"
                >
                  {method}
                </span>
              ))}
            </div>
          </section>

          <section className="lg:text-right">
            <h2 className="text-sm font-black text-white">Shop with confidence</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400 lg:max-w-sm">
              Product details, seller support, cart checkout, and saved items are
              ready for your ecommerce workflow.
            </p>
          </section>
        </div>
      </div>

      <div className="border-t border-slate-800 px-4 py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Bazar. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {policyLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-semibold transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
