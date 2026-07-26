import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/token";

export async function isAuthenticated() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken")?.value;

        if (!accessToken) return null;

        const tokenResult = verifyToken(accessToken);
        const userId = tokenResult.decoded?._id || tokenResult.decoded?.id;

        if (!tokenResult.valid || !userId) return null;

        return userId;

    } catch (error) {
        console.error("[Auth] Cookie error:", error);
        return null;
    }
}