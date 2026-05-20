import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

type Params = Promise<{ id: string }>

// =========================================================
// GET /api/villages/[id]
// Mengambil detail profile desa (berdasarkan _id atau userId)
// =========================================================
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const db = await connectToDatabase()

    // Mengecek ObjectId
    let query: any;
    try {
      query = { $or: [{ _id: new ObjectId(id) }, { userId: id }] }
    } catch (e) {
      query = { userId: id }
    }

    const village = await db.collection('villages').findOne(query)

    if (!village) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 })
    }

    // Hitung jumlah inovasi yang benar-benar terverifikasi untuk desa ini
    // Ini membantu jika field static 'jumlahInovasiDiterapkan' belum tersinkronisasi
    const desaId = village.userId || village._id.toString();

    // 1. Count verified MANUAL claims only (to avoid double counting standard innovations)
    const manualClaimCount = await db.collection('claimInnovations').countDocuments({
      desaId: desaId,
      status: 'Terverifikasi',
      $or: [{ inovasiId: null }, { inovasiId: { $exists: false } }]
    });

    // 2. Count standard innovations where this village is in desaId array
    const standardCount = await db.collection('innovations').countDocuments({
      desaId: { $in: [desaId] },
      status: 'Terverifikasi'
    });

    const totalVerified = manualClaimCount + standardCount;

    return NextResponse.json(
      {
        village: {
          ...village,
          id: village._id.toString(),
          _id: village._id.toString(),
          jumlahInovasiDiterapkan: totalVerified
        }
      },
      { status: 200 }
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
    const auth = await requireRole(request, ["village", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const isAdmin = auth.role === 'admin'
    const { id } = await params
    const body = await request.json()

    // Jangan izinkan ubah field sensitif secara langsung
    delete body._id
    delete body.userId
    delete body.catatanAdmin

    body.updatedAt = new Date()

    const db = await connectToDatabase()

    let query: any;
    try {
      query = { $or: [{ _id: new ObjectId(id) }, { userId: id }] }
    } catch (e) {
      query = { userId: id }
    }

    const existing = await db.collection('villages').findOne(query)
    if (!existing) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 })
    }

    // Validasi kepemilikan: Hanya pemilik profil atau admin yang boleh mengedit
    if (!isAdmin && existing.userId !== auth.uid) {
      return NextResponse.json({ message: 'Anda tidak memiliki hak untuk mengubah profil ini' }, { status: 403 })
    }

    // Reset status if resubmitting rejected or verified profile
    const isResubmission = !isAdmin && existing?.status !== 'Menunggu'
    if (isResubmission) {
      body.status = 'Menunggu'
      body.catatanAdmin = null
    }

    if (!isAdmin) {
      body.createdAt = new Date()
    }

    const result = await db.collection('villages').updateOne(
      { _id: existing._id },
      { $set: body }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 })
    }

    // Notify admins about update/resubmission
    try {
      const { notifyAllAdmins } = await import('@/services/notificationServices')
      if (isResubmission) {
        await notifyAllAdmins({
          type: 'personal',
          category: 'village_submission',
          title: `Pengajuan Ulang Profil Desa: ${body.namaDesa || existing.namaDesa}`,
          description: `Desa ${body.namaDesa || existing.namaDesa} telah memperbarui profil yang sebelumnya ditolak. Silakan verifikasi kembali.`,
          actionType: 'profile',
          relatedId: existing.userId || id,
        })
      }
    } catch (notifErr) {
      console.error('Error notifying admins about village profile update:', notifErr)
    }

    return NextResponse.json({ message: 'Profil desa berhasil diperbarui' }, { status: 200 })

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
    const auth = await requireRole(_request, ["village", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const isAdmin = auth.role === 'admin'
    const { id } = await params
    const db = await connectToDatabase()

    let query: any;
    try {
      query = { $or: [{ _id: new ObjectId(id) }, { userId: id }] }
    } catch (e) {
      query = { userId: id }
    }

    const existing = await db.collection('villages').findOne(query)
    if (!existing) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 })
    }

    // Validasi kepemilikan: Hanya pemilik profil atau admin yang boleh menghapus
    if (!isAdmin && existing.userId !== auth.uid) {
      return NextResponse.json({ message: 'Anda tidak memiliki hak untuk menghapus profil ini' }, { status: 403 })
    }

    const result = await db.collection('villages').deleteOne({ _id: existing._id })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Profil desa berhasil dihapus' }, { status: 200 })

  } catch (error) {
    console.error('Error deleting village profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}