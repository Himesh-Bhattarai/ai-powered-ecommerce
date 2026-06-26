import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { trackUserEvent } from "@/lib/personalization/client";
import type { Product } from "@/types/product";

// Cart Item data structure
export type CartItem = {
  product: Product;
  quantity: number;
};

// Server cart item
type ServerCartItem = {
  productId: string;
  quantity: number;
  product?: Product | null;
};

// server response formate

type ServerCartResponse = {
  cart?: {
    items?: ServerCartItem[];
  };
  message?: string;
};

//Cart store
type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  hasHydrated: boolean;
  isSyncing: boolean;
  lastSyncError: string | null;
  addItem: (product: Product, quantity?: number) => void;
  clearCart: () => void;
  closeCart: () => void;
  openCart: () => void;
  removeItem: (productId: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setQuantity: (productId: string, quantity: number) => void;
  syncFromServer: () => Promise<void>;
  syncToServer: (items?: CartItem[]) => Promise<void>;
};

type PersistedCartState = Pick<CartStore, "items">;

const CART_STORAGE_KEY = "bazar-cart";
const CART_STORAGE_VERSION = 1;

// Normalize Quantity
function normalizeQuantity(quantity: number, product?: Product) {
  const nextQuantity = Math.max(0, Math.floor(Number(quantity) || 0));

  if (typeof product?.stock === "number") {
    return Math.min(nextQuantity, Math.max(0, Math.floor(product.stock)));
  }

  return nextQuantity;
}

// check item is valid and quentity is not negative
function normalizeLocalItems(items: CartItem[]) {
  return items
    .filter((item) => item?.product?._id && item.quantity > 0)
    .map((item) => ({
      product: item.product,
      quantity: normalizeQuantity(item.quantity, item.product),
    }))
    .filter((item) => item.quantity > 0);
}


function normalizeServerItems(cart?: ServerCartResponse["cart"]): CartItem[] {
  if (!Array.isArray(cart?.items)) {
    return [];
  }

  return cart.items
    .filter((item) => item.product?._id && item.quantity > 0)
    .map((item) => ({
      product: item.product as Product,
      quantity: normalizeQuantity(item.quantity, item.product || undefined),
    }))
    .filter((item) => item.quantity > 0);
}

function mergeCartItems(serverItems: CartItem[], localItems: CartItem[]) {
  const itemMap = new Map<string, CartItem>();

  [...serverItems, ...localItems].forEach((item) => {
    const productId = item.product._id;
    const existingItem = itemMap.get(productId);
    const quantity = normalizeQuantity(
      Math.max(existingItem?.quantity || 0, item.quantity),
      item.product
    );

    if (quantity > 0) {
      itemMap.set(productId, {
        product: existingItem?.product || item.product,
        quantity,
      });
    }
  });

  return Array.from(itemMap.values());
}

function cartItemsEqual(firstItems: CartItem[], secondItems: CartItem[]) {
  if (firstItems.length !== secondItems.length) {
    return false;
  }

  const secondItemMap = new Map(
    secondItems.map((item) => [item.product._id, item.quantity])
  );

  return firstItems.every(
    (item) => secondItemMap.get(item.product._id) === item.quantity
  );
}

function toServerItems(items: CartItem[]) {
  return normalizeLocalItems(items).map((item) => ({
    productId: item.product._id,
    quantity: item.quantity,
  }));
}

async function readJson(response: Response): Promise<ServerCartResponse> {
  return response.json().catch(() => ({}));
}

