import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

type Params = Promise<{ id: string }>

// =========================================================
// GET /api/innovations/[id]
// Ambil detail satu inovasi berdasarkan MongoDB ObjectId
// =========================================================
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const db = await connectToDatabase()
    
    // Gunakan try-catch alih-alih ObjectId.isValid
    let query: any;
    try {
      query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
    } catch (e) {
      query = { _id: id }
    }

    const doc = await db.collection('innovations').findOne(query)

    if (!doc) {
      return NextResponse.json({ message: 'Inovasi tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(
      { innovation: { ...doc, id: doc._id.toString(), _id: doc._id.toString() } },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching innovation:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// PUT /api/innovations/[id]
// Edit inovasi berdasarkan id
// Body: field apa saja yang ingin diupdate (partial update)
// Catatan: field `status` (verifikasi admin) tidak bisa diubah
//         oleh user melalui endpoint ini — gunakan admin endpoint
// =========================================================
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Field yang TIDAK boleh diubah oleh user (dikelola admin)
    const protectedFields = ['status', 'catatanAdmin', 'createdAt', '_id']
    protectedFields.forEach((field) => delete body[field])

    // Selalu update editedAt
    body.editedAt = new Date()

    const db = await connectToDatabase()
    
    // Gunakan try-catch
    let query: any;
    try {
      query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
    } catch (e) {
      query = { _id: id }
    }

    // Cek apakah inovasi ada
    const existing = await db.collection('innovations').findOne(query)
    if (!existing) {
      return NextResponse.json({ message: 'Inovasi tidak ditemukan' }, { status: 404 })
    }

    // Jika status sebelumnya "Ditolak", reset ke "Menunggu" saat diedit ulang
    if (existing.status === 'Ditolak') {
      body.status = 'Menunggu'
      body.catatanAdmin = null
    }

    const result = await db.collection('innovations').updateOne(
      { _id: existing._id }, // Gunakan _id yang ditemukan (baik ObjectId maupun string)
      { $set: body }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Inovasi tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(
      { message: 'Inovasi berhasil diperbarui' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating innovation:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// DELETE /api/innovations/[id]
// Hapus inovasi
// =========================================================
export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const db = await connectToDatabase()
    
    // Gunakan try-catch
    let query: any;
    try {
      query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
    } catch (e) {
      query = { _id: id }
    }

    const result = await db.collection('innovations').deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Inovasi tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Inovasi berhasil dihapus' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting innovation:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}