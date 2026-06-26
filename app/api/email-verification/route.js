import { NextResponse } from "next/server";
import connectDB from "@/lib/database/db";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "_id email emailVerified +emailVerifyOtp +emailVerifyOtpExpires"
    );

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 200 }
      );
    }

    if (!user.emailVerifyOtp || !user.emailVerifyOtpExpires) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    if (user.emailVerifyOtpExpires < new Date()) {
      user.emailVerifyOtp = undefined;
      user.emailVerifyOtpExpires = undefined;
      await user.save();

      return NextResponse.json(
        { message: "OTP expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    if (user.emailVerifyOtp.toString() !== otp.toString()) {
      return NextResponse.json(
        { message: "Invalid OTP" },
        { status: 400 }
      );
    }

    user.emailVerified = true;
    user.emailVerifyOtp = undefined;
    user.emailVerifyOtpExpires = undefined;

    await user.save();

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log("Email verification error:", error.message);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}