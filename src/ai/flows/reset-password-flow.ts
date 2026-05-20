'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminAuth, adminDb } from '@/firebase/admin';

const ResetPasswordInputSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(6),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

const ResetPasswordOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ResetPasswordOutput = z.infer<typeof ResetPasswordOutputSchema>;

export async function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
  return resetPasswordFlow(input);
}

const resetPasswordFlow = ai.defineFlow(
  {
    name: 'resetPasswordFlow',
    inputSchema: ResetPasswordInputSchema,
    outputSchema: ResetPasswordOutputSchema,
  },
  async (input) => {
    try {
      if (!process.env.FIREBASE_PRIVATE_KEY) {
         console.warn("FIREBASE_PRIVATE_KEY is not set. Firebase Admin cannot update passwords.");
         return { success: false, message: "সার্ভার কনফিগারেশন এরর: Firebase Admin setup incomplete." };
      }

      // 1. Verify OTP in Firestore
      const snapshot = await adminDb.collection('passwordResets')
        .where('email', '==', input.email)
        .where('otp', '==', input.otp)
        .where('used', '==', false)
        .get();

      if (snapshot.empty) {
        return { success: false, message: 'ভুল ওটিপি কোড। দয়া করে আপনার ইমেইল চেক করুন।' };
      }

      const validDoc = snapshot.docs.find(d => new Date(d.data().expiresAt) > new Date());
      if (!validDoc) {
        return { success: false, message: 'ওটিপি কোডটির মেয়াদ শেষ হয়ে গেছে। আবার ওটিপি পাঠান।' };
      }

      // 2. Look up user by email
      const userRecord = await adminAuth.getUserByEmail(input.email);

      // 3. Update password
      await adminAuth.updateUser(userRecord.uid, {
        password: input.newPassword,
      });

      // 4. Mark OTP as used (delete it)
      await adminDb.collection('passwordResets').doc(validDoc.id).delete();

      return { success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।' };
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
         return { success: false, message: 'এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।' };
      }
      return { success: false, message: 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' };
    }
  }
);
