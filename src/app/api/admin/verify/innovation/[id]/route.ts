import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { createNotification, createNotificationBatch } from '@/services/notificationServices'
import { invalidateCachePattern, invalidateCacheKeys } from '@/lib/utils/cache'

type Params = Promise<{ id: string }>

type VerifyBody = {
  status?: string
  catatanAdmin?: string | null
}

// POST /api/admin/verify/innovation/:id
// Verifikasi atau tolak inovasi oleh admin.
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Innovation ID is required' }, { status: 400 })
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

    const innovation = await db.collection('innovations').findOne(query)
    if (!innovation) {
      return NextResponse.json({ message: 'Inovasi tidak ditemukan' }, { status: 404 })
    }

    const updatePayload: any = {
      status: desiredStatus,
      catatanAdmin,
      editedAt: new Date(),
    }

    if (desiredStatus === 'Terverifikasi') {
      updatePayload.verifiedAt = new Date()
    }

    const result = await db.collection('innovations').updateOne(query, { $set: updatePayload })
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Inovasi tidak ditemukan' }, { status: 404 })
    }

    const targetInnovatorId = innovation.innovatorId || innovation.userId
    await invalidateCachePattern('cache:innovations:list:*')
    await invalidateCachePattern('cache:recommendations:*')
    await invalidateCacheKeys([
      `cache:innovation:detail:${id}`,
      `cache:innovation:detail:${innovation._id.toString()}`,
      ...(targetInnovatorId ? [
        `cache:innovator:dashboard:${targetInnovatorId}`,
        `cache:auth:me:${targetInnovatorId}`
      ] : [])
    ])

    // Create notification for innovator
    try {
      const innovatorId = innovation.innovatorId
      if (innovatorId) {
        const notifTitle = desiredStatus === 'Terverifikasi'
          ? 'Inovasi Disetujui'
          : 'Inovasi Ditolak'
        const notifDescription = desiredStatus === 'Terverifikasi'
          ? `Selamat! Inovasi "${innovation.namaInovasi}" telah disetujui oleh admin.`
          : `Inovasi "${innovation.namaInovasi}" ditolak. Alasan: ${catatanAdmin || 'Tidak ada catatan'}`

        await createNotification({
          userId: innovatorId,
          type: 'personal',
          category: 'innovation_submission',
          title: notifTitle,
          description: notifDescription,
          actionType: 'innovation_detail',
          relatedId: id,
        })
      }

      // Notify matching villages if verified
      if (desiredStatus === 'Terverifikasi' && innovation.kategori) {
        const matchingVillages = await db.collection('villages')
          .find({
            status: 'Terverifikasi',
            $or: [
              { kategoriInovasi: innovation.kategori },
              { kategori: innovation.kategori },
              { "kebutuhan.kategori": innovation.kategori }
            ]
          })
          .toArray()

        if (matchingVillages.length > 0) {
          const notifications = matchingVillages.map(v => ({
            userId: v.userId,
            type: 'general',
            category: 'innovation_recommendation',
            title: 'Inovasi Baru yang Cocok!',
            description: `Ditemukan inovasi "${innovation.namaInovasi}" yang mungkin bermanfaat untuk desa Anda. Cek sekarang!`,
            actionType: 'innovation_detail',
            relatedId: id
          }))
          await createNotificationBatch(notifications as any)
        }
      }
    } catch (notifError) {
      console.error('Error creating notification for innovation verification:', notifError)
    }

    return NextResponse.json(
      {
        message:
          desiredStatus === 'Terverifikasi'
            ? 'Inovasi berhasil diverifikasi'
            : 'Inovasi berhasil ditolak',
        innovationId: id,
        status: desiredStatus,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying innovation:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}