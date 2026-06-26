import mongoose from "mongoose";
import connectDB from "@/lib/database/db";
import Product from "@/models/Product";
import {
    badRequestResponse,
    notFoundResponse,
    okResponse,
    serverErrorResponse,
} from "@/helper/response/apiResponse";
import { logger } from "@/helper/logger/logger";

function serializeProduct(product) {
    return {
        ...product,
        _id: product._id.toString(),
        seller: product.seller?.toString?.() || product.seller,
    };
}

export async function GET(_request, { params }) {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return badRequestResponse("Invalid product id");
    }

    try {
        await connectDB();
        const product = await Product.findById(id).lean();

        if (!product) {
            return notFoundResponse("Product not found");
        }

        return okResponse(
            serializeProduct(product),
            "Product fetched successfully"
        );
    } catch (error) {
        logger.error("Unable to load product from MongoDB.", {
            route: "GET /api/products/[id]",
            productId: id,
            error: error.message,
        });

        return serverErrorResponse("Unable to load product");
    }
}
