import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/apiAuth";
import { getFirestore } from "firebase-admin/firestore";


type Params = Promise<{ id: string }>;

// GET /api/admin/users/[id] - Get user details
export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(req, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const adminAuth = getFirebaseAdminAuth();
    const fbUser = await adminAuth.getUser(id);
    
    const db = await connectToDatabase();
    const dbUser = await db.collection("users").findOne({
      $or: [{ uid: id }, { firebaseUid: id }, { id: id }, { _id: id as any }]
    });

    return NextResponse.json({
      uid: fbUser.uid,
      email: fbUser.email,
      role: dbUser?.role || "guest",
      status: dbUser?.status || "Terverifikasi",
    });
  } catch (error: any) {
    console.error("Error getting user:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/users/[id] - Update user

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(req, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const { email, role, password } = await req.json();

    const adminAuth = getFirebaseAdminAuth();

    // 1. Update in Firebase Auth
    const fbUpdateData: any = {};
    if (email) fbUpdateData.email = email;
    if (password) fbUpdateData.password = password;

    if (Object.keys(fbUpdateData).length > 0) {
      await adminAuth.updateUser(id, fbUpdateData);
    }

    // 2. Update in MongoDB (with upsert to handle users registered on client-side)
    const db = await connectToDatabase();
    const dbUpdateData: any = { updatedAt: new Date() };
    if (email) dbUpdateData.email = email;
    if (role) dbUpdateData.role = role;

    await db.collection("users").updateOne(
      { $or: [{ uid: id }, { firebaseUid: id }, { id: id }, { _id: id as any }] },
      { 
        $set: dbUpdateData,
        $setOnInsert: {
          uid: id,
          firebaseUid: id,
          createdAt: new Date(),
          status: "Terverifikasi"
        }
      },
      { upsert: true }
    );

    // 3. Update in Firestore
    try {
      const adminDb = getFirestore(adminAuth.app);
      const fsUpdateData: any = { updatedAt: new Date().toISOString() };
      if (email) fsUpdateData.email = email;
      if (role) fsUpdateData.role = role;
      
      await adminDb.collection("users").doc(id).set(fsUpdateData, { merge: true });
    } catch (fsError) {
      console.error("Firestore sync update failed:", fsError);
    }

    return NextResponse.json({ message: "User updated successfully" });

  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(req, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const adminAuth = getFirebaseAdminAuth();

    // 1. Delete from Firebase Auth
    try {
        await adminAuth.deleteUser(id);
    } catch (fbError: any) {
        if (fbError.code !== 'auth/user-not-found') {
            throw fbError;
        }
    }

    // 1.1 Delete from Firestore
    try {
      const adminDb = getFirestore(adminAuth.app);
      await adminDb.collection("users").doc(id).delete();
    } catch (fsError) {
      console.error("Firestore sync delete failed:", fsError);
    }

    // 2. Delete from MongoDB

    const db = await connectToDatabase();
    
    const user = await db.collection("users").findOne({
      $or: [{ uid: id }, { firebaseUid: id }, { id: id }, { _id: id as any }]
    });

    if (user) {
      if (user.role === "village") {
        await db.collection("villages").deleteOne({ 
           $or: [{ userId: id }, { _id: id as any }, { id: id }] 
        });
      } else if (user.role === "innovator") {
        await db.collection("innovators").deleteOne({ 
           $or: [{ userId: id }, { _id: id as any }, { id: id }] 
        });
      }
    }

    await db.collection("users").deleteOne({
      $or: [{ uid: id }, { firebaseUid: id }, { id: id }, { _id: id as any }]
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
