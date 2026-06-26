import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/database/db";
import User from "@/models/User";

export async function POST(request) {
  try {
    // read value
    const { newPassword, otp, email } = await request.json();

    // validate value
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
      "_id email password +hashOtp +hashOtpExpires"
    );

    if (!user || !user.hashOtp || !user.hashOtpExpires) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // check OTP expiry
    if (user.hashOtpExpires < new Date()) {
      user.hashOtp = undefined;
      user.hashOtpExpires = undefined;
      await user.save();

      return NextResponse.json(
        { message: "OTP expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    // verify OTP
    const isMatch = await bcrypt.compare(otp.toString(), user.hashOtp);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid OTP" },
        { status: 400 }
      );
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update user password
    user.password = hashedPassword;

    // delete OTP after successful reset
    user.hashOtp = undefined;
    user.hashOtpExpires = undefined;

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