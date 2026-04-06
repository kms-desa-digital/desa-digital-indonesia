import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'

// GET /api/innovator
// Ambil semua profil inovator.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const kategori = searchParams.get('kategori')

    const db = await connectToDatabase()
    const filter: any = {}

    if (status) filter.status = status
    if (kategori) filter.kategori = kategori

    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.namaInovator = { $regex: escapedSearch, $options: 'i' }
    }

    const innovators = await db
      .collection('innovators')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    const result = innovators.map((doc) => ({
      ...doc,
      id: doc._id?.toString ? doc._id.toString() : doc._id,
      _id: doc._id?.toString ? doc._id.toString() : doc._id,
    }))

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    console.error('Error fetching innovators:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
