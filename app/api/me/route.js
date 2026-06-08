import { cookies } from "next/headers";
import connectDB from "@/lib/database/db";
import { verifyToken } from "@/lib/jwt";
import User from "@/models/User";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ authenticated: false }, { status: 401 });
    }

    const { valid, decoded } = verifyToken(accessToken);

    if (!valid || !decoded?.id) {
      return Response.json({ authenticated: false }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.id).select(
      "fullName email phoneNumber address"
    );

    if (!user) {
      return Response.json({ authenticated: false }, { status: 401 });
    }

    return Response.json({
      authenticated: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { authenticated: false, message: "Unable to load account" },
      { status: 500 }
    );
  }
}
