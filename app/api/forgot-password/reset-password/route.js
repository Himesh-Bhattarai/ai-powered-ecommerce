import { NextResponse } from "next/server";
import connectDB from "@/lib/database/db";
import User from "@/models/User";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export async function POST(request) {
  try {
    const { newPassword, otp, email } = await request.json();

    if (!newPassword || !otp || !email) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizeEmail = email.toLowerCase().trim();

    await connectDB();

    const user = await User.findOne({ email: normalizeEmail }).select(
      "_id email password +passwordResetOtpHash +passwordResetOtpExpires"
    );

    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpires) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    if (user.passwordResetOtpExpires < new Date()) {
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpires = undefined;
      await user.save();

      return NextResponse.json(
        { message: "OTP expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    const isMatch = await verifyPassword(
      otp.toString(),
      user.passwordResetOtpHash
    );

    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid OTP" },
        { status: 400 }
      );
    }

    user.password = await hashPassword(newPassword);
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;

    await user.save();

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log("Reset password error:", error.message);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
