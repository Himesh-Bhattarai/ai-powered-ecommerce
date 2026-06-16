import mongoose from "mongoose";

const interestSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        score: {
            type: Number,
            default: 0,
        },
        lastEventAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const productInterestSchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            trim: true,
        },
        score: {
            type: Number,
            default: 0,
        },
        lastEventAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const recentQuerySchema = new mongoose.Schema(
    {
        query: {
            type: String,
            required: true,
            trim: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const userPreferenceSchema = new mongoose.Schema(
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
        interestedCategories: {
            type: [interestSchema],
            default: [],
        },
        interestedProducts: {
            type: [productInterestSchema],
            default: [],
        },
        recentQueries: {
            type: [recentQuerySchema],
            default: [],
        },
        signalCounts: {
            search: {
                type: Number,
                default: 0,
            },
            productClick: {
                type: Number,
                default: 0,
            },
            productView: {
                type: Number,
                default: 0,
            },
            addToCart: {
                type: Number,
                default: 0,
            },
            purchase: {
                type: Number,
                default: 0,
            },
            aiChatRequest: {
                type: Number,
                default: 0,
            },
        },
        eventCount: {
            type: Number,
            default: 0,
        },
        totalScore: {
            type: Number,
            default: 0,
        },
        lastEventAt: Date,
    },
    { timestamps: true }
);

userPreferenceSchema.index(
    { type: 1, sessionId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            type: "guest",
            sessionId: { $type: "string" },
        },
    }
);

userPreferenceSchema.index(
    { type: 1, userId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            type: "user",
            userId: { $type: "string" },
        },
    }
);

const UserPreference =
    mongoose.models.UserPreference ||
    mongoose.model("UserPreference", userPreferenceSchema);

export default UserPreference;
