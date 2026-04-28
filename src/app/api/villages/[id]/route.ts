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
    const verifiedCount = await db.collection('claimInnovations').countDocuments({
      desaId: desaId,
      status: 'Terverifikasi'
    });

    return NextResponse.json(
      { 
        village: { 
          ...village, 
          id: village._id.toString(), 
          _id: village._id.toString(),
          jumlahInovasiDiterapkan: Math.max(village.jumlahInovasiDiterapkan || 0, verifiedCount)
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
    
    // Reset status if resubmitting rejected profile
    const isResubmission = !isAdmin && existing?.status === 'Ditolak'
    if (isResubmission) {
        body.status = 'Menunggu'
        body.catatanAdmin = null
    }

    const result = await db.collection('villages').updateOne(
      query,
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
                category: 'profile_submission',
                title: `Pengajuan Ulang Profil Desa: ${body.namaDesa || existing?.namaDesa}`,
                description: `Desa ${body.namaDesa || existing?.namaDesa} telah memperbarui profil yang sebelumnya ditolak. Silakan verifikasi kembali.`,
                actionType: 'profile',
                relatedId: id,
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

    const { id } = await params
    const db = await connectToDatabase()

    let query: any;
    try {
      query = { $or: [{ _id: new ObjectId(id) }, { userId: id }] }
    } catch (e) {
      query = { userId: id }
    }

    const result = await db.collection('villages').deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Profil desa berhasil dihapus' }, { status: 200 })

  } catch (error) {
    console.error('Error deleting village profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}