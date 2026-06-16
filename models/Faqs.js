import mongoose from "mongoose";


export const aiFaqSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    unique: true,
  },
  faqs: [
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
      _id: false,
    },
  ],
});

export const AiFaq =
  mongoose.models.AiFaq || mongoose.model("AiFaq", aiFaqSchema);

export default AiFaq;