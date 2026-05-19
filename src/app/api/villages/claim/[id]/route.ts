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

    // Validasi kepemilikan dan bukti jika diubah oleh non-admin (desa)
    if (!isAdmin) {
      // Pastikan pengubah adalah pemilik klaim
      if (claim.desaId !== auth.uid) {
        return NextResponse.json({ message: 'Anda tidak memiliki hak untuk mengubah klaim ini' }, { status: 403 })
      }

      const { buktiJenis, buktiFiles } = body

      if (buktiJenis !== undefined && (!Array.isArray(buktiJenis) || buktiJenis.length === 0)) {
        return NextResponse.json({ message: 'buktiJenis tidak boleh kosong' }, { status: 400 })
      }

      const targetBuktiJenis = buktiJenis !== undefined ? buktiJenis : claim.buktiJenis;
      const targetBuktiFiles = buktiFiles !== undefined ? buktiFiles : claim.buktiFiles;

      if (targetBuktiJenis && targetBuktiJenis.length > 0) {
        if (!targetBuktiFiles || typeof targetBuktiFiles !== 'object') {
          return NextResponse.json({ message: 'Bukti file wajib diisi.' }, { status: 400 })
        }

        for (const jenis of targetBuktiJenis) {
          if (jenis === 'foto') {
            const fotoFiles = targetBuktiFiles.foto;
            if (!fotoFiles || !Array.isArray(fotoFiles) || fotoFiles.length === 0 || fotoFiles.some((f: any) => !f || typeof f !== 'string' || f.trim() === '')) {
              return NextResponse.json({ message: 'Bukti foto harus menyertakan file foto yang valid.' }, { status: 400 })
            }
          } else if (jenis === 'video') {
            const videoFiles = targetBuktiFiles.video;
            if (!videoFiles || !Array.isArray(videoFiles) || videoFiles.length === 0 || videoFiles.every((v: any) => !v || typeof v !== 'string' || v.trim() === '')) {
              return NextResponse.json({ message: 'Bukti video harus menyertakan file video yang valid.' }, { status: 400 })
            }
          } else if (jenis === 'dokumen') {
            const dokumenFiles = targetBuktiFiles.dokumen;
            if (!dokumenFiles || !Array.isArray(dokumenFiles) || dokumenFiles.length === 0 || dokumenFiles.some((d: any) => !d || typeof d !== 'string' || d.trim() === '')) {
              return NextResponse.json({ message: 'Bukti dokumen harus menyertakan file dokumen yang valid.' }, { status: 400 })
            }
          }
        }
      }
    }

    // Reset status if resubmitting rejected profile
    const isResubmission = !isAdmin && claim?.status === 'Ditolak'

    const updateData: any = { ...body, updatedAt: new Date() }
    delete updateData._id
    delete updateData.id

    // Jika village mengedit, paksa status kembali ke Menunggu
    if (isResubmission) {
      updateData.status = 'Menunggu'
      updateData.catatanAdmin = null
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

    // Sync data if status changed TO Terverifikasi
    if (claim.status !== 'Terverifikasi' && nextStatus === 'Terverifikasi') {
      try {
        // 1. Increment Village implementation count
        const villageQuery: any = { $or: [{ userId: claim.desaId }] };
        if (ObjectId.isValid(claim.desaId)) {
          villageQuery.$or.push({ _id: new ObjectId(claim.desaId) });
        }

        await db.collection('villages').updateOne(
          villageQuery,
          { $inc: { jumlahInovasiDiterapkan: 1 } }
        ).catch(err => console.error("Failed to increment village count:", err));

        // 2. If regular claim, update Innovation document
        if (claim.inovasiId) {
          let innovQuery: any = {};
          if (ObjectId.isValid(claim.inovasiId)) {
            innovQuery._id = new ObjectId(claim.inovasiId);
          } else {
            innovQuery._id = claim.inovasiId;
          }

          await db.collection('innovations').updateOne(
            innovQuery,
            {
              $addToSet: { desaId: claim.desaId },
              $inc: { jumlahPenerapan: 1 }
            }
          ).catch(err => console.error("Failed to increment innovation stats:", err));
        }
      } catch (syncError) {
        console.error("Error during data synchronization on verification:", syncError);
      }
    }

    // Sync data if status changed FROM Terverifikasi TO Menunggu
    if (claim.status === 'Terverifikasi' && nextStatus === 'Menunggu') {
      try {
        // 1. Decrement Village implementation count
        await db.collection('villages').updateOne(
          { $or: [{ userId: claim.desaId }, { desaId: claim.desaId }] },
          { $inc: { jumlahInovasiDiterapkan: -1 } }
        ).catch(err => console.error("Failed to decrement village count:", err));

        // 2. If regular claim, update Innovation document
        if (claim.inovasiId) {
          let innovQuery: any = {};
          if (ObjectId.isValid(claim.inovasiId)) {
            innovQuery._id = new ObjectId(claim.inovasiId);
          } else {
            innovQuery._id = claim.inovasiId;
          }

          await db.collection('innovations').updateOne(
            innovQuery,
            {
              $pull: { desaId: claim.desaId },
              $inc: { jumlahPenerapan: -1 }
            }
          ).catch(err => console.error("Failed to decrement innovation stats:", err));
        }
      } catch (syncError) {
        console.error("Error during data desynchronization:", syncError);
      }
    }

    // Restore Notification Logic
    try {
      const { notifyAllAdmins } = await import('@/services/notificationServices')

      // 1. Jika admin mengubah status verifikasi → notif ke village
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

      // 2. Jika village mengajukan ulang klaim yang ditolak → notif ke admin
      if (isResubmission) {
        await notifyAllAdmins({
          type: 'personal',
          category: 'claim_submission',
          title: `Pengajuan Ulang Klaim Inovasi: ${claim.namaInovasi}`,
          description: `Desa ${claim.namaDesa || 'unknown'} telah mengajukan ulang klaim untuk inovasi "${claim.namaInovasi}" yang sebelumnya ditolak. Silakan verifikasi kembali.`,
          actionType: 'claim_detail',
          relatedId: claim._id.toString(),
        })
      }
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
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

    // Sync data if DELETED claim was Terverifikasi
    if (claim.status === 'Terverifikasi') {
      try {
        // 1. Decrement Village implementation count
        await db.collection('villages').updateOne(
          { $or: [{ userId: claim.desaId }, { desaId: claim.desaId }] },
          { $inc: { jumlahInovasiDiterapkan: -1 } }
        ).catch(err => console.error("Failed to decrement village count on delete:", err));

        // 2. If regular claim, update Innovation document
        if (claim.inovasiId) {
          let innovQuery: any = {};
          if (ObjectId.isValid(claim.inovasiId)) {
            innovQuery._id = new ObjectId(claim.inovasiId);
          } else {
            innovQuery._id = claim.inovasiId;
          }

          await db.collection('innovations').updateOne(
            innovQuery,
            {
              $pull: { desaId: claim.desaId },
              $inc: { jumlahPenerapan: -1 }
            }
          ).catch(err => console.error("Failed to decrement innovation stats on delete:", err));
        }
      } catch (syncError) {
        console.error("Error during data desynchronization on delete:", syncError);
      }
    }

    return NextResponse.json({ message: 'Klaim berhasil dihapus' })

  } catch (error) {
    console.error('Error deleting claim:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
