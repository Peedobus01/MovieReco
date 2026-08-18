const { Resend } = require("resend");

// We initialize Resend using the API key you will provide in Render
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendPasswordResetEmail(toEmail, resetUrl) {
  // Resend requires a custom domain to send from an official address. 
  // For free accounts without a domain, you MUST use 'onboarding@resend.dev' 
  // and you can only send emails TO the email address you registered with.
  const { data, error } = await resend.emails.send({
    from: "MovieReco <onboarding@resend.dev>",
    to: toEmail,
    subject: "Reset your MovieReco password",
    html: `
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
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
}

module.exports = { sendPasswordResetEmail };