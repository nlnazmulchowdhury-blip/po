'use server';
/**
 * @fileOverview A flow to generate, save, and send an OTP for password reset.
 * Uses Gmail SMTP via Nodemailer to send OTP to any email address.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminDb } from '@/firebase/admin';
import nodemailer from 'nodemailer';

const SendOtpInputSchema = z.object({
  email: z.string().email().describe('The user email to send OTP to.'),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

const SendOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendOtpOutput = z.infer<typeof SendOtpOutputSchema>;

export async function sendOtp(input: SendOtpInput): Promise<SendOtpOutput> {
  return sendOtpFlow(input);
}

// Beautiful HTML template for the OTP email
function buildOtpEmailHtml(otp: string): string {
  return `
    <!DOCTYPE html>
    <html lang="bn">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2a2a4a;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
          <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 16px;margin-bottom:12px;">
            <span style="font-size:24px;">🎬</span>
          </div>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">CinemaStream</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">পাসওয়ার্ড রিসেট ভেরিফিকেশন</p>
        </div>

        <!-- Body -->
        <div style="padding:36px 32px;">
          <p style="color:#c4c4d4;font-size:15px;margin:0 0 8px;">আপনার অ্যাকাউন্টের পাসওয়ার্ড রিসেট করতে নিচের ৬ ডিজিটের কোডটি ব্যবহার করুন:</p>

          <!-- OTP Box -->
          <div style="background:#0d0d1a;border:2px solid #6366f1;border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
            <p style="margin:0 0 8px;color:#8b8ba8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">আপনার ওটিপি কোড</p>
            <div style="font-size:42px;font-weight:900;letter-spacing:14px;color:#ffffff;font-family:'Courier New',monospace;">${otp}</div>
          </div>

          <!-- Timer Warning -->
          <div style="background:#2d1a00;border:1px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
            <p style="margin:0;color:#fbbf24;font-size:13px;text-align:center;">⏱️ এই কোডটি <strong>১০ মিনিট</strong> পরে মেয়াদ শেষ হয়ে যাবে</p>
          </div>

          <p style="color:#8b8ba8;font-size:13px;text-align:center;margin:0;">
            যদি আপনি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইলটি উপেক্ষা করুন।<br>
            আপনার অ্যাকাউন্ট সম্পূর্ণ সুরক্ষিত আছে।
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#111122;padding:20px;text-align:center;border-top:1px solid #2a2a4a;">
          <p style="margin:0;color:#555570;font-size:11px;">© 2025 CinemaStream · এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const sendOtpFlow = ai.defineFlow(
  {
    name: 'sendOtpFlow',
    inputSchema: SendOtpInputSchema,
    outputSchema: SendOtpOutputSchema,
  },
  async (input) => {
    // 1. Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      // 2. Check Gmail SMTP credentials
      const gmailUser = process.env.GMAIL_USER;
      const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

      if (!gmailUser || !gmailAppPassword) {
        console.error('ERROR: GMAIL_USER or GMAIL_APP_PASSWORD is missing!');
        return {
          success: false,
          message: 'সার্ভার কনফিগারেশন ত্রুটি: Gmail SMTP সেটআপ করা নেই।',
        };
      }

      // 3. Save OTP to Firestore FIRST (always save before sending email)
      await adminDb.collection('passwordResets').add({
        email: input.email,
        otp: otp,
        expiresAt: new Date(Date.now() + 10 * 60000).toISOString(), // 10 mins expiry
        createdAt: new Date(),
        used: false,
      });

      // 4. Create Gmail SMTP transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword, // Gmail App Password (not regular password)
        },
      });

      // 5. Send OTP email
      await transporter.sendMail({
        from: `"CinemaStream" <${gmailUser}>`,
        to: input.email,
        subject: 'CinemaStream - পাসওয়ার্ড রিসেট ওটিপি',
        html: buildOtpEmailHtml(otp),
      });

      console.log('Password Reset OTP sent successfully to:', input.email);
      return {
        success: true,
        message: 'আপনার ইমেইলে একটি ভেরিফিকেশন কোড পাঠানো হয়েছে।',
      };
    } catch (err: any) {
      console.error('Error in Password Reset OTP flow:', err);

      // Provide specific error messages
      if (err.code === 'EAUTH') {
        return {
          success: false,
          message: 'Gmail অথেনটিকেশন ব্যর্থ হয়েছে। GMAIL_APP_PASSWORD চেক করুন।',
        };
      }
      if (err.code === 'EENVELOPE') {
        return {
          success: false,
          message: 'ইমেইল ঠিকানাটি সঠিক নয়।',
        };
      }
      return {
        success: false,
        message: 'ওটিপি পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
      };
    }
  }
);