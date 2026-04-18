// ==================================================================
// Server-side Role Verification via Firebase ID Token
// ==================================================================
// Menggantikan pola lama di mana client mengirim `role` di body request.
// Sekarang role diverifikasi dari Firebase ID Token yang dikirim di
// header Authorization, kemudian di-crosscheck ke Firestore/MongoDB.

import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { connectToDatabase } from "@/lib/db/mongodb";

const VALID_ROLES = ["admin", "kementerian", "innovator", "village", "guest"] as const;
export type ValidRole = (typeof VALID_ROLES)[number];

/**
 * Verifikasi role pengguna dari Firebase ID Token.
 *
 * Alur:
 * 1. Decode & verifikasi token via Firebase Admin SDK
 * 2. Ambil role dari Firestore collection "users" berdasarkan UID
 * 3. Fallback ke MongoDB jika Firestore tidak tersedia
 * 4. Sanitize role — tolak nilai tidak valid, default ke "guest"
 *
 * @param authHeader - Header Authorization (format: "Bearer <idToken>")
 * @returns Object berisi uid dan role yang sudah terverifikasi
 */

export async function verifyRoleFromToken(
  authHeader: string | null
): Promise<{ uid: string | null; role: ValidRole }> {
  // Jika tidak ada token, return guest
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { uid: null, role: "guest" };
  }

  const idToken = authHeader.replace("Bearer ", "").trim();
  if (!idToken) {
    return { uid: null, role: "guest" };
  }

  try {
    // Verifikasi token via Firebase Admin SDK
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (!uid) {
      return { uid: null, role: "guest" };
    }

    // First try Firestore, because Firebase auth now stores user role there.
    // If Firestore is unavailable or the role is missing, fall back to MongoDB.
    let role: ValidRole = "guest";

    try {
      const firestore = getFirebaseAdminFirestore();
      const userDoc = await firestore.collection("users").doc(uid).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData && typeof userData.role === "string") {
          role = sanitizeRole(userData.role);
        }
      }
    } catch (firestoreError) {
      console.error("[verifyRoleFromToken] Firestore lookup failed:", firestoreError);
    }

    if (role === "guest") {
      try {
        const db = await connectToDatabase();

        const user = await db.collection("users").findOne({
          $or: [{ uid: uid }, { firebaseUid: uid }, { _id: uid as any }],
        });

        if (user && typeof user.role === "string") {
          role = sanitizeRole(user.role);
        }
      } catch (dbError) {
        console.error("[verifyRoleFromToken] MongoDB lookup failed:", dbError);
      }
    }

    return { uid, role };
  } catch (error: any) {
    // Token expired, invalid, atau Firebase Admin belum dikonfigurasi
    if (error?.code === "auth/id-token-expired") {
      console.warn("[verifyRoleFromToken] Token expired");
    } else if (error?.message?.includes("Firebase Admin credentials")) {
      console.warn(
        "[verifyRoleFromToken] Firebase Admin tidak dikonfigurasi, fallback ke guest"
      );
    } else {
      console.error("[verifyRoleFromToken] Token verification failed:", error?.message ?? error);
    }

    return { uid: null, role: "guest" };
  }
}

// Sanitize role hanya terima nilai yang valid
export function sanitizeRole(rawRole: unknown): ValidRole {
  if (
    typeof rawRole === "string" &&
    VALID_ROLES.includes(rawRole.toLowerCase() as ValidRole)
  ) {
    return rawRole.toLowerCase() as ValidRole;
  }
  return "guest";
}
