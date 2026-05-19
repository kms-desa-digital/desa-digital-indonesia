import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()

    // 1. Hitung jumlah desa yang valid sesuai dengan logika Firestore sebelumnya:
    // data.namaDesa && data.namaDesa.length > 1 && (data.jumlahInovasi !== 0 || data.jumlahInovasiDiterapkan !== 0)
    const totalVillage = await db.collection('villages').countDocuments({
      namaDesa: { $exists: true, $ne: "" },
      $expr: { $gt: [{ $strLenCP: { $ifNull: ["$namaDesa", ""] } }, 1] },
      $or: [
        { jumlahInovasi: { $exists: true, $ne: 0 } },
        { jumlahInovasiDiterapkan: { $exists: true, $ne: 0 } }
      ]
    })

    // 2. Hitung jumlah inovator
    const totalInnovators = await db.collection('innovators').countDocuments()

    return NextResponse.json({
      totalVillage,
      totalInnovators
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    })
  } catch (error) {
    console.error('Error fetching system stats:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
