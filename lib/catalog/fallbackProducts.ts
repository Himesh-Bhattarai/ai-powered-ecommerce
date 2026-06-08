import type { Product } from "@/types/product";

export const fallbackProducts: Product[] = [
  {
    _id: "665f10000000000000000001",
    name: "Ergo Desk Setup Bundle",
    description:
      "A clean starter bundle for home office upgrades with a desk mat, laptop stand, and cable-friendly workspace accessories.",
    price: 79,
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    category: "Home Office",
    stock: 18,
  },
  {
    _id: "665f10000000000000000002",
    name: "Wireless Noise Canceling Headphones",
    description:
      "Lightweight over-ear headphones made for focus, calls, music, and long daily use.",
    price: 129,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    category: "Electronics",
    stock: 11,
  },
  {
    _id: "665f10000000000000000003",
    name: "RGB Mechanical Gaming Keyboard",
    description:
      "A compact mechanical keyboard with tactile keys, bright lighting, and a sturdy desk-ready frame.",
    price: 64,
    image:
      "https://images.unsplash.com/photo-1541140532154-b024d705b90a?auto=format&fit=crop&w=900&q=80",
    category: "Gaming",
    stock: 7,
  },
  {
    _id: "665f10000000000000000004",
    name: "Pet Comfort Starter Kit",
    description:
      "Soft pet essentials for a calmer home setup, including comfort, grooming, and everyday care ideas.",
    price: 42,
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    category: "Pet Supplies",
    stock: 24,
  },
  {
    _id: "665f10000000000000000005",
    name: "Everyday Travel Backpack",
    description:
      "A practical backpack for work, campus, and short travel with organized pockets and a clean profile.",
    price: 58,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    category: "Fashion",
    stock: 15,
  },
  {
    _id: "665f10000000000000000006",
    name: "Smart Fitness Watch",
    description:
      "A simple daily fitness watch for activity tracking, reminders, workouts, and everyday style.",
    price: 96,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    category: "Electronics",
    stock: 9,
  },
  {
    _id: "665f10000000000000000007",
    name: "Minimal Running Sneakers",
    description:
      "Comfortable sneakers for walking, light workouts, and casual daily outfits.",
    price: 73,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    category: "Sports",
    stock: 21,
  },
  {
    _id: "665f10000000000000000008",
    name: "Kitchen Prep Essentials Set",
    description:
      "A useful prep set for everyday cooking, organizing counters, and making small kitchen tasks faster.",
    price: 35,
    image:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80",
    category: "Home & Kitchen",
    stock: 13,
  },
];

export function getFallbackProducts(category = "All") {
  if (!category || category === "All") {
    return fallbackProducts;
  }

  return fallbackProducts.filter((product) => product.category === category);
}

export function findFallbackProduct(id: string) {
  return fallbackProducts.find((product) => product._id === id) || null;
}

export function searchFallbackProducts(query = "", category = "All") {
  const trimmedQuery = query.trim().toLowerCase();
  const products = getFallbackProducts(category);

  if (!trimmedQuery) {
    return products;
  }

  return products.filter((product) =>
    [product.name, product.description, product.category]
      .join(" ")
      .toLowerCase()
      .includes(trimmedQuery)
  );
}
