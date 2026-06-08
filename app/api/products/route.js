import connectDB from "@/lib/database/db";
import { fallbackProducts } from "@/lib/catalog/fallbackProducts";
import { resolveWithTimeout } from "@/lib/utils/resolveWithTimeout";
import Product from "@/models/Product";

export async function GET() {
  try {
    const products = await resolveWithTimeout(
      (async () => {
        await connectDB();
        return Product.find().lean();
      })()
    );

    if (!products || products.length === 0) {
      return Response.json(fallbackProducts);
    }

    return Response.json(
      products.map((product) => ({
        ...product,
        _id: product._id.toString(),
      }))
    );
  } catch (error) {
    console.error("Unable to load MongoDB products. Showing fallback catalog.", error);
    return Response.json(fallbackProducts);
  }
}
