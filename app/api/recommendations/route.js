import {
    getAuthenticatedUserId,
    getPersonalizedRecommendations,
} from "@/lib/personalization/server";

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const userId = await getAuthenticatedUserId();

        if (!userId && !body.sessionId) {
            return Response.json(
                {
                    message: "sessionId is required for guest recommendations",
                },
                { status: 400 }
            );
        }

        const recommendations = await getPersonalizedRecommendations({
            sessionId: body.sessionId,
            userId,
            forceAi: Boolean(body.forceAi),
            trigger: body.trigger || "manual",
        });

        return Response.json(recommendations);
    } catch (error) {
        console.error("Recommendation route error:", error);

        return Response.json(
            { message: "Unable to load recommendations" },
            { status: 500 }
        );
    }
}
