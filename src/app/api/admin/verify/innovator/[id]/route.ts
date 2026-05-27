import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { createNotification, notifyRole } from '@/services/notificationServices'

type Params = Promise<{ id: string }>

type VerifyBody = {
  status?: string
  catatanAdmin?: string | null
}

// POST /api/admin/verify/innovator/:id
// Verifikasi atau tolak profil inovator oleh admin.
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Innovator ID is required' }, { status: 400 })
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

    const innovator = await db.collection('innovators').findOne(query)
    if (!innovator) {
      return NextResponse.json({ message: 'DEBUG: Profil inovator tidak ditemukan di database' }, { status: 404 })
    }

    const updatePayload: any = {
      status: desiredStatus,
      catatanAdmin,
      editedAt: new Date(),
    }

    if (desiredStatus === 'Terverifikasi') {
      updatePayload.verifiedAt = new Date()
    }

    const result = await db.collection('innovators').updateOne(query, { $set: updatePayload })
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Profil inovator tidak ditemukan' }, { status: 404 })
    }

    // Create notification for the Innovator owner
    try {
      const targetUserId = innovator.userId || innovator.firebaseUid || id;
      const notifTitle = desiredStatus === 'Terverifikasi'
        ? 'Profil Innovator Terverifikasi'
        : 'Profil Innovator Ditolak'
      const notifDescription = desiredStatus === 'Terverifikasi'
        ? `Selamat! Profil innovator Anda telah diverifikasi oleh admin. Sekarang Anda dapat mulai menambahkan inovasi.`
        : `Pengajuan profil innovator Anda ditolak. Catatan: ${catatanAdmin || 'Data kurang lengkap'}`

      await createNotification({
        userId: targetUserId,
        type: 'personal',
        category: 'innovator_submission',
        title: notifTitle,
        description: notifDescription,
        actionType: 'profile',
        relatedId: targetUserId,
      })
    } catch (notifErr) {
      console.error('Error notifying innovator about verification:', notifErr)
    }

    // Notify all villages about new verified innovator (Broad Recommendation)
    if (desiredStatus === 'Terverifikasi') {
      try {
        await notifyRole('village', {
          type: 'general',
          category: 'new_innovator',
          title: 'Innovator Baru Terdaftar!+',
          description: `${innovator.namaInovator || innovator.namaInnovator || innovator.name || 'Seorang Innovator'} baru saja bergabung dan terverifikasi. Ayo cek profil mereka!`,
          actionType: 'profile',
          relatedId: innovator.userId || innovator._id.toString()
        })
      } catch (notifErr) {
        console.error('Error notifying villages about new innovator:', notifErr)
      }
    }

    return NextResponse.json(
      {
        message: desiredStatus === 'Terverifikasi'
          ? 'Profil inovator berhasil diverifikasi'
          : 'Profil inovator berhasil ditolak',
        innovatorId: id,
        status: desiredStatus,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying innovator:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
