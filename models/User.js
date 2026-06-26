import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    fullName:{
        type: String,
        required: true,
        trim: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password:{
        type: String,
        required: true,
        minlength: 8,
    },
    phoneNumber:{
        type: String,
        required: true,
        trim: true,
    },
    address:{
        type: String,
        required: true,
        trim: true,
    },
    passwordResetOtpHash: {
        type: String,
        select: false,
    },
    passwordResetOtpExpires: {
        type: Date,
        select: false,
    }
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
