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

// POST new faq
export async function POST(request) {
  try {
    // 1. Read body
    const body = await request.json().catch(() => ({}));
    const { question, answer, productId } = body;

    // 2. Validate body
    if (!question || !answer || !productId) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // 3. Check token
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // 4. Verify token
    const tokenResult = verifyToken(accessToken);

    if (!tokenResult.valid || !tokenResult.decoded?._id) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // 5. Connect DB
    await connectDB();

    // 6. Find seller
    const seller = await SellerInfo.findById(tokenResult.decoded._id).select("_id");

    if (!seller) {
      return NextResponse.json(
        { message: "Seller account not found" },
        { status: 404 }
      );
    }

    // 7. Check ownership
    const product = await Product.findOne({
      _id: productId,
      seller: seller._id,
    }).select("_id seller");

    if (!product) {
      return NextResponse.json(
        { message: "Product not found or permission denied" },
        { status: 404 }
      );
    }

    // 8. Perform action
    const faq = await AiFaq.create({
      question,
      answer,
      productId: product._id,
      createdBy: seller._id,
    });

    // 9. Clean response
    return NextResponse.json(
      {
        message: "FAQ created successfully",
        data: {
          _id: faq._id.toString(),
          question: faq.question,
          answer: faq.answer,
          productId: faq.productId.toString(),
          createdBy: faq.createdBy.toString(),
          createdAt: faq.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create FAQ error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}


export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    // Validate productId
    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check token
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify token
    const tokenResult = verifyToken(accessToken);

    if (!tokenResult.valid || !tokenResult.decoded?._id) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect DB
    await connectDB();

    // Find seller
    const seller = await SellerInfo.findById(tokenResult.decoded._id).select("_id");

    if (!seller) {
      return NextResponse.json(
        { message: "Seller account not found" },
        { status: 404 }
      );
    }

    // Delete FAQ only if it belongs to this seller
    const deletedFaq = await AiFaq.findOneAndDelete({
      productId,
      sellerId: seller._id,
    });

    if (!deletedFaq) {
      return NextResponse.json(
        { message: "FAQ not found or permission denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "FAQ deleted successfully",
        data: {
          _id: deletedFaq._id.toString(),
          productId: deletedFaq.productId.toString(),
          sellerId: deletedFaq.sellerId.toString(),
          source: deletedFaq.source,
          faqs: deletedFaq.faqs,
          createdAt: deletedFaq.createdAt,
          updatedAt: deletedFaq.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete FAQ error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}