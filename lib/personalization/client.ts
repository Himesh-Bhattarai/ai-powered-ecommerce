import type { Product } from "@/types/product";

const SESSION_STORAGE_KEY = "bazar-session-id";

export type UserEventType =
  | "search"
  | "product_click"
  | "product_view"
  | "add_to_cart"
  | "purchase"
  | "ai_chat_request";

export type TrackUserEventInput = {
  eventType: UserEventType;
  query?: string;
  productId?: string;
  productName?: string;
  category?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
};

export type RecommendationBundle = {
  title: string;
  query: string;
  category?: string;
  reason?: string;
  productIds?: string[];
};

export type RecommendationResponse = {
  personalized: boolean;
  signalReady: boolean;
  aiUsed: boolean;
  bundles: RecommendationBundle[];
  products: Product[];
};

function createGuestSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `guest-${crypto.randomUUID()}`;
  }

  return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getGuestSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existingSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (existingSessionId) {
    return existingSessionId;
  }

  const nextSessionId = createGuestSessionId();
  window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);

  return nextSessionId;
}

export async function trackUserEvent(event: TrackUserEventInput) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const response = await fetch("/api/user-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        ...event,
        sessionId: getGuestSessionId(),
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data?.shouldRecommend) {
      window.dispatchEvent(
        new CustomEvent("bazar:personalization-ready", {
          detail: data,
        })
      );
    }

    return data;
  } catch {
    return null;
  }
}

export async function fetchPersonalizedRecommendations({
  forceAi = false,
  trigger = "catalog",
}: {
  forceAi?: boolean;
  trigger?: string;
} = {}): Promise<RecommendationResponse | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const response = await fetch("/api/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: getGuestSessionId(),
        forceAi,
        trigger,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}
