import {
    getAuthenticatedUserId,
    getPersonalizedRecommendations,
    storeUserEvent,
} from "@/lib/personalization/server";

function normalizeSignals({ signal, signals }) {
    const incomingSignals = Array.isArray(signals) ? signals : signal ? [signal] : [];

    return incomingSignals
        .map((item) => ({
            eventType: item.type || item.eventType || "search",
            query: item.value || item.query || "",
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            metadata: {
                source: "ai-intent",
            },
        }))
        .filter(
            (item) =>
                item.query ||
                item.productId ||
                item.productName ||
                item.category
        );
}

export async function POST(request) {
    try {
        const body = await request.json();
        const userId = await getAuthenticatedUserId();
        const sessionId = body.sessionId;
        const currentSignals = normalizeSignals(body);

        if (!userId && !sessionId) {
            return Response.json(
                { message: "sessionId is required for guest personalization" },
                { status: 400 }
            );
        }

        for (const signal of currentSignals) {
            await storeUserEvent({
                ...signal,
                sessionId,
                userId,
                request,
            });
        }

        const recommendations = await getPersonalizedRecommendations({
            sessionId,
            userId,
            forceAi: true,
            trigger: "ai-intent",
        });

        return Response.json({
            saved: Boolean(userId || sessionId),
            userId: userId || null,
            sessionId: sessionId || null,
            signalCount:
                recommendations.preference?.eventCount || currentSignals.length,
            persona:
                recommendations.preference?.interestedCategories?.[0]?.name ||
                "personalized shopper",
            keywords:
                recommendations.preference?.interestedCategories
                    ?.map((interest) => interest.name)
                    .slice(0, 6) || [],
            category:
                recommendations.preference?.interestedCategories?.[0]?.name || null,
            bundles: recommendations.bundles,
            products: recommendations.products,
            aiUsed: recommendations.aiUsed,
        });
    } catch (error) {
        console.error("Error in AI Intent API:", error);

        return Response.json(
            { message: "An error occurred while processing the request." },
            { status: 500 }
        );
    }
}
