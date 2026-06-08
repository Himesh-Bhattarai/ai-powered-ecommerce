import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import Footer from "@/components/layout/Footer";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bazar | AI-powered marketplace",
  description: "Shop products, compare ideas, and build your cart on Bazar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <WishlistProvider>
          <CartProvider>
            {children}
            <Footer />
          </CartProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
