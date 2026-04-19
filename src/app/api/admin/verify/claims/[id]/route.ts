// app/api/admin/verify/claims/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { createNotification } from '@/services/notificationServices'

type Params = Promise<{ id: string }>

type VerifyBody = {
  status?: string
  catatanAdmin?: string | null
}

// POST /api/admin/verify/claims/:id
// Verifikasi atau tolak klaim inovasi oleh admin.
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Claim ID is required' }, { status: 400 })
    }

    const body: VerifyBody = await request.json().catch(() => ({}))
    const desiredStatus = body.status === 'Ditolak' ? 'Ditolak' : 'Terverifikasi'
    const catatanAdmin = body.catatanAdmin ?? null

    const db = await connectToDatabase()
    let query: any = {}
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id)
    } else {
      query._id = id
    }

    const claim = await db.collection('claimInnovations').findOne(query)
    if (!claim) {
      return NextResponse.json({ message: 'Klaim tidak ditemukan' }, { status: 404 })
    }

    const updatePayload: any = {
      status: desiredStatus,
      catatanAdmin,
      updatedAt: new Date(),
    }

    if (desiredStatus === 'Terverifikasi') {
      updatePayload.verifiedAt = new Date()
    }

    const result = await db.collection('claimInnovations').updateOne(query, { $set: updatePayload })
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Klaim tidak ditemukan' }, { status: 404 })
    }

    // Create notification for village
    try {
      const villageDesaId = claim.desaId
      if (villageDesaId) {
        // Resolve Firebase UID dari desaId — cari user desa di collection users
        const villageUser = await db.collection('users').findOne(
          { $or: [{ uid: villageDesaId }, { firebaseUid: villageDesaId }, { desaId: villageDesaId }] },
          { projection: { uid: 1, firebaseUid: 1 } }
        )
        // Gunakan Firebase UID jika ketemu, fallback ke desaId (jika sudah Firebase UID)
        const targetUserId = villageUser?.uid || villageUser?.firebaseUid || villageDesaId

        const notifTitle = desiredStatus === 'Terverifikasi' 
          ? 'Klaim Inovasi Disetujui!'
          : 'Klaim Inovasi Ditolak'
        const notifDescription = desiredStatus === 'Terverifikasi'
          ? `Selamat! Klaim Anda untuk "${claim.namaInovasi}" telah disetujui oleh admin.`
          : `Klaim Anda untuk "${claim.namaInovasi}" ditolak. Alasan: ${catatanAdmin || 'Tidak ada catatan'}`

        await createNotification({
          userId: targetUserId,
          type: 'personal',
          title: notifTitle,
          description: notifDescription,
          actionType: 'claim_detail',
          relatedId: id,
        })
      }
    } catch (notifError) {
      console.error('Error creating notification for claim verification:', notifError)
    }

    return NextResponse.json(
      {
        message:
          desiredStatus === 'Terverifikasi'
            ? 'Klaim berhasil diverifikasi'
            : 'Klaim berhasil ditolak',
        claimId: id,
        status: desiredStatus,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying claim:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}