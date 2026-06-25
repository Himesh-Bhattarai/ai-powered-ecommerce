export async function(request){
    try{
        //Read input
        const {email} = await request.body();

        //Validate input
        if(!email){
            return NextResponse({
                message : "Email is required"
            },{status : 400})
        }

        //check in DB
        await connectDB();

        const user = await User.findOne({email : email});

        if(!user){
            return NextResponse({
                message : "Invalid email"
            },{status : 400})
        }

        // Generate OTP
        
        }


    }
}