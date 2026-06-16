
import {
    getAuthenticatedUserId,
    hasEnoughSignal,
    normalizeEventType,
    serializePreference,
    storeUserEvent,
} from "@/lib/personalization/server";

export async function POST(request) {
    try {
        const body = await request.json();
        const userId = await getAuthenticatedUserId();
        const { event, preference } = await storeUserEvent({
            ...body,
            userId,
            request,
        });
        const eventType = normalizeEventType(body.eventType);
        const shouldRecommend =
            hasEnoughSignal(preference) ||
            eventType === "add_to_cart" ||
            eventType === "purchase" ||
            eventType === "ai_chat_request";

        return Response.json({
            saved: true,
            eventId: event._id.toString(),
            eventType: event.eventType,
            score: event.score,
            shouldRecommend,
            preference: serializePreference(preference),
        });
    } catch (error) {
        console.error("User event route error:", error);

        return Response.json(
            {
                message:
                    error.status === 400
                        ? error.message
                        : "An error occurred while processing the request.",
            },
            {
                status: error.status || 500,
            }
        );
    }
}
