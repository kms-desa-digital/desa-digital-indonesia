import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

// Definisikan tipe untuk params sebagai Promise (aturan baru Next.js App Router)
type RouteParams = {
  params: Promise<{ id: string }>
}

// =========================================================
// GET /api/innovators/[id]
// Detail satu inovator, id bisa berupa _id (ObjectId) atau userId (string)
// =========================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const db = await connectToDatabase()
    
    // AWAIT params sebelum diekstrak id-nya
    const resolvedParams = await params
    const id = resolvedParams.id

    // Jangan lakukan new ObjectId di luar try-catch
    let query: any;
    try {
        query = { _id: new ObjectId(id) }
    } catch (e) {
        query = { userId: id } // Jika bukan ObjectId, cari by userId
    }

    const innovator = await db.collection('innovators').findOne(query)

    if (!innovator) {
        // Fallback: Check if it's userId format
        const byUserId = await db.collection('innovators').findOne({ userId: id })
        if (!byUserId) {
            return NextResponse.json({ message: 'Innovator not found' }, { status: 404 })
        }
        return NextResponse.json({ data: { ...byUserId, id: byUserId._id.toString() } }, { status: 200 })
    }

    return NextResponse.json({ data: { ...innovator, id: innovator._id.toString() } }, { status: 200 })
  } catch (error) {
    console.error('Error fetching innovator detail:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// PUT /api/innovators/[id]
// Mengupdate profil inovator
// =========================================================
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const db = await connectToDatabase()
    
    // AWAIT params
    const resolvedParams = await params
    const id = resolvedParams.id
    
    const body = await request.json()

    // Aman di dalam try-catch
    let query: any;
    try {
        query = { _id: new ObjectId(id) }
    } catch (e) {
        query = { userId: id }
    }

    const res = await db.collection('innovators').updateOne(
      query,
      { $set: { ...body, editedAt: new Date() } }
    )

    if (res.matchedCount === 0) {
      return NextResponse.json({ message: 'Innovator not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Profil inovator berhasil diupdate' }, { status: 200 })
  } catch (error) {
    console.error('Error updating innovator:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// DELETE /api/innovators/[id]
// Menghapus profil inovator
// =========================================================
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const db = await connectToDatabase()
    
    // AWAIT params
    const resolvedParams = await params
    const id = resolvedParams.id

    // Aman di dalam try-catch
    let query: any;
    try {
        query = { _id: new ObjectId(id) }
    } catch (e) {
        query = { userId: id }
    }

    const res = await db.collection('innovators').deleteOne(query)

    if (res.deletedCount === 0) {
      return NextResponse.json({ message: 'Innovator not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Profil inovator berhasil dihapus' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting innovator:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}