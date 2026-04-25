import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { createNotification } from '@/services/notificationServices'

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

    const claim = await db.collection('claimInnovations').findOne(query)
    if (!claim) {
      return NextResponse.json({ message: 'Klaim tidak ditemukan' }, { status: 404 })
    }

    const isAdmin = auth.role === 'admin'

    const updateData: any = { ...body, updatedAt: new Date() }
    delete updateData._id
    delete updateData.id

    // Non-admin tidak boleh mengubah status verifikasi
    if (!isAdmin) {
      delete updateData.status
      delete updateData.catatanAdmin
    }

    const nextStatus = updateData.status || body.status
    const nextCatatanAdmin = updateData.catatanAdmin || body.catatanAdmin || null

    const result = await db.collection('claimInnovations').updateOne(
      query,
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Klaim tidak ditemukan' }, { status: 404 })
    }

    // Kirim notifikasi jika admin mengubah status verifikasi
    try {
      if (isAdmin && nextStatus && nextStatus !== claim?.status) {
        const villageId = claim.desaId
        if (villageId) {
          const notifTitle = nextStatus === 'Terverifikasi'
            ? 'Klaim Inovasi Disetujui!'
            : 'Klaim Inovasi Ditolak'
          const notifDescription = nextStatus === 'Terverifikasi'
            ? `Selamat! Klaim Anda untuk "${claim.namaInovasi}" telah disetujui oleh admin.`
            : `Klaim Anda untuk "${claim.namaInovasi}" ditolak. Alasan: ${nextCatatanAdmin || claim.catatanAdmin || 'Tidak ada catatan'}`

          await createNotification({
            userId: villageId,
            type: 'personal',
            title: notifTitle,
            description: notifDescription,
            actionType: 'claim_detail',
            relatedId: claim._id.toString(),
          })
        }
      }
    } catch (notifError) {
      console.error('Error creating claim update notification:', notifError)
    }

    return NextResponse.json({ message: 'Klaim berhasil diperbarui' })

  } catch (error) {
    console.error('Error updating claim:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// DELETE /api/villages/claim/[id]
// =========================================================
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["village", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params
    const db = await connectToDatabase()

    let query: any = {}
    if (ObjectId.isValid(id)) {
        query._id = new ObjectId(id)
    } else {
        query = { $or: [{ _id: id as any }, { id: id as any }] }
    }

    const claim = await db.collection('claimInnovations').findOne(query)
    if (!claim) {
      return NextResponse.json({ message: 'Klaim tidak ditemukan' }, { status: 404 })
    }

    // Only owner or admin can delete
    if (auth.role !== 'admin' && claim.desaId !== auth.uid) {
        return NextResponse.json({ message: 'Tidak memiliki izin' }, { status: 403 })
    }

    const result = await db.collection('claimInnovations').deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Gagal menghapus klaim' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Klaim berhasil dihapus' })

  } catch (error) {
    console.error('Error deleting claim:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
