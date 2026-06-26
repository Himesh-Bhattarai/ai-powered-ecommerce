import mongoose from "mongoose"

export const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    buyerId: {
        type: String,
        required: true,
        index: true,
    },
    sellerId: {
        type: String,
        index: true,
    },

    products: [
        {
            productId: { type: String, required: true },
            productName: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 0 },
            subtotal: { type: Number, required: true, min: 0 },
            taxRate: { type: Number, default: 0 },
        }
    ],

    subtotalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    paymentMethod: {
        type: String,
        enum: ["cash", "card", "esewa", "khalti", "bank_transfer", "other"],
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "partial", "refunded"],
        default: "unpaid",
    },

    status: {
        type: String,
        required: true,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending",
    },
    trackingNumber: { type: String },
    expectedDelivery: { type: Date },
    notes: { type: String },

    userDetails: {
        fullName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
    },
    vendorDetails: {
        companyName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
        licenseNumber: { type: String, required: true },
        taxNumber: { type: String },
    },

}, {
    timestamps: true,
})

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
