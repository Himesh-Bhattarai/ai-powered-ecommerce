import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();

        //Check refresh token in database and match
        const refreshToken = cookieStore.get("refreshToken")?.value;

        if(!refreshToken){
            return NextResponse.json({
                success: false,
                message : "Refresh token not found"
            }, {
                status : 401
            })
        }

        const {valid, decoded} = verifyToken(refreshToken)

        if(!valid || !decoded?.id){
            return NextResponse.json({
                success: false,
                message : "Invalid refresh token"

        },{
            status : 401
        })
        }

        await connectDB();

        // verify the refresh token
        const user = await User.findOne({
            _id: decoded.id

        }).select("+refreshToken")

        if(!user){
            return NextResponse.json({
                success: false,
                message : 'User not found'
            },{
                status : 404
            })
        }

        //compare hash
        const isRefreshTokenValid = await verifyPassword(refreshToken, user.refreshToken)
        if(!isRefreshTokenValid){
            return NextResponse.json({
                success: false,
                message : "Refresh token is invalid"
            }, {
                status : 401
            })
        }

        //clear token from database
        user.refreshToken = undefined;
        await user.save();

        // Delete the access and refresh tokens from the cookie store
        cookieStore.delete("accessToken");
        cookieStore.delete("refreshToken");

        return NextResponse.json({
            success: true,
            message: "Logged out successfully",

        }, { status: 200 });

    } catch (error) {
        console.error("Logout route error:", error);
        return NextResponse.json({
            success: false,
            message: "Error found in operating the request"
        }, { status: 500 })
    }
}
