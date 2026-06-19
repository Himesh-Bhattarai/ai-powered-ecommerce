"use client";

import { createContext, useContext, useEffect, useState } from "react";

const SellerContext = createContext(null);

export function SellerProvider({ children }) {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadSellerState({ setPending = true } = {}) {
    try {
      if (setPending) {
        setLoading(true);
      }

      setError(null);

      const res = await fetch("/api/seller-me", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setSeller(null);
        setError(data?.message || "Seller not logged in");
        return null;
      }

      setSeller(data?.seller ?? null);
      setError(null);
      return data?.seller ?? null;
    } catch {
      setSeller(null);
      setError("Something went wrong while loading seller");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function refreshSeller() {
    return loadSellerState({ setPending: true });
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadSellerState({ setPending: false });
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  function login(sellerData) {
    setSeller(sellerData);
    setError(null);
  }

  function logout() {
    setSeller(null);
    setError(null);
  }

  return (
    <SellerContext.Provider
      value={{
        seller,
        setSeller,
        loading,
        error,
        login,
        logout,
        refreshSeller,
      }}
    >
      {children}
    </SellerContext.Provider>
  );
}

export function useSeller() {
  const context = useContext(SellerContext);

  if (!context) {
    throw new Error("useSeller must be used inside SellerProvider");
  }

  return context;
}
