"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

export default function SearchNavbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearchSubmit = (value: string) => {
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
