import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

type Params = Promise<{ id: string }>

// =========================================================
// GET /api/villages/[id]
// Mengambil detail profile desa (berdasarkan _id atau userId)
// =========================================================
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const db = await connectToDatabase()

    // Cari berdasarkan _id (ObjectId) atau userId (string)
    const query: any = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { userId: id }] }
      : { userId: id }

    const village = await db.collection('villages').findOne(query)

    if (!village) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 })
    }

    return new NextResponse(
      JSON.stringify({ 
        village: { ...village, id: village._id.toString(), _id: village._id.toString() } 
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error fetching village detail:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// PUT /api/villages/[id]
// Mengupdate profile desa
// =========================================================
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Jangan izinkan ubah field sensitif secara langsung
    delete body._id
    delete body.userId
    delete body.catatanAdmin
    
    body.updatedAt = new Date()

    const db = await connectToDatabase()
    
    const query: any = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { userId: id }] }
      : { userId: id }

    const result = await db.collection('villages').updateOne(
      query,
      { $set: body }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 })
    }

    return new NextResponse(
      JSON.stringify({ message: 'Profil desa berhasil diperbarui' }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error updating village profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// DELETE /api/villages/[id]
// Menghapus profile desa
// =========================================================
export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const db = await connectToDatabase()

    const query: any = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { userId: id }] }
      : { userId: id }

    const result = await db.collection('villages').deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 })
    }

    return new NextResponse(
      JSON.stringify({ message: 'Profil desa berhasil dihapus' }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error deleting village profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
