'use server';
/**
 * @fileOverview A flow to generate, save, and send an OTP for signup verification.
 * It uses Resend to send the OTP to the user's email.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { Resend } from 'resend';

// Initialize Firebase for server-side use
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const SendSignupOtpInputSchema = z.object({
  email: z.string().email().describe('The user email to send signup OTP to.'),
});
export type SendSignupOtpInput = z.infer<typeof SendSignupOtpInputSchema>;

const SendSignupOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendSignupOtpOutput = z.infer<typeof SendSignupOtpOutputSchema>;

export async function sendSignupOtp(input: SendSignupOtpInput): Promise<SendSignupOtpOutput> {
  return sendSignupOtpFlow(input);
}

const sendSignupOtpFlow = ai.defineFlow(
  {
    name: 'sendSignupOtpFlow',
    inputSchema: SendSignupOtpInputSchema,
    outputSchema: SendSignupOtpOutputSchema,
  },
  async (input) => {
    // 1. Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      // 2. Check for API Key first
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.error("ERROR: RESEND_API_KEY is missing from environment variables!");
        return {
          success: false,
          message: "সার্ভার কনফিগারেশন ত্রুটি: RESEND_API_KEY সেট করা নেই। আপনার .env ফাইলটি চেক করুন।"
        };
      }

      const resend = new Resend(apiKey);

      // 3. Save OTP to Firestore (Always save so admin can verify if email fails)
      await addDoc(collection(db, 'signupVerifications'), {
        email: input.email,
        otp: otp,
        expiresAt: new Date(Date.now() + 10 * 60000).toISOString(), // 10 mins expiry
        createdAt: serverTimestamp(),
        used: false
      });

      // 4. Send email via Resend
      const { data, error } = await resend.emails.send({
        from: 'CinemaStream <onboarding@resend.dev>',
        to: input.email,
        subject: 'CinemaStream - সাইন-আপ ওটিপি কোড',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1; text-align: center;">সিনেমা স্ট্রিমে স্বাগতম!</h2>
            <p>আপনার অ্যাকাউন্ট ভেরিফাই করার জন্য নিচের ৬ ডিজিটের ওটিপি কোডটি ব্যবহার করুন:</p>
            <div style="background: #f3f4f6; padding: 25px; border-radius: 10px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #111827; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #666; text-align: center;">এই কোডটি আগামী ১০ মিনিটের জন্য কার্যকর থাকবে।</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">যদি আপনি এই অনুরোধ না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন।</p>
            <p style="font-size: 10px; color: #ccc; text-align: center; margin-top: 20px;">Powered by Resend</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend API Delivery Error:", error);
        
        // DEV ONLY: Bypass Resend restrictions in development to allow testing with other emails
        const isResendRestriction = error.message && (
          error.message.includes("testing emails") || 
          error.message.includes("domain") || 
          error.message.includes("verify")
        );
        if (isResendRestriction) {
          console.warn(`\n==================================================\n[DEV FALLBACK] Resend restriction hit.\nTarget Email: ${input.email}\nGenerated Signup OTP: ${otp}\n==================================================\n`);
          return {
            success: true,
            message: "ভেরিফিকেশন কোড পাঠানো হয়েছে। (ডেভ মোড: ওটিপি কোডটি সার্ভার কনসোলে প্রিন্ট করা হয়েছে)"
          };
        }

        return {
          success: false,
          message: `ইমেইল পাঠানো সম্ভব হয়নি: ${error.message}`
        };
      }

      console.log("Email sent successfully to:", input.email, "Data ID:", data?.id);
      return {
        success: true,
        message: "আপনার ইমেইলে একটি ভেরিফিকেশন কোড পাঠানো হয়েছে।"
      };
    } catch (err: any) {
      console.error("Unexpected Error in Signup OTP flow:", err);
      return {
        success: false,
        message: "ওটিপি পাঠাতে অভ্যন্তরীণ সমস্যা হয়েছে। আপনার ইন্টারনেট কানেকশন বা API Key চেক করুন।"
      };
    }
  }
);