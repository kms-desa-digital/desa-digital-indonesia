import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["kementerian", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const db = await connectToDatabase()

    const [
      totalVillages,
      verifiedVillages,
      totalInnovations,
      verifiedInnovations,
      totalInnovators,
      verifiedInnovators,
      totalUsers,
    ] = await Promise.all([
      db.collection('villages').countDocuments(),
      db.collection('villages').countDocuments({ status: 'Terverifikasi' }),
      db.collection('innovations').countDocuments(),
      db.collection('innovations').countDocuments({ status: 'Terverifikasi' }),
      db.collection('innovators').countDocuments(),
      db.collection('innovators').countDocuments({ status: 'Terverifikasi' }),
      db.collection('users').countDocuments(),
    ])

    return NextResponse.json(
      {
        dashboard: {
          villages: {
            total: totalVillages,
            verified: verifiedVillages,
          },
          innovations: {
            total: totalInnovations,
            verified: verifiedInnovations,
          },
          innovators: {
            total: totalInnovators,
            verified: verifiedInnovators,
          },
          users: {
            total: totalUsers,
          },
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching ministry dashboard:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
