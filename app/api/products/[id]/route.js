import mongoose from "mongoose";
import connectDB from "@/lib/database/db";
import { findFallbackProduct } from "@/lib/catalog/fallbackProducts";
import { resolveWithTimeout } from "@/lib/utils/resolveWithTimeout";
import Product from "@/models/Product";

export async function GET(_request, { params }) {
    const { id } = await params;
    const fallbackProduct = findFallbackProduct(id);

    if (fallbackProduct) {
        return Response.json(fallbackProduct);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return Response.json({ message: "Invalid product id" }, { status: 400 });
    }

    try {
        const product = await resolveWithTimeout(
            (async () => {
                await connectDB();
                return Product.findById(id).lean();
            })()
        );

        if (!product) {
            return Response.json({ message: "Product not found" }, { status: 404 });
        }

        return Response.json({
            ...product,
            _id: product._id.toString(),
        });
    } catch (error) {
        console.error("Unable to load product from MongoDB.", error);
        return Response.json({ message: "Product not found" }, { status: 404 });
    }
}
