import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

type Params = Promise<{ id: string }>

type VerifyBody = {
  status?: string
  catatanAdmin?: string | null
}

// POST /api/admin/verify/village/:id
// Verifikasi atau tolak profil desa oleh admin.
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Village ID is required' }, { status: 400 })
    }

    const body: VerifyBody = await request.json().catch(() => ({}))
    const desiredStatus = body.status === 'Ditolak' ? 'Ditolak' : 'Terverifikasi'
    const catatanAdmin = body.catatanAdmin ?? null

    const db = await connectToDatabase()
    const query: any = {
      $or: [
        ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : []),
        { _id: id },
        { userId: id }
      ]
    }

    const village = await db.collection('villages').findOne(query)
    if (!village) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 })
    }

    const updatePayload: any = {
      status: desiredStatus,
      catatanAdmin,
      editedAt: new Date(),
    }

    if (desiredStatus === 'Terverifikasi') {
      updatePayload.verifiedAt = new Date()
    }

    const result = await db.collection('villages').updateOne(query, { $set: updatePayload })
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 })
    }

    // Create notification for the Village owner
    try {
      const { createNotification } = await import('@/services/notificationServices')
      const targetUserId = village.userId || village.firebaseUid || id;
      const notifTitle = desiredStatus === 'Terverifikasi'
        ? 'Profil Desa Terverifikasi'
        : 'Profil Desa Ditolak'
      const notifDescription = desiredStatus === 'Terverifikasi'
        ? `Selamat! Profil desa Anda telah diverifikasi oleh admin. Sekarang Anda dapat mulai mengecek inovasi.`
        : `Pengajuan profil desa Anda ditolak. Catatan: ${catatanAdmin || 'Data kurang lengkap'}`

      await createNotification({
        userId: targetUserId,
        type: 'personal',
        category: 'village_submission',
        title: notifTitle,
        description: notifDescription,
        actionType: 'profile',
        relatedId: targetUserId,
      })
    } catch (notifErr) {
      console.error('Error notifying village about verification:', notifErr)
    }

    return NextResponse.json(
      {
        message: desiredStatus === 'Terverifikasi'
          ? 'Profil desa berhasil diverifikasi'
          : 'Profil desa berhasil ditolak',
        villageId: id,
        status: desiredStatus,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying village:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
