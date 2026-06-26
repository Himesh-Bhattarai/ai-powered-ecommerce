import mongoose from "mongoose";
import { cookies } from "next/headers";
import connectDB from "@/lib/database/db";
import { verifyToken } from "@/lib/jwt/token";
import {
    apiResponse,
    okResponse,
    serverErrorResponse,
    unauthorizedResponse,
} from "@/helper/response/apiResponse";
import { logger } from "@/helper/logger/logger";
import Product from "@/models/Product";
import User from "@/models/User";
import WatchList from "@/models/Wishlist";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken")?.value;

        if (!accessToken) {
            return unauthorizedResponse("Authentication required");
        }

        const tokenResult = verifyToken(accessToken);
        const userId = tokenResult.decoded?.id || tokenResult.decoded?._id;

        if (!tokenResult.valid || !userId) {
            return unauthorizedResponse("Authentication required");
        }

        await connectDB();

        const user = await User.findById(userId).select("_id").lean();

        if (!user) {
            return unauthorizedResponse("Invalid user");
        }

        const watchList = await WatchList.findOne({ userId }).lean();

        return okResponse(
            {
                watchList: {
                    items: watchList?.items || [],
                },
            },
            "WatchList fetched successfully"
        );
    } catch (error) {
        logger.error("Unable to load watchList.", {
            route: "GET /api/watchList",
            error: error.message,
        });

        return serverErrorResponse("Unable to load watchList");
    }
}
//Post
export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { items } = body;

        if (!Array.isArray(items)) {
            return apiResponse.badRequest("items must be an array");
        }

        if (items.length === 0) {
            return apiResponse.badRequest("items cannot be empty");
        }

        const productIds = [
            ...new Set(
                items.map((item) =>
                    typeof item === "string" ? item : item?.productId
                )
            ),
        ];
        const hasInvalidProductId = productIds.some(
            (productId) => !mongoose.Types.ObjectId.isValid(productId)
        );

        if (hasInvalidProductId) {
            return apiResponse.badRequest("Invalid product id");
        }

        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken")?.value;

        if (!accessToken) {
            return apiResponse.unauthorized("Authentication required");
        }

        const tokenResult = verifyToken(accessToken);
        const userId = tokenResult.decoded?.id || tokenResult.decoded?._id;

        if (!tokenResult.valid || !userId) {
            return apiResponse.unauthorized("Authentication required");
        }

        await connectDB();

        const user = await User.findById(userId).select("_id").lean();

        if (!user) {
            return apiResponse.unauthorized("Invalid user");
        }

        const products = await Product.find({
            _id: { $in: productIds },
        }).select("_id").lean();

        if (products.length !== productIds.length) {
            return apiResponse.badRequest("One or more products do not exist");
        }

        const existingWatchList = await WatchList.findOne({ userId }).lean();
        const itemMap = new Map(
            (existingWatchList?.items || []).map((item) => [
                item.productId,
                item.addedAt,
            ])
        );

        for (const productId of productIds) {
            if (!itemMap.has(productId)) {
                itemMap.set(productId, new Date());
            }
        }

        const watchList = await WatchList.findOneAndUpdate(
            { userId },
            {
                $set: {
                    items: Array.from(itemMap, ([productId, addedAt]) => ({
                        productId,
                        addedAt,
                    })),
                },
            },
            { upsert: true, new: true, runValidators: true }
        ).lean();

        return apiResponse.created(
            {
                watchList: {
                    items: watchList.items,
                },
            },
            "WatchList saved successfully"
        );
    } catch (error) {
        logger.error("Unable to create watchList.", {
            route: "POST /api/watchList",
            error: error.message,
        });

        return apiResponse.serverError("Unable to create watchList");
    }
}

//Update

//Delete
