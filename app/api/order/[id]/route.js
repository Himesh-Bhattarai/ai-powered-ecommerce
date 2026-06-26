import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/database/db";
import { verifyToken } from "@/lib/jwt/token";
import Order from "@/models/Order";
import Product from "@/models/Product";

const SELLER_STATUSES = new Set([
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

async function getAccountId() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  const tokenResult = verifyToken(accessToken);
  return tokenResult.valid
    ? tokenResult.decoded?.id || tokenResult.decoded?._id || null
    : null;
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

function canRead(order, accountId) {
  return order.buyerId === accountId || order.sellerId === accountId;
}

async function restoreStock(order) {
  await Promise.all(
    order.products.map((item) =>
      Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } }
      )
    )
  );
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid order id" }, { status: 400 });
    }

    const accountId = await getAccountId();

    if (!accountId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    const order = await Order.findById(id);

    if (!order || !canRead(order, accountId)) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) {
    console.error("Get order detail error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid order id" }, { status: 400 });
    }

    const accountId = await getAccountId();

    if (!accountId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const nextStatus = body.status;

    if (nextStatus && !SELLER_STATUSES.has(nextStatus)) {
      return NextResponse.json({ message: "Invalid order status" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(id);

    if (!order || order.sellerId !== accountId) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (nextStatus) {
      order.status = nextStatus;
    }

    if (typeof body.trackingNumber === "string") {
      order.trackingNumber = body.trackingNumber.trim();
    }

    if (body.expectedDelivery) {
      order.expectedDelivery = new Date(body.expectedDelivery);
    }

    await order.save();

    return NextResponse.json({
      message: "Order updated successfully",
      order: serializeOrder(order),
    });
  } catch (error) {
    console.error("Update order detail error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(_request, { params }) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid order id" }, { status: 400 });
    }

    const accountId = await getAccountId();

    if (!accountId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    const order = await Order.findById(id);

    if (!order || order.buyerId !== accountId) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.status === "cancelled") {
      return NextResponse.json({
        message: "Order already cancelled",
        order: serializeOrder(order),
      });
    }

    if (!["pending", "processing"].includes(order.status)) {
      return NextResponse.json(
        { message: "This order can no longer be cancelled" },
        { status: 400 }
      );
    }

    await restoreStock(order);
    order.status = "cancelled";
    await order.save();

    return NextResponse.json({
      message: "Order cancelled successfully",
      order: serializeOrder(order),
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
