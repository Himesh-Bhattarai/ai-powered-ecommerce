import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    legalShopName: {
      type: String,
      required: true,
      trim: true,
    },
    shopAddress: {
      type: String,
      required: true,
      trim: true,
    },
    warehouseAddress: {
      type: String,
      required: true,
      trim: true,
    },
    returnAddress: {
      type: String,
      required: true,
      trim: true,
    },
    mainProductCategory: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const legalInfoSchema = new mongoose.Schema(
  {
    panOrVatNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      select: false,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      select: false,
    },
    registrationType: {
      type: String,
      enum: ["pan", "vat", "company", "other"],
      default: "other",
      required: true,
    },
  },
  { _id: false }
);

const bankDetailsSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    bankAccountNumber: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    bankBranch: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const sellerInfoSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: /^\d{10}$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    sellerType: {
      type: String,
      enum: ["individual", "company"],
      default: "individual",
      required: true,
      set: (value) => {
        if (value === "business") {
          return "company";
        }

        return value;
      },
    },
    govNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      select: false,
    },
    personalAddress: {
      type: String,
      required: true,
      trim: true,
    },
    shop: {
      type: shopSchema,
      required: true,
    },
    legalInfo: {
      type: legalInfoSchema,
      required: true,
    },
    bankDetails: {
      type: bankDetailsSchema,
      required: true,
    },
    liveInventory: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    verificationStatus: {
      type: String,
      enum: ["not_submitted", "submitted", "under_review", "verified", "failed"],
      default: "not_submitted",
    },
  },
  {
    timestamps: true,
    collection: "sellers",
  }
);

export default mongoose.models.SellerInfo ||
  mongoose.model("SellerInfo", sellerInfoSchema);
