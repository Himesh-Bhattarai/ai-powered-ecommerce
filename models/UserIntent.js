import mongoose from "mongoose";

const userIntentSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        signals: [
            {
                type: String,
                value: String,
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        persona: String,
        keywords: [String],
        category: String,
        bundles: [
            {
                title: String,
                query: String,
                category: String,
            },
        ],
    },
    { timestamps: true }
);

const UserIntent =
    mongoose.models.UserIntent || mongoose.model("UserIntent", userIntentSchema);

export default UserIntent;
