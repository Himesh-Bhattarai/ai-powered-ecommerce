import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
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
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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
    },

    govNumber: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },

    personalAddress: {
      type: String,
      required: true,
      trim: true,
    },

    shop: {
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

    legalInfo: {
      panOrVatNumber: {
        type: String,
        required: true,
        trim: true,
        unique: true,
      },

      registrationNumber: {
        type: String,
        required: true,
        trim: true,
        unique: true,
      },

      registrationType: {
        type: String,
        enum: ["pan", "vat", "company", "other"],
        required: true,
      },
    },

    bankDetails: {
      bankName: {
        type: String,
        required: true,
        trim: true,
      },

      accountHolderName: {
        type: String,
        required: true,
        trim: true,
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
  { timestamps: true }
);

export default mongoose.models.Seller || mongoose.model("Seller", sellerSchema);