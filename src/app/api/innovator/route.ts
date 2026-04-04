import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'

// GET /api/innovator
// Ambil semua profil inovator.
export async function GET() {
  try {
    const db = await connectToDatabase()
    const innovators = await db
      .collection('innovators')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    const result = innovators.map((doc) => ({
      ...doc,
      id: doc._id?.toString ? doc._id.toString() : doc._id,
      _id: doc._id?.toString ? doc._id.toString() : doc._id,
    }))

    return NextResponse.json({ innovators: result }, { status: 200 })
  } catch (error) {
    console.error('Error fetching innovators:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
