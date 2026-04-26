// ==================================================================
// Server-side Role Verification via Firebase ID Token
// ==================================================================
// Menggantikan pola lama di mana client mengirim `role` di body request.
// Sekarang role diverifikasi dari Firebase ID Token yang dikirim di
// header Authorization, kemudian di-crosscheck ke Firestore/MongoDB.

import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { connectToDatabase } from "@/lib/db/mongodb";
import { getFirestore } from "firebase-admin/firestore";

const VALID_ROLES = ["admin", "kementerian", "innovator", "village", "guest", "ministry"] as const;
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
): Promise<{ uid: string | null; role: ValidRole; email: string | null }> {
  // Jika tidak ada token, return guest
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { uid: null, role: "guest", email: null };
  }

  const idToken = authHeader.replace("Bearer ", "").trim();
  if (!idToken) {
    return { uid: null, role: "guest", email: null };
  }

  try {
    // Verifikasi token via Firebase Admin SDK
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email || null;

    if (!uid) {
      return { uid: null, role: "guest", email: null };
    }

    // Cari role user di MongoDB terlebih dahulu
    let role: ValidRole = "guest";
    let foundRole = false;

    try {
      const db = await connectToDatabase();

      // Cari berdasarkan Firebase UID
      // Field bisa berupa `uid`, `firebaseUid`, atau langsung `_id`
      const user = await db.collection("users").findOne({
        $or: [{ uid: uid }, { firebaseUid: uid }, { id: uid }, { _id: uid as any }],
      });

      if (user && typeof user.role === "string") {
        role = sanitizeRole(user.role);
        foundRole = role !== "guest";
      }
    } catch (dbError) {
      console.error("[verifyRoleFromToken] MongoDB lookup failed:", dbError);
    }

    // Fallback ke Firestore jika role belum ditemukan di MongoDB
    if (!foundRole) {
      try {
        const adminDb = getFirestore(adminAuth.app);
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          role = sanitizeRole(userData?.role);
        }
      } catch (firestoreError) {
        console.error("[verifyRoleFromToken] Firestore lookup failed:", firestoreError);
      }
    }

    return { uid, role, email };
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

    return { uid: null, role: "guest", email: null };
  }
}

// Sanitize role hanya terima nilai yang valid
export function sanitizeRole(rawRole: unknown): ValidRole {
  if (typeof rawRole === "string") {
    const normalized = rawRole.toLowerCase();
    if (normalized === "ministry") return "kementerian";
    if (VALID_ROLES.includes(normalized as ValidRole)) {
      return normalized as ValidRole;
    }
  }
  return "guest";
}
