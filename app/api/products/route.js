import connectDB from "@/lib/database/db";
import Product from "@/models/Product";

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
