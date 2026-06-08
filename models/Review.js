import mongoose from "mongoose";

export const reviewSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 6,

    },
    comment: {
        type: String,
    },
    image: {
        type: String
    },
});


const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;