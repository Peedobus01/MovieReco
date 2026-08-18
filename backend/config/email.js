const axios = require("axios");

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const data = {
    sender: {
      name: "MovieReco",
      email: process.env.EMAIL_USER // Your verified Brevo sender email
    },
    to: [
      {
        email: toEmail
      }
    ],
    subject: "Reset your MovieReco password",
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #121214;">
        <h2 style="margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #4a4a4a; line-height: 1.5;">
          Someone requested a password reset for your MovieReco account. If this was you, click the button below - this link expires in 15 minutes.
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #38bdf8; color: #010816; font-weight: 600; text-decoration: none; border-radius: 8px;">
          Reset Password
        </a>
        <p style="color: #8a8a8a; font-size: 13px; line-height: 1.5;">
          If you didn't request this, you can safely ignore this email - your password won't be changed.
        </p>
      </div>
    `
  };

  try {
    await axios.post("https://api.brevo.com/v3/smtp/email", data, {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
}

module.exports = { sendPasswordResetEmail };