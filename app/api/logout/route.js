import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("accessToken");
        cookieStore.delete("refreshToken");

        return NextResponse.json({
            message: "Logged out successfully",
            route: "/",
        });

    } catch (error) {
        console.error("Logout route error:", error);
        return NextResponse.json({
            message: "Error found in operating the request"
        }, { status: 400 })
    }
}
