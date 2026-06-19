import { cookies } from "next/headers";
import connectDB from "@/lib/database/db";
import { verifyToken } from "@/lib/jwt";
import SellerInfo from "@/models/SellerInfo";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ authenticated: false }, { status: 401 });
    }

    const { valid, decoded } = verifyToken(accessToken);

    if (!valid || !decoded?.id) {
      return Response.json({ authenticated: false }, { status: 401 });
    }

    await connectDB();

    const seller = await SellerInfo.findById(decoded.id).select(
      "fullName email phoneNumber sellerType status verificationStatus shop"
    );

    if (!seller) {
      return Response.json(
        { authenticated: false, message: "Seller not found" },
        { status: 401 }
      );
    }

    return Response.json({
      authenticated: true,
      seller: {
        id: seller._id,
        fullName: seller.fullName,
        email: seller.email,
        phoneNumber: seller.phoneNumber,
        sellerType: seller.sellerType,
        status: seller.status,
        verificationStatus: seller.verificationStatus,
        shop: seller.shop,
      },
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { authenticated: false, message: "Unable to load seller account" },
      { status: 500 }
    );
  }
}
