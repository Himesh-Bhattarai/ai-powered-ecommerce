import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/database/db";
import { verifyToken } from "@/lib/jwt/token";
import Cart from "@/models/Cart";
import Product from "@/models/Product";

async function getUserId() {
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

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const itemMap = new Map();

  for (const item of items) {
    const productId = String(item.productId || "");
    const quantity = Number(item.quantity);

    if (!mongoose.Types.ObjectId.isValid(productId) || !Number.isInteger(quantity) || quantity <= 0) {
      return null;
    }

    itemMap.set(productId, (itemMap.get(productId) || 0) + quantity);
  }

  return Array.from(itemMap, ([productId, quantity]) => ({ productId, quantity }));
}

async function validateStock(items) {
  const products = await Product.find({
    _id: { $in: items.map((item) => item.productId) },
  }).select("_id stock");
  const productMap = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  return items.every((item) => {
    const product = productMap.get(item.productId);
    return product && Number(product.stock || 0) >= item.quantity;
  });
}

async function serializeCart(cart) {
  const items = cart?.items || [];
  const products = await Product.find({
    _id: { $in: items.map((item) => item.productId) },
  }).lean();
  const productMap = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  return {
    items: items.map((item) => {
      const product = productMap.get(item.productId);

      return {
        productId: item.productId,
        quantity: item.quantity,
        product: product
          ? {
              ...product,
              _id: product._id.toString(),
              seller: product.seller?.toString?.() || product.seller,
            }
          : null,
      };
    }),
  };
}

export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    const cart = await Cart.findOne({ userId });

    return NextResponse.json({
      cart: await serializeCart(cart),
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const items = normalizeItems(body.items);

    if (!items) {
      return NextResponse.json(
        { message: "Valid cart items are required" },
        { status: 400 }
      );
    }

    await connectDB();

    if (items.length > 0 && !(await validateStock(items))) {
      return NextResponse.json(
        { message: "Product not found or insufficient stock" },
        { status: 400 }
      );
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $set: { items } },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      message: "Cart updated successfully",
      cart: await serializeCart(cart),
    });
  } catch (error) {
    console.error("Replace cart error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const productId = String(body.productId || "");
    const quantity = Number(body.quantity);

    if (
      !mongoose.Types.ObjectId.isValid(productId) ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return NextResponse.json(
        { message: "Valid productId and quantity are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const cart = await Cart.findOne({ userId }) || new Cart({ userId, items: [] });
    const nextItems = cart.items
      .filter((item) => item.productId !== productId)
      .map((item) => ({ productId: item.productId, quantity: item.quantity }));

    if (quantity > 0) {
      nextItems.push({ productId, quantity });
    }

    if (nextItems.length > 0 && !(await validateStock(nextItems))) {
      return NextResponse.json(
        { message: "Product not found or insufficient stock" },
        { status: 400 }
      );
    }

    cart.items = nextItems;
    await cart.save();

    return NextResponse.json({
      message: "Cart updated successfully",
      cart: await serializeCart(cart),
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    await connectDB();

    const cart = await Cart.findOne({ userId }) || new Cart({ userId, items: [] });

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return NextResponse.json(
          { message: "Invalid product ID" },
          { status: 400 }
        );
      }

      cart.items = cart.items.filter((item) => item.productId !== productId);
    } else {
      cart.items = [];
    }

    await cart.save();

    return NextResponse.json({
      message: "Cart updated successfully",
      cart: await serializeCart(cart),
    });
  } catch (error) {
    console.error("Delete cart item error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
