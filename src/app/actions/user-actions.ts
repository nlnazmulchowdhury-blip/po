'use server';

import { adminAuth, adminDb } from '@/firebase/admin';

/**
 * Server action to make a user an Admin.
 */
export async function makeUserAdmin(userId: string) {
  try {
    // 1. Update Firestore user document
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      role: 'admin',
      isAdminAccount: true,
      accountType: 'administrator',
      updatedAt: new Date()
    });

    // 2. Set Firebase Auth Custom Claims (optional but extremely professional)
    await adminAuth.setCustomUserClaims(userId, { admin: true });

    return { success: true, message: "ইউজারকে সফলভাবে অ্যাডমিন করা হয়েছে।" };
  } catch (error: any) {
    console.error("Error making user admin:", error);
    return { success: false, error: error.message || "অ্যাডমিন করতে ব্যর্থ হয়েছে।" };
  }
}

/**
 * Server action to remove Admin role from a user.
 */
export async function removeAdminRole(userId: string) {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      role: 'user',
      isAdminAccount: false,
      accountType: 'user',
      updatedAt: new Date()
    });

    // Remove Custom Claims
    await adminAuth.setCustomUserClaims(userId, { admin: false });

    return { success: true, message: "অ্যাডমিন রোল সফলভাবে রিমুভ করা হয়েছে।" };
  } catch (error: any) {
    console.error("Error removing admin role:", error);
    return { success: false, error: error.message || "রোল পরিবর্তন করতে ব্যর্থ হয়েছে।" };
  }
}

/**
 * Server action to Ban or Unban a user.
 */
export async function banUser(userId: string, isBanned: boolean) {
  try {
    // 1. Update status in Firestore
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      status: isBanned ? 'banned' : 'active',
      updatedAt: new Date()
    });

    // 2. Enable/Disable in Firebase Auth
    // This physically blocks them from logging in or using their session!
    await adminAuth.updateUser(userId, {
      disabled: isBanned
    });

    return { 
      success: true, 
      message: isBanned ? "ইউজারকে সফলভাবে ব্যান করা হয়েছে।" : "ইউজারকে সফলভাবে আনব্যান করা হয়েছে।" 
    };
  } catch (error: any) {
    console.error("Error banning user:", error);
    return { success: false, error: error.message || "ব্যান স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।" };
  }
}

/**
 * Server action to completely Delete a user account (Firestore + Auth).
 */
export async function deleteUserAccount(userId: string) {
  try {
    // 1. Delete user document from Firestore
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.delete();

    // 2. Delete user account from Firebase Auth
    try {
      await adminAuth.deleteUser(userId);
    } catch (authErr: any) {
      // If the user doesn't exist in Auth anymore, suppress error
      if (authErr.code !== 'auth/user-not-found') {
        throw authErr;
      }
    }

    return { success: true, message: "ইউজার অ্যাকাউন্টটি সম্পূর্ণ ডিলিট করা হয়েছে।" };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message || "ইউজার ডিলিট করতে ব্যর্থ হয়েছে।" };
  }
}
