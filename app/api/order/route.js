import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/database/db";
import { verifyToken } from "@/lib/jwt/token";
import User from "@/models/User";
import Product from "@/models/Product";
import Order from "@/models/Order";

const VALID_PAYMENT_METHODS = new Set([
  "cash",
  "card",
  "esewa",
  "khalti",
  "bank_transfer",
  "other",
]);

async function getBuyer() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return { error: "Authentication required", status: 401 };
  }

  const tokenResult = verifyToken(accessToken);
  const userId = tokenResult.decoded?.id || tokenResult.decoded?._id;

  if (!tokenResult.valid || !userId) {
    return { error: "Authentication required", status: 401 };
  }

  const user = await User.findById(userId).select(
    "_id fullName email phoneNumber address"
  );

  if (!user) {
    return { error: "User account not found", status: 401 };
  }

  return { user };
}

function normalizeItems(body) {
  const rawItems = Array.isArray(body.items)
    ? body.items
    : body.productId
      ? [{ productId: body.productId, quantity: body.quantity }]
      : [];

  return rawItems.map((item) => ({
    productId: String(item.productId || ""),
    quantity: Number(item.quantity),
  }));
}

function validateItems(items) {
  if (items.length === 0) {
    return "At least one order item is required";
  }

  const invalidItem = items.find(
    (item) =>
      !mongoose.Types.ObjectId.isValid(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
  );

  return invalidItem ? "Valid productId and quantity are required" : null;
}

function buildUserDetails(user, details = {}) {
  return {
    fullName: String(details.fullName || user.fullName || "").trim(),
    phoneNumber: String(details.phoneNumber || details.phone || user.phoneNumber || "").trim(),
    email: String(details.email || user.email || "").trim(),
    address: String(details.address || user.address || "").trim(),
  };
}

function buildVendorDetails(product) {
  const seller = product.seller;
  const shop = seller?.shop || {};

  return {
    companyName: shop.legalShopName || shop.shopName || seller?.fullName || "Bazar Marketplace",
    phoneNumber: seller?.phoneNumber || "N/A",
    email: seller?.email || "support@bazar.local",
    address: shop.shopAddress || "N/A",
    licenseNumber: "N/A",
    taxNumber: "",
  };
}

function serializeOrder(order) {
  return {
    id: order._id.toString(),
    orderId: order.orderId,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    products: order.products,
    subtotalAmount: order.subtotalAmount,
    discountAmount: order.discountAmount,
    taxAmount: order.taxAmount,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    trackingNumber: order.trackingNumber,
    expectedDelivery: order.expectedDelivery,
    userDetails: order.userDetails,
    vendorDetails: order.vendorDetails,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function rollbackStock(items) {
  await Promise.all(
    items.map((item) =>
      Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } }
      )
    )
  );
}

export async function POST(request) {
  const decrementedItems = [];

  try {
    await connectDB();

    const buyerResult = await getBuyer();

    if (buyerResult.error) {
      return NextResponse.json(
        { message: buyerResult.error },
        { status: buyerResult.status }
      );
    }

    const body = await request.json().catch(() => ({}));
    const items = normalizeItems(body);
    const itemError = validateItems(items);

    if (itemError) {
      return NextResponse.json({ message: itemError }, { status: 400 });
    }

    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate("seller")
      .lean();
    const productMap = new Map(
      products.map((product) => [product._id.toString(), product])
    );

    const missingItem = items.find((item) => !productMap.has(item.productId));

    if (missingItem) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    for (const item of items) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { new: true }
      ).select("_id stock");

      if (!updatedProduct) {
        await rollbackStock(decrementedItems);
        return NextResponse.json(
          { message: "Product not found or insufficient stock" },
          { status: 400 }
        );
      }

      decrementedItems.push(item);
    }

    const orderProducts = items.map((item) => {
      const product = productMap.get(item.productId);
      const price = Number(product.price);
      const subtotal = price * item.quantity;

      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price,
        subtotal,
        taxRate: 0,
      };
    });

    const subtotalAmount = orderProducts.reduce(
      (total, item) => total + item.subtotal,
      0
    );
    const discountAmount = 0;
    const taxAmount = 0;
    const totalAmount = subtotalAmount - discountAmount + taxAmount;
    const paymentMethod = VALID_PAYMENT_METHODS.has(body.paymentMethod)
      ? body.paymentMethod
      : "cash";
    const firstProduct = productMap.get(items[0].productId);
    const userDetails = buildUserDetails(buyerResult.user, body.userDetails);

    if (
      !userDetails.fullName ||
      !userDetails.phoneNumber ||
      !userDetails.email ||
      !userDetails.address
    ) {
      await rollbackStock(decrementedItems);
      return NextResponse.json(
        { message: "Complete user details are required" },
        { status: 400 }
      );
    }

    const order = await Order.create({
      orderId: `BZ-${Date.now()}`,
      buyerId: buyerResult.user._id.toString(),
      sellerId: firstProduct.seller?._id?.toString?.() || "",
      products: orderProducts,
      subtotalAmount,
      discountAmount,
      taxAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "unpaid" : "unpaid",
      status: "pending",
      userDetails,
      vendorDetails: buildVendorDetails(firstProduct),
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
    });

    return NextResponse.json(
      {
        message: "Order placed successfully",
        order: serializeOrder(order),
      },
      { status: 201 }
    );
  } catch (error) {
    if (decrementedItems.length > 0) {
      await rollbackStock(decrementedItems).catch((rollbackError) => {
        console.error("Order stock rollback failed:", rollbackError);
      });
    }

    console.error("Create order error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const buyerResult = await getBuyer();

    if (buyerResult.error) {
      return NextResponse.json(
        { message: buyerResult.error },
        { status: buyerResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
    const status = searchParams.get("status");
    const query = { buyerId: buyerResult.user._id.toString() };

    if (status) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      message: "Order history",
      orders: orders.map(serializeOrder),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
