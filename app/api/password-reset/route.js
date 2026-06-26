import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/database/db";
import User from "@/models/User";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { verifyToken } from "@/lib/jwt/token";

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken")?.value;
        const { previousPassword, newPassword } = await request.json().catch(() => ({}));

        if (!accessToken) {
            return NextResponse.json({
                message: "Authentication required",
            }, { status: 401 });
        }

        const tokenResult = verifyToken(accessToken);
        const userId = tokenResult.decoded?.id || tokenResult.decoded?._id;

        if (!tokenResult.valid || !userId) {
            return NextResponse.json({
                message: "Authentication required",
            }, { status: 401 });
        }

        if (!previousPassword || !newPassword) {
            return NextResponse.json({
                message: "All fields are required",
            }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({
                message: "Password must be at least 8 characters",
            }, { status: 400 });
        }

        if (previousPassword === newPassword) {
            return NextResponse.json({
                message: "New password must be different from previous password",
            }, { status: 400 });
        }

        await connectDB();

        const user = await User.findById(userId).select("_id password email");

        if (!user) {
            return NextResponse.json({
                message: "User account not found",
            }, { status: 401 });
        }

        const isMatch = await verifyPassword(previousPassword, user.password);

        if (!isMatch) {
            return NextResponse.json({
                message: "Invalid password",
            }, { status: 401 });
        }

        user.password = await hashPassword(newPassword);
        await user.save();

        return NextResponse.json({
            message: "Password reset successfully",
            user: {
                id: user._id,
                email: user.email,
            },
        }, { status: 200 });

    } catch (error) {
        console.error("Password reset route error:", error);
        return NextResponse.json({
            message: "Something went wrong",
        }, { status: 500 });
    }

}
