"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";

const hiddenFooterRoutes = ["/seller-dashboard"];

export default function FooterGate() {
  const pathname = usePathname();
  const shouldHideFooter = hiddenFooterRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (shouldHideFooter) {
    return null;
  }

  return <Footer />;
}
