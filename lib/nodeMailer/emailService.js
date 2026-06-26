import nodemailer from "nodemailer";

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_APP_PASSWORD;

const transporter =
  emailUser && emailPassword
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      })
    : null;

export async function sendOtpEmail(otp, userEmail) {
  try {
    if (!otp || !userEmail) {
      return {
        success: false,
        message: "OTP and user email are required",
        data: null,
        error: null,
        status: 400,
      };
    }

    if (!transporter) {
      return {
        success: false,
        message: "Email credentials are missing in environment variables",
        data: null,
        error: null,
        status: 500,
      };
    }

    const mailOptions = {
      from: `"Bazar Security" <${emailUser}>`,
      to: userEmail,
      subject: "Password Reset OTP - Bazar",

      text: `
Your OTP is ${otp}.

This OTP will expire in 5 minutes.
Please do not share this OTP with anyone.

If you did not request this, you can safely ignore this email.

Best regards,
Bazar
      `,

      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
          <h2 style="margin-bottom: 16px; color: #111827;">Password Reset Verification</h2>

          <p style="font-size: 15px; color: #374151;">
            Use the following One-Time Password (OTP) to reset your password:
          </p>

          <div style="margin: 24px 0; padding: 16px; text-align: center; background-color: #f3f4f6; border-radius: 6px;">
            <h1 style="margin: 0; color: #2563eb; letter-spacing: 4px; font-size: 32px;">
              ${otp}
            </h1>
          </div>

          <p style="font-size: 14px; color: #374151;">
            This code is valid for <strong>5 minutes</strong>. Please do not share it with anyone.
          </p>

          <p style="font-size: 13px; color: #6b7280;">
            If you did not request a password reset, you can safely ignore this email.
          </p>

          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

          <p style="font-size: 13px; color: #6b7280;">
            Best regards,<br />
            Bazar Team
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "OTP email sent successfully",
      data: null,
      error: null,
      status: 200,
    };
  } catch (error) {
    console.error("Send OTP email error:", error.message);

    return {
      success: false,
      message: "Failed to send OTP email",
      data: null,
      error: null,
      status: 500,
    };
  }
}

