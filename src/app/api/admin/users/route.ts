import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/apiAuth";
import { getFirestore } from "firebase-admin/firestore";


// GET /api/admin/users - List all users
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const roleFilter = searchParams.get("role");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");

    const adminAuth = getFirebaseAdminAuth();
    const listUsersResult = await adminAuth.listUsers(1000);
    
    const db = await connectToDatabase();
    const usersInDb = await db.collection("users").find({}).toArray();

    // Map Firebase users with MongoDB roles
    let users = listUsersResult.users.map((fbUser) => {
      const dbUser = usersInDb.find(u => u.uid === fbUser.uid || u.firebaseUid === fbUser.uid || String(u._id) === fbUser.uid);

      return {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        role: dbUser?.role || "guest",
        status: dbUser?.status || "Terverifikasi",
        createdAt: fbUser.metadata.creationTime,
      };
    });

    // Apply filters
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(u => u.email?.toLowerCase().includes(s) || u.displayName?.toLowerCase().includes(s));
    }

    if (roleFilter && roleFilter !== "all") {
      users = users.filter(u => u.role === roleFilter);
    }

    const total = users.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return NextResponse.json({ 
      users: paginatedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error: any) {
    console.error("Error listing users:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const adminAuth = getFirebaseAdminAuth();
    
    // 1. Create in Firebase Auth
    const fbUser = await adminAuth.createUser({
      email,
      password,
      emailVerified: true,
    });

    // 2. Create in MongoDB
    const db = await connectToDatabase();
    await db.collection("users").insertOne({
      uid: fbUser.uid,
      firebaseUid: fbUser.uid,
      email,
      role,
      status: "Terverifikasi",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. Create in Firestore (for client-side login compatibility)
    try {
      const adminDb = getFirestore(adminAuth.app);
      await adminDb.collection("users").doc(fbUser.uid).set({
        uid: fbUser.uid,
        email,
        role,
        status: "Terverifikasi",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (firestoreError) {
      console.error("Failed to sync to Firestore:", firestoreError);
      // We don't fail the whole request if only Firestore sync fails, 
      // but it's important for the current login flow.
    }

    return NextResponse.json({ 
      message: "User created successfully",
      user: { uid: fbUser.uid, email, role }
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
