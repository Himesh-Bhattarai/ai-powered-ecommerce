export async function POST() {
    try {
        const cookieStore = cookies();
        const accessToken = cookieStore.get("accessTOken")?.value

        const tokenResult = verifyToken(accessToken)

        if (!tokenResult.valid || !tokenResult.decoded._id) {
            return NextResponse.json({
                message: "Authentication required",
            }, { status: 401 })
        }

        await connectDB();

        const user = await User.findById(tokenResult.decoded._id).select("_id email fullName")

        cookieStore.delete("accessToken");
        cookieStore.delete("refreshToken");

        return NextResponse.json({
            message: "Logout successfully",
            user: {
                _id: user?._id,
                fullName: user?.fullName,
                email: user?.email

            },
            route: "/"
        })

    } catch (error) {
        console.error("Logout route error:", error);
        return NextResponse.json({
            message: "Error found in operating the request"
        }, { status: 400 })
    }
}