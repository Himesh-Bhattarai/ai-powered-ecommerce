import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDb from "@/lib/database/db";
import User from "@/models/User";
import { verifyToken, generateToken } from "@/lib/auth/token";

export async function POST() {
  try {
    // get refresh token from cookie
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // validate refresh token
    const tokenResult = await verifyToken(refreshToken, "refresh");

    if (!tokenResult.valid || !tokenResult.decoded?._id) {
      const response = NextResponse.json(
        { message: "Invalid or expired refresh token" },
        { status: 401 }
      );

      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");

      return response;
    }

    // check user exists
    await connectDb();

    const user = await User.findById(tokenResult.decoded._id).select(
      "_id email fullName"
    );

    if (!user) {
      const response = NextResponse.json(
        { message: "User account not found" },
        { status: 401 }
      );

      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");

      return response;
    }

    // prepare payload
    const payload = {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
    };

    // create new access token and new refresh token
    const { accessToken, refreshToken: newRefreshToken } = generateToken(payload);

    const response = NextResponse.json(
      {
        message: "Token rotated successfully",
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
        },
      },
      { status: 200 }
    );

    // set new access token cookie
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });

    // set new refresh token cookie
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