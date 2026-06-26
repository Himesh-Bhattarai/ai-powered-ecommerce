import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDb from "@/lib/database/db";
import User from "@/models/User";
import SellerInfo from "@/models/SellerInfo";
import { verifyToken, generateToken } from "@/lib/jwt/token";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const tokenResult = verifyToken(refreshToken);
    const accountId = tokenResult.decoded?.id || tokenResult.decoded?._id;

    if (!tokenResult.valid || !accountId) {
      const response = NextResponse.json(
        { message: "Invalid or expired refresh token" },
        { status: 401 }
      );

      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");

      return response;
    }

    await connectDb();

    const user = await User.findById(accountId).select(
      "_id email fullName"
    );
    const seller = user
      ? null
      : await SellerInfo.findById(accountId).select(
          "_id email fullName phoneNumber sellerType status verificationStatus shop"
        );

    if (!user && !seller) {
      const response = NextResponse.json(
        { message: "Account not found" },
        { status: 401 }
      );

      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");

      return response;
    }

    const account = user || seller;
    const role = user ? "buyer" : "seller";
    const payload = {
      id: account._id.toString(),
      email: account.email,
      role,
    };

    const { accessToken, refreshToken: newRefreshToken } = generateToken(payload);

    const response = NextResponse.json(
      {
        message: "Token rotated successfully",
        account: {
          id: account._id,
          fullName: account.fullName,
          email: account.email,
          role,
        },
      },
      { status: 200 }
    );

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.log("Refresh route error:", error.message);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
