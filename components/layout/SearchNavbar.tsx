"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { trackUserEvent } from "@/lib/personalization/client";

export default function SearchNavbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearchSubmit = (value: string) => {
    void trackUserEvent({
      eventType: "search",
      query: value,
      metadata: {
        source: "product-detail-navbar",
      },
    });
    router.push(`/?q=${encodeURIComponent(value)}`);
  };

  return (
    <Navbar
      searchValue={query}
      onSearchChange={setQuery}
      onSearchSubmit={handleSearchSubmit}
    />
  );
}
