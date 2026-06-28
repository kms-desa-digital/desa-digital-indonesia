import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { connectToDatabase } from "@/lib/db/mongodb";
import { getCachedData, setCachedData } from "@/lib/utils/cache";

const VALID_ROLES = ["admin", "kementerian", "innovator", "village", "guest", "ministry"] as const;
export type ValidRole = (typeof VALID_ROLES)[number];

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
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email || null;

    if (!uid) {
      return { uid: null, role: "guest", email: null };
    }

    // Check Redis cache first
    const cacheKey = `cache:user:role:${uid}`;
    const cached = await getCachedData<{ role: ValidRole; email: string | null }>(cacheKey);
    if (cached) {
      return { uid, role: cached.role, email: cached.email };
    }

    let role: ValidRole = "guest";
    let foundRole = false;

    // 1. Try MongoDB first
    try {
      const  db  = await connectToDatabase(); // ✅ properly initialize db
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

    // 2. Fallback to Firestore if MongoDB didn't find the role
    if (!foundRole) {
      try {
        const firestore = getFirebaseAdminFirestore(); // ✅ use one consistent method
        const userDoc = await firestore.collection("users").doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          role = sanitizeRole(userData?.role);
        }
      } catch (firestoreError) {
        console.error("[verifyRoleFromToken] Firestore lookup failed:", firestoreError);
      }
    }

    // Cache the resolved role for 1 hour (3600 seconds)
    await setCachedData(cacheKey, { role, email }, 3600);

    return { uid, role, email };
  } catch (error: any) {
    if (error?.code === "auth/id-token-expired") {
      console.warn("[verifyRoleFromToken] Token expired");
    } else if (error?.message?.includes("Firebase Admin credentials")) {
      console.warn("[verifyRoleFromToken] Firebase Admin not configured, falling back to guest");
    } else {
      console.error("[verifyRoleFromToken] Token verification failed:", error?.message ?? error);
    }

    return { uid: null, role: "guest", email: null };
  }
}

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