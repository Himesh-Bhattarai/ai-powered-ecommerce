import mongoose from "mongoose";

export const ProductSchema = new mongoose.Schema({
    name: {
       type: String,
       required: true
    },
    description: {
        type: String,
        required: true,

    },
    price: {
        type: Number,
        required: true,
    },
    image:{
        type: String,
    },
    category: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        default: 0,
    },
    aiReviewSummary: {
        headline: String,
        overview: String,
        pros: [String],
        cons: [String],
        sentiment: String,
        aiRating: Number,
        averageRating: Number,
        reviewCount: Number,
        breakdown: [
            {
                stars: Number,
                count: Number,
                percent: Number,
            },
        ],
        generatedAt: Date,
    },
})

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default Product;
