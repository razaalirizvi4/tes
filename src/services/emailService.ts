import axios from "axios";

interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

class EmailService {
  private apiKey: string;
  private apiSecret: string;
  private fromEmail: string;
  private fromName: string;
  private baseUrl = "https://api.mailjet.com/v3.1";

  constructor() {
    this.apiKey = process.env.MAILJET_API_KEY || "";
    this.apiSecret = process.env.MAILJET_SECRET_KEY || "";
    this.fromEmail = process.env.MAILJET_FROM_EMAIL || "noreply@fiestaa.com";
    this.fromName = process.env.MAILJET_FROM_NAME || "Fiestaa";

    if (!this.apiKey || !this.apiSecret) {
      console.warn(
        "Mailjet credentials not configured. Email sending will fail."
      );
    }
  }

  /**
   * Send email via Mailjet API
   */
  async sendEmail({
    to,
    toName,
    subject,
    htmlContent,
    textContent,
  }: SendEmailParams): Promise<boolean> {
    if (!this.apiKey || !this.apiSecret) {
      console.error("Mailjet credentials not configured");
      return false;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/send`,
        {
          Messages: [
            {
              From: {
                Email: this.fromEmail,
                Name: this.fromName,
              },
              To: [
                {
                  Email: to,
                  Name: toName || to,
                },
              ],
              Subject: subject,
              TextPart: textContent || this.stripHtml(htmlContent),
              HTMLPart: htmlContent,
            },
          ],
        },
        {
          auth: {
            username: this.apiKey,
            password: this.apiSecret,
          },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log("Email sent successfully to:", to);
        return true;
      }

      return false;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorData = (error as { response?: { data?: unknown } })?.response
        ?.data;
      console.error(
        "Error sending email via Mailjet:",
        errorData || errorMessage
      );
      return false;
    }
  }

  /**
   * Send email confirmation email
   */
  async sendConfirmationEmail(
    email: string,
    name: string,
    confirmationToken: string,
    baseUrl?: string
  ): Promise<boolean> {
    // Get app URL from parameter, environment, or use default
    const appUrl =
      baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const confirmationUrl = `${appUrl}/auth/confirm?token=${confirmationToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your Email - Fiestaa</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5;">Welcome to Fiestaa!</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${
              name || "there"
            },</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for signing up for Fiestaa! To complete your registration and start ordering delicious food, please confirm your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Confirm Your Email
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #9ca3af; word-break: break-all; margin-top: 10px;">
              ${confirmationUrl}
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with Fiestaa, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af;">
              © ${new Date().getFullYear()} Fiestaa. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Welcome to Fiestaa!

Hi ${name || "there"},

Thank you for signing up for Fiestaa! To complete your registration and start ordering delicious food, please confirm your email address by clicking the link below:

${confirmationUrl}

This verification link will expire in 24 hours. If you didn't create an account with Fiestaa, please ignore this email.

© ${new Date().getFullYear()} Fiestaa. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      toName: name,
      subject: "Confirm Your Email - Fiestaa",
      htmlContent,
      textContent,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
    baseUrl?: string
  ): Promise<boolean> {
    // Get app URL from parameter, environment, or use default
    const appUrl =
      baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Fiestaa</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5;">Reset Your Password</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${
              name || "there"
            },</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password for your Fiestaa account. Click the button below to reset your password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #9ca3af; word-break: break-all; margin-top: 10px;">
              ${resetUrl}
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              <strong>⚠️ Important:</strong> This password reset link will expire in 10 minutes. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af;">
              © ${new Date().getFullYear()} Fiestaa. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Reset Your Password - Fiestaa

Hi ${name || "there"},

We received a request to reset your password for your Fiestaa account. Click the link below to reset your password:

${resetUrl}

This password reset link will expire in 10 minutes. If you didn't request a password reset, please ignore this email and your password will remain unchanged.

© ${new Date().getFullYear()} Fiestaa. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      toName: name,
      subject: "Reset Your Password - Fiestaa",
      htmlContent,
      textContent,
    });
  }

  /**
   * Strip HTML tags from content for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  }
}

export const emailService = new EmailService();
