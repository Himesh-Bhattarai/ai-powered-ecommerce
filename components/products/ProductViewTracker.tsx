"use client";

import { useEffect, useRef } from "react";
import { trackUserEvent } from "@/lib/personalization/client";
import type { Product } from "@/types/product";

type ProductViewTrackerProps = {
  product: Product;
};

export default function ProductViewTracker({ product }: ProductViewTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) {
      return;
    }

    trackedRef.current = true;
    void trackUserEvent({
      eventType: "product_view",
      productId: product._id,
      productName: product.name,
      category: product.category,
    });
  }, [product._id, product.name, product.category]);

  return null;
}
