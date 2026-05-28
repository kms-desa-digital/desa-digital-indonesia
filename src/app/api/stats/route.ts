import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()

    // 1. Hitung semua desa yang terdaftar di database
    const totalVillage = await db.collection('villages').countDocuments()

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
