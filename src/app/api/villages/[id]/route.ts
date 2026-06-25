import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { validateWordLimit } from '@/lib/utils/wordCount'
import { getCachedData, setCachedData, invalidateCachePattern, invalidateCacheKeys } from '@/lib/utils/cache'

type Params = Promise<{ id: string }>

// =========================================================
// GET /api/villages/[id]
// Mengambil detail profile desa (berdasarkan _id atau userId)
// =========================================================
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params

    const cacheKey = `cache:village:detail:${id}`
    const cached = await getCachedData<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, { status: 200 })
    }

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

    const responsePayload = {
      village: {
        ...village,
        id: village._id.toString(),
        _id: village._id.toString(),
        jumlahInovasiDiterapkan: totalVerified
      }
    }

    await setCachedData(cacheKey, responsePayload, 300)

    return NextResponse.json(responsePayload, { status: 200 })

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

    try {
      if (body.deskripsi !== undefined) validateWordLimit(body.deskripsi, 100, 'deskripsi');
      if (body.geografisDesa !== undefined) validateWordLimit(body.geografisDesa, 30, 'kondisi geografis');
      if (body.sosialBudaya !== undefined) validateWordLimit(body.sosialBudaya, 30, 'kondisi sosial dan budaya');
      if (body.sumberDaya !== undefined) validateWordLimit(body.sumberDaya, 30, 'kondisi sumber daya alam');
      if (body.infrastrukturDesa !== undefined) validateWordLimit(body.infrastrukturDesa, 30, 'kondisi infrastruktur');
    } catch (validationError: any) {
      return NextResponse.json({ message: validationError.message }, { status: 400 });
    }

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
    const isOwner = existing.userId === auth.uid || existing._id.toString() === auth.uid;
    if (!isAdmin && !isOwner) {
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

    // Invalidate caches
    const targetUserId = existing.userId || id
    await invalidateCachePattern('cache:villages:list:*')
    await invalidateCacheKeys([
      `cache:village:detail:${id}`,
      `cache:village:detail:${targetUserId}`,
      `cache:village:dashboard:${id}`,
      `cache:village:dashboard:${targetUserId}`,
      `cache:auth:me:${id}`,
      `cache:auth:me:${targetUserId}`,
      `cache:user:role:${id}`,
      `cache:user:role:${targetUserId}`
    ])

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
    const isOwner = existing.userId === auth.uid || existing._id.toString() === auth.uid;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: 'Anda tidak memiliki hak untuk menghapus profil ini' }, { status: 403 })
    }

    const result = await db.collection('villages').deleteOne({ _id: existing._id })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 })
    }

    // Invalidate caches
    const targetUserId = existing.userId || id
    await invalidateCachePattern('cache:villages:list:*')
    await invalidateCacheKeys([
      `cache:village:detail:${id}`,
      `cache:village:detail:${targetUserId}`,
      `cache:village:dashboard:${id}`,
      `cache:village:dashboard:${targetUserId}`,
      `cache:auth:me:${id}`,
      `cache:auth:me:${targetUserId}`,
      `cache:user:role:${id}`,
      `cache:user:role:${targetUserId}`
    ])

    return NextResponse.json({ message: 'Profil desa berhasil dihapus' }, { status: 200 })

  } catch (error) {
    console.error('Error deleting village profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}