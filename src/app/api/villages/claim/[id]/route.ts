import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

type Params = Promise<{ id: string }>

// =========================================================
// GET /api/villages/claim/[id]
// Mengambil detail sebuah klaim inovasi
// =========================================================
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(_request, ["village", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params
    const db = await connectToDatabase()
    
    // Try finding by ObjectId first, then by string _id (migrated data), then by 'id' field
    let claim = null;
    if (ObjectId.isValid(id)) {
      claim = await db.collection('claimInnovations').findOne({ _id: new ObjectId(id) })
    }
    
    if (!claim) {
      claim = await db.collection('claimInnovations').findOne({ _id: id as any })
    }

    if (!claim) {
      claim = await db.collection('claimInnovations').findOne({ id: id as any })
    }

    if (!claim) {
      return NextResponse.json({ message: 'Klaim tidak ditemukan' }, { status: 404 })
    }

    return new NextResponse(
      JSON.stringify({ 
        data: { ...claim, id: claim._id.toString(), _id: claim._id.toString() } 
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error fetching claim detail:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// PUT /api/villages/claim/[id] (Untuk Verifikasi/Update)
// =========================================================
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["village", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params
    const body = await request.json()
    const db = await connectToDatabase()

    let query: any = {}
    if (ObjectId.isValid(id)) {
        query._id = new ObjectId(id)
    } else {
        query = { $or: [{ _id: id as any }, { id: id as any }] }
    }

    const updateData: any = { ...body, updatedAt: new Date() }
    delete updateData._id
    delete updateData.id

    const result = await db.collection('claimInnovations').updateOne(
      query,
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Klaim tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Klaim berhasil diperbarui' })

  } catch (error) {
    console.error('Error updating claim:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
