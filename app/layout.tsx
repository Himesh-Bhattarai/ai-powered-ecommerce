import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import FooterGate from "@/components/layout/FooterGate";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import "./globals.css";
import { AuthProvider } from "@/context/authContext";

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
        <AuthProvider >
        <WishlistProvider>
          <CartProvider>
            {children}
            <FooterGate />
          </CartProvider>
        </WishlistProvider>
        </ AuthProvider >
      </body>
    </html>
  );
}
