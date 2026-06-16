import connectDB from "@/lib/database/db";
import { verifyPassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/jwt";
import SellerInfo from "@/models/SellerInfo";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    await connectDB();

    const { email, phoneNumber, password } = await request.json();
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : undefined;
    const normalizedPhoneNumber =
      typeof phoneNumber === "string"
        ? phoneNumber.replace(/\D/g, "")
        : undefined;

    if (!normalizedEmail && !normalizedPhoneNumber) {
      return Response.json(
        { message: "Email or phone number is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return Response.json(
        { message: "Password is required" },
        { status: 400 }
      );
    }

    const seller = normalizedEmail
      ? await SellerInfo.findOne({ email: normalizedEmail }).select("+passwordHash")
      : await SellerInfo.findOne({ phoneNumber: normalizedPhoneNumber }).select(
          "+passwordHash"
        );

    if (!seller) {
      return Response.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const checkPassword = await verifyPassword(password, seller.passwordHash);

    if (!checkPassword) {
      return Response.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const payload = {
      id: seller._id,
      email: seller.email,
      phoneNumber: seller.phoneNumber,
    };

    const { refreshToken, accessToken } = await generateToken(payload);

    const cookieStore = await cookies();

    cookieStore.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return Response.json(
      {
        message: "Seller logged in successfully",
        sellerInfo: {
          _id: seller._id,
          fullName: seller.fullName,
          email: seller.email,
          phoneNumber: seller.phoneNumber,
          sellerType: seller.sellerType,
          status: seller.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
