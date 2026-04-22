import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["innovator", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const db = await connectToDatabase()

    // Cari user dan cek role innovator
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(auth.uid) }
    )

    if (!user) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    // Ambil data innovator
    const innovator = await db.collection('innovators').findOne(
      { userId: user._id.toString() },
      { projection: { userId: 0 } } // exclude userId
    )

    if (!innovator) {
      return NextResponse.json({ message: 'Innovator profile not found' }, { status: 404 })
    }

    // Hitung inovasi milik innovator ini
    const totalInnovations = await db.collection('innovations').countDocuments({
      innovatorId: user._id.toString()
    })

    // Hitung inovasi berdasarkan status
    const verifiedInnovations = await db.collection('innovations').countDocuments({
      innovatorId: user._id.toString(),
      status: 'Terverifikasi'
    })

    const pendingInnovations = await db.collection('innovations').countDocuments({
      innovatorId: user._id.toString(),
      status: 'Menunggu'
    })

    const rejectedInnovations = await db.collection('innovations').countDocuments({
      innovatorId: user._id.toString(),
      status: 'Ditolak'
    })

    return NextResponse.json({
      innovator,
      totalInnovations,
      verifiedInnovations,
      pendingInnovations,
      rejectedInnovations
    })
  } catch (error) {
    console.error('Error fetching innovator dashboard:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}