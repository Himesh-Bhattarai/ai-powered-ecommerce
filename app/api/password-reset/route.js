export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken")?.value;
        const { email, previousPassword, newPassword } = await request.json();

        //if user try to reset password while if he loggedIn then below operation 
        if (accessToken) {
            try {
                const tokenResult = verifyToken(accessToken);

                if (!tokenResult.valid || !tokenResult.decoded?._id) {
                    return NextResponse.json({
                        message: "Authentication required",
                    }, { status: 401 })
                }

                if (!previousPassword || !newPassword) {
                    return NextResponse.json({
                        message: "All fields are required",
                    }, { status: 400 })
                }

                if (previousPassword !== newPassword) {
                    return newPassword
                }

                // check user exist or not and previous password match to database hash password
                const user = await User.findById(tokenResult.decoded?._id).select("_id password email");

                if (!user) {
                    return NextResponse.json({
                        message: "User account not found",
                    }, { status: 401 })
                }

                const isMatch = await bcrypt.compare(previousPassword, user.password);

                // not match
                if (!isMatch) {
                    return NextResponse.json({
                        message: "Invalid password",
                    }, { status: 401 })
                }

                //if Match
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(newPassword, salt);

                //save to db
                user.password = hashedPassword;
                await user.save();

                // send response
                return NextResponse.json({
                    message: "Password reset successfully",
                    user: {
                        _id: user._id,
                        email: user.email
                    }
                }, { status: 200 })

            } catch (error) {
                return NextResponse.json({
                    message: error.message
                })
            }
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return NextResponse.json({
                message: "User account not found",
            }, { status: 401 })
        }

        // prefer to use nodemailer to send otp and verify otp and then below operation




    } catch (error) {
        return NextResponse.json({
            message: error.message
        })
    }

}