import mongoose from "mongoose";
import { cookies } from "next/headers";
import connectDB from "@/lib/database/db";
import Product from "@/models/Product";
import SellerInfo from "@/models/SellerInfo";
import { verifyToken } from "@/lib/jwt/token";
import { NextResponse } from "next/server";

function serializeProduct(product) {
  return {
    id: product._id.toString(),
    _id: product._id.toString(),
    seller: product.seller?.toString?.() || product.seller,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    category: product.category,
    stock: product.stock,
  };
}

function buildProductUpdate(body) {
  const update = {};

  if (typeof body.name === "string") {
    update.name = body.name.trim();
  }

  if (typeof body.description === "string") {
    update.description = body.description.trim();
  }

  if (typeof body.category === "string") {
    update.category = body.category.trim();
  }

  if (typeof body.image === "string") {
    update.image = body.image.trim();
  }

  if (body.price !== undefined) {
    const price = Number(body.price);

    if (!Number.isFinite(price) || price <= 0) {
      return { error: "Price must be greater than 0" };
    }

    update.price = price;
  }

  if (body.stock !== undefined) {
    const stock = Number(body.stock);

    if (!Number.isInteger(stock) || stock < 0) {
      return { error: "Stock must be a whole number greater than or equal to 0" };
    }

    update.stock = stock;
  }

  Object.keys(update).forEach((key) => {
    if (typeof update[key] === "string" && update[key].length === 0) {
      delete update[key];
    }
  });

  return { update };
}

// GET all products
export async function GET() {
  try {
    await connectDB();
    const products = await Product.find().lean();

    return Response.json(
      products.map((product) => ({
        ...product,
        _id: product._id.toString(),
      }))
    );
  } catch (error) {
    console.error("Unable to load MongoDB products.", error);
    return Response.json(
      { message: "Unable to load products" },
      { status: 500 }
    );
  }
}

// POST new product

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { valid, decoded } = verifyToken(accessToken);

    if (!valid || !decoded?.id) {
      return Response.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json(
        { message: "Invalid product payload" },
        { status: 400 }
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const price = Number(body.price);
    const stock =
      body.stock === undefined || body.stock === "" ? 0 : Number(body.stock);

    if (!name || !category || !description) {
      return Response.json(
        { message: "Name, category, and description are required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return Response.json(
        { message: "Price must be greater than 0" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return Response.json(
        { message: "Stock must be a whole number greater than or equal to 0" },
        { status: 400 }
      );
    }

    const seller = await SellerInfo.findById(decoded.id).select(
      "fullName email phoneNumber sellerType status verificationStatus shop"
    );

    if (!seller) {
      return Response.json(
        { message: "Seller not found" },
        { status: 401 }
      );
    }

    const product = await Product.create({
      seller: seller._id,
      name,
      category,
      price,
      stock,
      description,
      image,
    });

    const createdProduct = product.toObject();

    return Response.json(
      {
        message: "Product successfully created",
        product: {
          ...createdProduct,
          _id: createdProduct._id.toString(),
          seller: createdProduct.seller?.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Product route error:", error);
    return Response.json(
      { message: "Unable to create product" },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { valid, decoded } = verifyToken(accessToken);

    if (!valid || !decoded?.id) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    const seller = await SellerInfo.findById(decoded.id).select("_id");

    if (!seller) {
      return NextResponse.json(
        { message: "Seller account not found" },
        { status: 403 }
      );
    }

    const deletedProduct = await Product.findOneAndDelete({
      _id: productId,
      seller: seller._id,
    }).select("_id name description price image category stock seller");

    if (!deletedProduct) {
      return NextResponse.json(
        { message: "Product not found or you do not have permission to delete it" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Product deleted successfully",
        product: serializeProduct(deletedProduct),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete product route error:", error);

    return NextResponse.json(
      { message: "Unable to delete product" },
      { status: 500 }
    );
  }
}

//update product function
export async function PATCH(request){
  try{
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const body = await request.json().catch(() => ({}));

    if (!productId) {
      return NextResponse.json({message: "Product ID is required"}, {status: 400});
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({message: "Invalid product ID"}, {status: 400});
    }

    const { update, error } = buildProductUpdate(body);

    if (error) {
      return NextResponse.json({message: error}, {status: 400});
    }

    if (!update || Object.keys(update).length === 0) {
      return NextResponse.json({message: "No valid product fields to update"}, {status: 400});
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if(!accessToken){
      return NextResponse.json({message: "Authentication required"}, {status: 401});
    };

    const {valid, decoded} = verifyToken(accessToken);
    if(!valid || !decoded?.id){
      return NextResponse.json({message: "Authentication required"}, {status: 401});
    };

    await connectDB();

    const seller = await SellerInfo.findById(decoded.id).select("_id");

    if(!seller){
      return NextResponse.json({message: "Seller account not found"}, {status: 403});
    };

    const product = await Product.findById(productId).select("_id seller");

    if(!product){
      return NextResponse.json({message: "Product not found or you do not have permission to update it"}, {status: 404});
    };

    if(product.seller.toString() !== seller._id.toString()){
      return NextResponse.json({message: "You do not have permission to update this product"}, {status: 403});
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: update },
      { new: true, runValidators: true }
    ).select("_id name description price image category stock seller");

    if(!updatedProduct){
      return NextResponse.json({message: "Product not found or you do not have permission to update it"}, {status: 404});
    };

    return NextResponse.json({
      message: "Product updated successfully",
      product: serializeProduct(updatedProduct),
    }, {status: 200});
  }catch(error){
    console.error("Update product route error:", error);
    return NextResponse.json({message: "Unable to update product"}, {status: 500});
  }
}
