import mongoose from "mongoose";
import connectDB from "@/lib/database/db";
import Product from "@/models/Product";

export async function GET(_request, { params }) {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return Response.json({ message: "Invalid product id" }, { status: 400 });
    }

    try {
        await connectDB();
        const product = await Product.findById(id).lean();

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
