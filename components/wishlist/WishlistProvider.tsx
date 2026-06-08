"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product } from "@/types/product";

type WishlistContextValue = {
  items: Product[];
  totalItems: number;
  isSaved: (productId: string) => boolean;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
};

const WISHLIST_STORAGE_KEY = "bazar-wishlist";
const WishlistContext = createContext<WishlistContextValue | null>(null);

function readInitialWishlist(): Product[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedWishlist = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    const parsedWishlist = storedWishlist ? JSON.parse(storedWishlist) : [];

    return Array.isArray(parsedWishlist)
      ? parsedWishlist.filter((product) => product?._id && product?.name)
      : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>(readInitialWishlist);

  useEffect(() => {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const removeItem = useCallback((productId: string) => {
    setItems((currentItems) =>
      currentItems.filter((product) => product._id !== productId)
    );
  }, []);

  const toggleItem = useCallback((product: Product) => {
    setItems((currentItems) => {
      const productExists = currentItems.some((item) => item._id === product._id);

      if (productExists) {
        return currentItems.filter((item) => item._id !== product._id);
      }

      return [product, ...currentItems];
    });
  }, []);

  const isSaved = useCallback(
    (productId: string) => items.some((product) => product._id === productId),
    [items]
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      totalItems: items.length,
      isSaved,
      removeItem,
      toggleItem,
    }),
    [isSaved, items, removeItem, toggleItem]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }

  return context;
}
