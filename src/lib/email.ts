/**
 * Email delivery utility for Expense Tracker.
 * Supports:
 * 1. Resend API (via fetch, zero extra dependencies) when RESEND_API_KEY is configured.
 * 2. Development mode fallback: logs to terminal and provides direct link for easy local testing.
 */

type SendPasswordResetEmailParams = {
  to: string;
  resetUrl: string;
};

type SendEmailResult = {
  success: boolean;
  devResetUrl?: string;
  error?: string;
};

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendPasswordResetEmailParams): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const fromEmail =
        process.env.EMAIL_FROM || "Expense Tracker <onboarding@resend.dev>";

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: "Reset your Expense Tracker password",
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #18181b;">
              <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Password Reset Request</h2>
              <p style="font-size: 14px; line-height: 24px; color: #52525b; margin-bottom: 24px;">
                We received a request to reset your password for your Expense Tracker account. Click the button below to choose a new password:
              </p>
              <div style="margin-bottom: 28px;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
                  Reset Password
                </a>
              </div>
              <p style="font-size: 12px; line-height: 20px; color: #71717a;">
                This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
              <p style="font-size: 11px; color: #a1a1aa;">
                Button not working? Copy and paste this URL into your browser:<br />
                <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Resend email delivery failed:", data);
        return { success: false, error: "Failed to send reset email." };
      }

      return { success: true };
    } catch (err) {
      console.error("Error sending email via Resend:", err);
      return { success: false, error: "Network error sending reset email." };
    }
  }

  // Development / local fallback
  console.log("\n========================================================");
  console.log("🔑 [DEV EMAIL] Password Reset Requested");
  console.log(`📧 Recipient: ${to}`);
  console.log(`🔗 Reset URL: ${resetUrl}`);
  console.log("⏱️  Expires in: 1 hour");
  console.log("========================================================\n");

  const isDev = process.env.NODE_ENV !== "production";
  return {
    success: true,
    devResetUrl: isDev ? resetUrl : undefined,
  };
}