function createCartStorage() {
  return createJSONStorage<PersistedCartState>(() => ({
    getItem: (name) => {
      const storedValue = localStorage.getItem(name);

      if (!storedValue) {
        return null;
      }

      try {
        const parsedValue = JSON.parse(storedValue);

        if (Array.isArray(parsedValue)) {
          return JSON.stringify({
            state: { items: parsedValue },
            version: CART_STORAGE_VERSION,
          });
        }

        if (parsedValue && typeof parsedValue === "object") {
          return storedValue;
        }
      } catch {
        return null;
      }

      return null;
    },
    setItem: (name, value) => localStorage.setItem(name, value),
    removeItem: (name) => localStorage.removeItem(name),
  }));
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      hasHydrated: false,
      isSyncing: false,
      lastSyncError: null,
      addItem: (product, quantity = 1) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(
          (item) => item.product._id === product._id
        );
        const quantityToAdd = normalizeQuantity(quantity, product);

        if (quantityToAdd <= 0) {
          return;
        }

        const nextItems = existingItem
          ? currentItems.map((item) =>
              item.product._id === product._id
                ? {
                    ...item,
                    quantity: normalizeQuantity(
                      item.quantity + quantityToAdd,
                      product
                    ),
                  }
                : item
            )
          : [
              ...currentItems,
              {
                product,
                quantity: quantityToAdd,
              },
            ];

        set({
          items: normalizeLocalItems(nextItems),
          isOpen: true,
        });
        void trackUserEvent({
          eventType: "add_to_cart",
          productId: product._id,
          productName: product.name,
          category: product.category,
          quantity: quantityToAdd,
        });
        void get().syncToServer();
      },
      clearCart: () => {
        set({ items: [] });
        void get().syncToServer([]);
      },
      closeCart: () => set({ isOpen: false }),
      openCart: () => set({ isOpen: true }),
      removeItem: (productId) => {
        const nextItems = get().items.filter(
          (item) => item.product._id !== productId
        );

        set({ items: nextItems });
        void get().syncToServer(nextItems);
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setQuantity: (productId, quantity) => {
        const nextItems = get()
          .items.map((item) =>
            item.product._id === productId
              ? {
                  ...item,
                  quantity: normalizeQuantity(quantity, item.product),
                }
              : item
          )
          .filter((item) => item.quantity > 0);

        set({ items: nextItems });
        void get().syncToServer(nextItems);
      },
      syncFromServer: async () => {
        try {
          set({ isSyncing: true, lastSyncError: null });

          const response = await fetch("/api/cart", {
            credentials: "include",
          });

          if (response.status === 401) {
            set({ isSyncing: false, lastSyncError: null });
            return;
          }

          const data = await readJson(response);

          if (!response.ok) {
            throw new Error(data.message || "Unable to load cart");
          }

          const serverItems = normalizeServerItems(data.cart);
          const localItems = normalizeLocalItems(get().items);
          const mergedItems = mergeCartItems(serverItems, localItems);

          set({ items: mergedItems, isSyncing: false, lastSyncError: null });

          if (!cartItemsEqual(serverItems, mergedItems)) {
            await get().syncToServer(mergedItems);
          }
        } catch (error) {
          set({
            isSyncing: false,
            lastSyncError:
              error instanceof Error ? error.message : "Unable to sync cart",
          });
        }
      },
      syncToServer: async (items = get().items) => {
        try {
          set({ isSyncing: true, lastSyncError: null });

          const response = await fetch("/api/cart", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              items: toServerItems(items),
            }),
          });

          if (response.status === 401) {
            set({ isSyncing: false, lastSyncError: null });
            return;
          }

          const data = await readJson(response);

          if (!response.ok) {
            throw new Error(data.message || "Unable to sync cart");
          }

          set({
            items: normalizeServerItems(data.cart),
            isSyncing: false,
            lastSyncError: null,
          });
        } catch (error) {
          set({
            isSyncing: false,
            lastSyncError:
              error instanceof Error ? error.message : "Unable to sync cart",
          });
        }
      },
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createCartStorage(),
      version: CART_STORAGE_VERSION,
      partialize: (state) => ({
        items: normalizeLocalItems(state.items),
      }),
      merge: (persistedState, currentState) => {
        const persistedItems = (persistedState as PersistedCartState | undefined)
          ?.items;

        return {
          ...currentState,
          items: normalizeLocalItems(
            Array.isArray(persistedItems) ? persistedItems : []
          ),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
