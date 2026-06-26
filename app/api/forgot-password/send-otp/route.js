import generateOTP from "@/lib/otp"
import sendOtpEmail from "@/lib/nodeMailer"
export async function POST(request){
    try{
        //Read input
        const {email} = await request.json();

        //Validate input
        if(!email){
            return NextResponse.json({
                message : "Email is required"
            },{status : 400})
        }

        //check in DB
        await connectDB();

        const user = await User.findOne({email : email}).select("_id email")

        const userId = user?._id;
        const userEmail = user?.email;
        if(!user){
            return NextResponse.json({
                message : "Invalid email"
            },{status : 400})
        }

        // Generate OTPx

        const otp = await generateOTP(userId, userEmail);

        if(!otp){
            return NextResponse.json({
                message : "Failed to generate OTP"
            },{status : 500})
        }

        // save to database by hashed but for not it's okay

        // after generating otp send email to user
        const isEmailSend = await sendOtpEmail(otp, userEmail);

        if(!isEmailSend.success){
            return NextResponse.json({
                message : "Failed to send email"
            },{status : 500})
        }

        return NextResponse.json({
            message : "OTP sent successfully",
            user: {
                _id : user?._id,
                email : user?.email
            },
        },{status : 200})

        }catch(error){
            return NextResponse.json({
                message : "Something went wrong"
            })
        }


    }
