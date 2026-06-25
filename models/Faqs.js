import mongoose from "mongoose";

const singleFaqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

export const aiFaqSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
      index: true,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerInfo",
      required: true,
      index: true,
    },

    source: {
      type: String,
      required: true,
      trim: true,
      enum: ["ai", "seller"],
      default: "ai",
    },

    faqs: {
      type: [singleFaqSchema],
      required: true,
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: "At least one FAQ is required",
      },
    },
  },
  { timestamps: true }
);

export const AiFaq =
  mongoose.models.AiFaq || mongoose.model("AiFaq", aiFaqSchema);

export default AiFaq;