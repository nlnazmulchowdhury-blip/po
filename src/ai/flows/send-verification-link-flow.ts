
'use server';
/**
 * @fileOverview A flow to send an email verification link to a user.
 * It uses Resend to send the link.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';

const SendVerificationLinkInputSchema = z.object({
  email: z.string().email().describe('The user email to send the verification link to.'),
  name: z.string().describe('The name of the user.'),
  verificationLink: z.string().describe('The unique verification link.'),
});
export type SendVerificationLinkInput = z.infer<typeof SendVerificationLinkInputSchema>;

const SendVerificationLinkOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendVerificationLinkOutput = z.infer<typeof SendVerificationLinkOutputSchema>;

export async function sendVerificationLink(input: SendVerificationLinkInput): Promise<SendVerificationLinkOutput> {
  return sendVerificationLinkFlow(input);
}

const sendVerificationLinkFlow = ai.defineFlow(
  {
    name: 'sendVerificationLinkFlow',
    inputSchema: SendVerificationLinkInputSchema,
    outputSchema: SendVerificationLinkOutputSchema,
  },
  async (input) => {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.error("ERROR: RESEND_API_KEY is missing!");
        return {
          success: false,
          message: "সার্ভার কনফিগারেশন ত্রুটি: RESEND_API_KEY সেট করা নেই।"
        };
      }

      const resend = new Resend(apiKey);

      const { error } = await resend.emails.send({
        from: 'CinemaStream <onboarding@resend.dev>',
        to: input.email,
        subject: 'CinemaStream - ইমেইল ভেরিফিকেশন লিঙ্ক',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1; text-align: center;">সিনেমা স্ট্রিমে স্বাগতম, ${input.name}!</h2>
            <p>আপনার অ্যাকাউন্টটি ভেরিফাই করার জন্য নিচের বাটনে ক্লিক করুন:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${input.verificationLink}" style="background-color: #6366f1; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">অ্যাকাউন্ট ভেরিফাই করুন</a>
            </div>
            <p style="font-size: 14px; color: #666; text-align: center;">বা নিচের লিঙ্কটি কপি করে ব্রাউজারে পেস্ট করুন:</p>
            <p style="font-size: 12px; color: #6366f1; word-break: break-all; text-align: center;">${input.verificationLink}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">যদি আপনি এই অনুরোধ না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন।</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend API Error:", error);
        
        // DEV ONLY: Bypass Resend restrictions in development to allow testing with other emails
        const isResendRestriction = error.message && (
          error.message.includes("testing emails") || 
          error.message.includes("domain") || 
          error.message.includes("verify")
        );
        if (isResendRestriction) {
          console.warn(`\n==================================================\n[DEV FALLBACK] Resend restriction hit.\nTarget Email: ${input.email}\nVerification Link: ${input.verificationLink}\n==================================================\n`);
          return {
            success: true,
            message: "ভেরিফিকেশন লিঙ্ক পাঠানো হয়েছে। (ডেভ মোড: লিঙ্কটি সার্ভার কনসোলে প্রিন্ট করা হয়েছে)"
          };
        }

        return { success: false, message: `ইমেইল পাঠানো সম্ভব হয়নি: ${error.message}` };
      }

      return { success: true, message: "আপনার ইমেইলে একটি ভেরিফিকেশন লিঙ্ক পাঠানো হয়েছে।" };
    } catch (err: any) {
      console.error("Unexpected Error:", err);
      return { success: false, message: "একটি অভ্যন্তরীণ সমস্যা হয়েছে।" };
    }
  }
);
