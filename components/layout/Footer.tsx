import Link from "next/link";

const footerSections = [
  {
    title: "Get to know us",
    links: [
      { label: "About Bazar", href: "/help-support" },
      { label: "Shop products", href: "/" },
      { label: "Saved items", href: "/wishlist" },
      { label: "Your account", href: "/account" },
    ],
  },
  {
    title: "Customer service",
    links: [
      { label: "Help center", href: "/help-support" },
      { label: "Your account", href: "/account" },
      { label: "Checkout", href: "/checkout" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Sell with us",
    links: [
      { label: "Become a seller", href: "/become-seller" },
      { label: "Seller help", href: "/help-support" },
      { label: "Advertise products", href: "/become-seller" },
      { label: "Vendor tools", href: "/become-seller" },
    ],
  },
  {
    title: "Shop categories",
    links: [
      { label: "Electronics", href: "/?category=Electronics" },
      { label: "Clothing", href: "/?category=Clothing" },
      { label: "Home & Kitchen", href: "/?category=Home%20%26%20Kitchen" },
      { label: "Sports & Outdoors", href: "/?category=Sports%20%26%20Outdoors" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="bg-slate-900 px-4 py-3 text-center">
        <Link
          href="/"
          className="text-sm font-semibold text-slate-200 transition hover:text-white"
        >
          Back to top
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {footerSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-bold text-white">{section.title}</h2>
            <ul className="mt-4 space-y-2">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 px-4 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-xl font-black tracking-tight text-white">
            Bazar
          </Link>
          <p className="text-sm text-slate-400">This is about us.</p>
        </div>
      </div>
    </footer>
  );
}
