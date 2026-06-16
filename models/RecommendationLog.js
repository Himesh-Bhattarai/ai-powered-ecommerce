import mongoose from "mongoose";

const recommendationLogSchema = new mongoose.Schema(
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
        trigger: {
            type: String,
            default: "manual",
        },
        aiUsed: {
            type: Boolean,
            default: false,
        },
        model: String,
        preferenceSnapshot: {
            type: mongoose.Schema.Types.Mixed,
        },
        bundles: {
            type: mongoose.Schema.Types.Mixed,
        },
        productIds: [String],
    },
    { timestamps: true }
);

recommendationLogSchema.index({ sessionId: 1, createdAt: -1 });
recommendationLogSchema.index({ userId: 1, createdAt: -1 });

const RecommendationLog =
    mongoose.models.RecommendationLog ||
    mongoose.model("RecommendationLog", recommendationLogSchema);

export default RecommendationLog;
