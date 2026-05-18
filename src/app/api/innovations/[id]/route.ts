import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { createNotification, notifyAllAdmins } from '@/services/notificationServices'

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

    const pipeline: any[] = [
      { $match: query },
      {
        $addFields: {
          _idStr: { $toString: "$_id" }
        }
      },
      {
        $lookup: {
          from: 'claimInnovations',
          localField: '_idStr',
          foreignField: 'inovasiId',
          as: 'allClaims',
        },
      },
      {
        $addFields: {
          jumlahDesa: {
            $size: {
              $filter: {
                input: '$allClaims',
                as: 'claim',
                cond: { $eq: ['$$claim.status', 'Terverifikasi'] },
              },
            },
          },
        },
      },
      { $project: { allClaims: 0, _idStr: 0 } }
    ]

    const innovations = await db.collection('innovations').aggregate(pipeline).toArray()
    const doc = innovations[0]

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
    const auth = await requireRole(request, ["innovator", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params
    const body = await request.json()

    const isAdmin = auth.role === 'admin'

    // Field yang TIDAK boleh diubah oleh user biasa
    const protectedFields = isAdmin
      ? ['createdAt', '_id']
      : ['status', 'catatanAdmin', 'createdAt', '_id']
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

    // Jika inovasi diedit ulang oleh pemilik dan status sebelumnya bukan Menunggu, reset ke Menunggu
    const isResubmission = !isAdmin && existing.status !== 'Menunggu'
    if (isResubmission) {
      body.status = 'Menunggu'
      body.catatanAdmin = null
    }

    if (!isAdmin) {
      body.createdAt = new Date()
    }

    const result = await db.collection('innovations').updateOne(
      { _id: existing._id }, // Gunakan _id yang ditemukan (baik ObjectId maupun string)
      { $set: body }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Inovasi tidak ditemukan' }, { status: 404 })
    }

    // Kirim notifikasi
    try {
      // 1. Jika admin mengubah status verifikasi → notif ke innovator
      if (isAdmin && body.status && body.status !== existing.status) {
        const innovatorId = existing.innovatorId || existing.userId
        if (innovatorId) {
          const notifTitle = body.status === 'Terverifikasi'
            ? 'Inovasi Disetujui!'
            : 'Inovasi Ditolak'
          const notifDescription = body.status === 'Terverifikasi'
            ? `Selamat! Inovasi "${existing.namaInovasi}" telah disetujui oleh admin.`
            : `Inovasi "${existing.namaInovasi}" ditolak. Alasan: ${body.catatanAdmin || existing.catatanAdmin || 'Tidak ada catatan'}`

          await createNotification({
            userId: innovatorId,
            type: 'personal',
            title: notifTitle,
            description: notifDescription,
            actionType: 'innovation_detail',
            relatedId: existing._id.toString(),
          })
        }
      }

      // 2. Jika innovator mengajukan ulang inovasi yang ditolak → notif ke admin
      if (isResubmission) {
        await notifyAllAdmins({
          type: 'personal',
          category: 'innovation_submission',
          title: `Pengajuan Ulang Inovasi: ${existing.namaInovasi}`,
          description: `Innovator ${existing.namaInovator || 'unknown'} telah memperbarui inovasi "${existing.namaInovasi}". Silakan verifikasi kembali.`,
          actionType: 'innovation_detail',
          relatedId: existing._id.toString(),
        })
      }
    } catch (notifError) {
      console.error('Error creating innovation update notification:', notifError)
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
    const auth = await requireRole(_request, ["innovator", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params
    const db = await connectToDatabase()
    
    // Define query to find innovation by ObjectId or string ID
    let query: any;
    try {
      query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
    } catch (e) {
      query = { _id: id }
    }

    // 1. Find the innovation to ensure it exists and get its ID as string
    const existing = await db.collection('innovations').findOne(query)
    if (!existing) {
      return NextResponse.json({ message: 'Inovasi tidak ditemukan' }, { status: 404 })
    }

    const inovasiIdStr = existing._id.toString()

    // 2. Handle associated claims cleanup
    try {
        // Find verified claims to decrement village counts
        const verifiedClaims = await db.collection('claimInnovations').find({
            inovasiId: inovasiIdStr,
            status: 'Terverifikasi'
        }).toArray()

        if (verifiedClaims.length > 0) {
            // Group by desaId to handle multiple claims from same village (though unlikely for same innovation)
            for (const claim of verifiedClaims) {
                await db.collection('villages').updateOne(
                    { $or: [{ userId: claim.desaId }, { desaId: claim.desaId }] },
                    { $inc: { jumlahInovasiDiterapkan: -1 } }
                ).catch(err => console.error(`Failed to decrement count for village ${claim.desaId}:`, err))
            }
        }

        // Delete all associated claims (Verified, Menunggu, or Ditolak)
        await db.collection('claimInnovations').deleteMany({ inovasiId: inovasiIdStr })
        
    } catch (cleanupErr) {
        console.error('Error during associated claims cleanup:', cleanupErr)
        // We continue deleting the innovation even if cleanup fails
    }

    // 3. Delete the innovation itself
    const result = await db.collection('innovations').deleteOne({ _id: existing._id })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Gagal menghapus inovasi' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Inovasi berhasil dihapus' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting innovation:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}