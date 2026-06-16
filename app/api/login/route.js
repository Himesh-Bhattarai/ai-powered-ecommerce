import connectDB from "@/lib/database/db";
import User from "@/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { mergeGuestPreferenceIntoUser } from "@/lib/personalization/server";

export async function POST(request) {
  try {
    const { email, password, sessionId } = await request.json();

    if (!email || !password) {
      return Response.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return Response.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return Response.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const { accessToken, refreshToken } = generateToken({
      id: user._id.toString(),
      email: user.email
    });

    const cookieOptions = await cookies();

    cookieOptions.set("accessToken" , accessToken, {
      httpOnly : true,
      secure: process.env.NODE_ENV === "production",
      maxAge : 60 * 60 * 24, 
      sameSite: "lax"
    })

    cookieOptions.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax"
    })

    await mergeGuestPreferenceIntoUser(sessionId, user._id.toString()).catch(
      (error) => {
        console.warn("Unable to merge guest preference after login.", error.message);
      }
    );

    return Response.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
        },
        route: "/"
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
