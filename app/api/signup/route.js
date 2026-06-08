import connectDB from "@/lib/database/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth/password";

export async function POST(request) {
  try {
    const { fullName, email, password, phoneNumber, address } = await request.json();

    if (!fullName || !email || !password || !phoneNumber || !address) {
      return Response.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return Response.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
    });

    return Response.json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        phoneNumber: newUser.phoneNumber,
        address: newUser.address,
      },
      route: "/login",
    }, { status: 201 });

  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return Response.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
