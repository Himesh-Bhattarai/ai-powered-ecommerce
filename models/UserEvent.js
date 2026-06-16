import mongoose from "mongoose";

const userEventSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["guest", "user"],
            required: true,
            index: true,
        },
        sessionId: {
            type: String,
            default: null,
            index: true,
        },
        userId: {
            type: String,
            default: null,
            index: true,
        },
        eventType: {
            type: String,
            required: true,
            enum: [
                "search",
                "product_click",
                "product_view",
                "add_to_cart",
                "purchase",
                "ai_chat_request",
            ],
            index: true,
        },
        score: {
            type: Number,
            default: 0,
        },
        query: {
            type: String,
            trim: true,
        },
        productId: {
            type: String,
            index: true,
        },
        productName: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            trim: true,
            index: true,
        },
        quantity: {
            type: Number,
            min: 1,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
        },
        userAgent: String,
        ipAddress: String,
    },
    { timestamps: true }
);

userEventSchema.index({ sessionId: 1, createdAt: -1 });
userEventSchema.index({ userId: 1, createdAt: -1 });

const UserEvent =
    mongoose.models.UserEvent || mongoose.model("UserEvent", userEventSchema);

export default UserEvent;
