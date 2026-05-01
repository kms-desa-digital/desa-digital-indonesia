import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const db = await connectToDatabase()

    // Cari user dengan aman (menghindari error jika auth.uid adalah Firebase UID)
    let userQuery: any = { 
      $or: [
        { firebaseUid: auth.uid }, 
        { uid: auth.uid }, 
        { id: auth.uid },
        { _id: auth.uid }
      ] 
    };

    if (ObjectId.isValid(auth.uid)) {
      try {
        userQuery.$or.push({ _id: new ObjectId(auth.uid) });
      } catch (e) {
        // Abaikan jika ternyata gagal diparsing sebagai ObjectId
      }
    }

    const user = await db.collection('users').findOne(userQuery)

    if (!user) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    // Ambil data dashboard
    const totalUsers = await db.collection('users').countDocuments()
    const totalInnovations = await db.collection('innovations').countDocuments()
    const totalVillages = await db.collection('villages').countDocuments()
    const totalInnovators = await db.collection('innovators').countDocuments()

    // Data lainnya bisa ditambahkan sesuai kebutuhan

    return NextResponse.json({
      totalUsers,
      totalInnovations,
      totalVillages,
      totalInnovators
    })
  } catch (error) {
    console.error('Error fetching admin dashboard:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}