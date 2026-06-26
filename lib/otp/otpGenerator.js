import crypto from "crypto";


const tempStore = new Map();
// generate otp and verify otp
export const generateOTP = async (userId, userEmail) => {
    try{
        // generate random number
        const otp = crypto.randomInt(100000, 999999).toString();

        // set expire 
        const expireAt = Date.now() + 5 * 60 * 1000;

        //save in tempStore
        tempStore.set(userId, {otp, expireAt});

        //call node mailer function with otp
        await sendEmail(otp , userEmail);

        return {
            success: true,
            message: "OTP generated successfully",
            data: {
                otp,
                expireAt
            },
            error: null,
            status: 200
        }
    }catch(error){
        console.log(error.message);
    }

}

export const verifyOtp =  async (userId, userOtp) =>{
    try{
        const record = tempStore.get(userId);

        if(!record){
            return {success : false , status : 400 , message : "OTP not found or Expired"};
        }

        //check is otp is expire or not
       if (Date.now() > record.expireAt){
        return {success : false , status : 400 , message : "OTP Expired"};
       }

       // check both otp match or not
       if(record.otp === userOtp.toString()){
        tempStore.delete(userId);
        return {success : true , status : 200 , message : "OTP verified successfully"};
       }


        }catch(error){
        console.log(error.message);
        return {
            success: false,
            message: "Something went wrong",
            data: null,
            error: error.message,
            status: 500
        }
    }

}