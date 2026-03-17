import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

type Params = Promise<{ id: string }>

// =========================================================
// GET /api/villages/[id]/innovations
// Mengambil daftar inovasi yang telah diterapkan oleh desa tertentu
// =========================================================
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const db = await connectToDatabase()

    // Cari inovasi di mana id desa tersebut ada dalam array desaId
    // Kita filter juga status inovasi yang 'Terverifikasi'
    const innovations = await db.collection('innovations')
      .find({
        desaId: { $in: [id] },
        status: 'Terverifikasi'
      })
      .sort({ createdAt: -1 })
      .toArray()

    const result = innovations.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }))

    return new NextResponse(
      JSON.stringify({ innovations: result, total: result.length }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error fetching village innovations:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
