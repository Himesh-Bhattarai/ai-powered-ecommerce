import crypto from "crypto";
import { NextResponse } from "next/server";
import connectDB from "@/lib/database/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { sendOtpEmail } from "@/lib/nodeMailer/emailService";

export async function POST(request) {
  try {
    const { email } = await request.json().catch(() => ({}));

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    await connectDB();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "_id email +passwordResetOtpHash +passwordResetOtpExpires"
    );

    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a reset code has been sent." },
        { status: 200 }
      );
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    user.passwordResetOtpHash = await hashPassword(otp);
    user.passwordResetOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    const emailResult = await sendOtpEmail(otp, user.email);

    if (!emailResult.success) {
      return NextResponse.json(
        { message: emailResult.message || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "If an account exists, a reset code has been sent.",
    });
  } catch (error) {
    console.error("Send password reset OTP error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
