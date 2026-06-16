import mongoose from "mongoose";
import connectDB from "@/lib/database/db";
import AiFaq from "@/models/Faqs";
import Product from "@/models/Product";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return Response.json({
                message: "Product ID is required"
            }, { status: 400 });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return Response.json({
                message: "Invalid product ID"
            }, { status: 400 });
        }

        await connectDB();

        const existingFaqs = await AiFaq.findOne({ productId }).lean();

        if (existingFaqs) {
            return Response.json({
                message: "FAQs fetched successfully",
                faqs: existingFaqs.faqs,
                data: {
                    ...existingFaqs,
                    _id: existingFaqs._id.toString(),
                    productId: existingFaqs.productId.toString(),
                }
            }, { status: 200 });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return Response.json({
                message: "Product not found"
            }, { status: 404 });
        }
      
        const aiFaqUrl = new URL("/api/ai-faq", request.url);
        const res = await fetch(aiFaqUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ productId })
        });

        console.log("Response", res);
      
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));

            return Response.json({
                message: errorData.message || "Failed to generate FAQs",
                status: errorData.status || res.status,
            }, { status: res.status });
        }

        const data = await res.json();
        console.log("Response data", data);
        const faqs = Array.isArray(data.faqs) ? data.faqs : [];

        if (faqs.length === 0) {
            return Response.json({
                message: "AI returned no FAQs"
            }, { status: 500 });
        }

        const newFaqs = await AiFaq.findOneAndUpdate(
            { productId },
            { productId, faqs },
            { upsert: true, new: true, runValidators: true }
        ).lean();

        return Response.json({
            message: "FAQs generated and saved successfully",
            faqs: newFaqs.faqs,
            data: {
                ...newFaqs,
                _id: newFaqs._id.toString(),
                productId: newFaqs.productId.toString(),
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Unable to load FAQs.", error);
        return Response.json({
            message: "Something went wrong",
            error: error.message         
        }, { status: 500 });
    }
}
