import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { createNotification, notifyAllAdmins } from '@/services/notificationServices'
import { validateWordLimit } from '@/lib/utils/wordCount'
import { getCachedData, setCachedData, invalidateCachePattern, invalidateCacheKeys } from '@/lib/utils/cache'

// =========================================================
// POST /api/villages/claim
// Mengajukan klaim inovasi oleh desa (Mendukung Klaim Manual)
// =========================================================
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["village", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json()
    const {
      desaId,
      namaDesa,
      inovasiId,      // Optional untuk klaim manual
      namaInovasi,    // Wajib
      namaInovator,   // Wajib
      deskripsiInovasi, // Wajib
      logoInovator,   // Optional
      fotoInovasi,    // Optional
      buktiJenis,     // Wajib (Array: ['foto', 'video', 'dokumen'])
      buktiFiles      // Object: { foto: [], video: [], dokumen: [] }
    } = body

    // Validasi field wajib
    const missingFields = [];
    if (!desaId) missingFields.push('desaId');
    if (!namaInovasi) missingFields.push('namaInovasi');
    if (!namaInovator) missingFields.push('namaInovator');
    if (!deskripsiInovasi) missingFields.push('deskripsiInovasi');
    if (!buktiJenis || buktiJenis.length === 0) missingFields.push('buktiJenis');

    if (missingFields.length > 0) {
      return new NextResponse(
        JSON.stringify({
          message: `Field wajib tidak lengkap: ${missingFields.join(', ')} harus diisi.`
        }, null, 2),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    try {
      validateWordLimit(deskripsiInovasi, 80, 'deskripsi inovasi');
      validateWordLimit(namaInovasi, 10, 'nama inovasi');
      validateWordLimit(namaInovator, 10, 'nama inovator');
    } catch (validationError: any) {
      return NextResponse.json({ message: validationError.message }, { status: 400 });
    }

    // Validasi buktiFiles terhadap buktiJenis yang dipilih
    if (!buktiFiles || typeof buktiFiles !== 'object') {
      return new NextResponse(
        JSON.stringify({ message: 'Bukti file wajib diisi.' }, null, 2),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    for (const jenis of buktiJenis) {
      if (jenis === 'foto') {
        const fotoFiles = buktiFiles.foto;
        if (!fotoFiles || !Array.isArray(fotoFiles) || fotoFiles.length === 0 || fotoFiles.some((f: any) => !f || typeof f !== 'string' || f.trim() === '')) {
          return new NextResponse(
            JSON.stringify({ message: 'Bukti foto harus menyertakan file foto yang valid.' }, null, 2),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
      } else if (jenis === 'video') {
        const videoFiles = buktiFiles.video;
        if (!videoFiles || !Array.isArray(videoFiles) || videoFiles.length === 0 || videoFiles.some((v: any) => !v || typeof v !== 'string' || v.trim() === '')) {
          return new NextResponse(
            JSON.stringify({ message: 'Bukti video harus menyertakan file video yang valid.' }, null, 2),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
      } else if (jenis === 'dokumen') {
        const dokumenFiles = buktiFiles.dokumen;
        if (!dokumenFiles || !Array.isArray(dokumenFiles) || dokumenFiles.length === 0 || dokumenFiles.some((d: any) => !d || typeof d !== 'string' || d.trim() === '')) {
          return new NextResponse(
            JSON.stringify({ message: 'Bukti dokumen harus menyertakan file dokumen yang valid.' }, null, 2),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    const db = await connectToDatabase()

    // Validate village verification status
    if (auth.role !== 'admin') {
      const village = await db.collection('villages').findOne({ userId: auth.uid })
      if (!village || village.status !== 'Terverifikasi') {
        return new NextResponse(
          JSON.stringify({ message: 'Profil Desa Anda belum diverifikasi. Anda tidak dapat mengajukan klaim inovasi.' }, null, 2),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Jika ada inovasiId, cek apakah klaim ini sudah pernah diajukan untuk inovasi yang sama
    if (inovasiId) {
      const existing = await db.collection('claimInnovations').findOne({
        desaId,
        inovasiId,
        status: { $ne: 'Ditolak' } // Hanya cek yang belum ditolak
      })

      if (existing) {
        return new NextResponse(
          JSON.stringify({ message: 'Inovasi ini sudah dalam proses klaim oleh desa Anda' }, null, 2),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    const newClaim: any = {
      ...body,
      desaId,
      namaDesa: namaDesa || '',
      inovasiId: inovasiId || null,
      namaInovasi,
      namaInovator,
      deskripsiInovasi,
      logoInovator: logoInovator || null,
      fotoInovasi: fotoInovasi || null,
      buktiJenis: buktiJenis, // Menyimpan jenis bukti yang dipilih
      buktiFiles: buktiFiles || {}, // Menyimpan URL file bukti (foto/video/dokumen)
      isManual: body.isManual || false,
      status: 'Menunggu', // Status verifikasi admin
      catatanAdmin: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Support client-side generated IDs for structured storage consistency
    if (body.id) {
      if (ObjectId.isValid(body.id)) {
        newClaim._id = new ObjectId(body.id);
      } else {
        newClaim._id = body.id;
      }
    }

    const result = await db.collection('claimInnovations').insertOne(newClaim)
    const claimId = result.insertedId.toString()

    // Invalidate list of claims, village details and dashboard caches
    await invalidateCachePattern('cache:claims:list:*')
    if (desaId) {
      await invalidateCacheKeys([
        `cache:village:detail:${desaId}`,
        `cache:village:dashboard:${desaId}`
      ])
    }

    // Create notifications for admins and village
    try {
      // Notify all admins about new claim
      await notifyAllAdmins({
        type: 'personal',
        category: 'claim_submission',
        title: `Klaim Inovasi Baru: ${namaInovasi}`,
        description: `${namaDesa} telah mengajukan klaim untuk inovasi "${namaInovasi}". Silakan verifikasi pengajuan ini.`,
        actionType: 'claim_detail',
        relatedId: claimId,
      })

      // Notify village about submission
      await createNotification({
        userId: desaId,  // Gunakan desaId (UID desa) sebagai penerima, bukan auth.uid
        type: 'personal',
        category: 'claim_submission',
        title: 'Klaim Inovasi Berhasil Diajukan',
        description: `Klaim Anda untuk "${namaInovasi}" telah diajukan dan menunggu verifikasi admin.`,
        actionType: 'claim_detail',
        relatedId: claimId,
      })
    } catch (notifError) {
      // Log notification error but don't fail the claim creation
      console.error('Error creating notifications for claim:', notifError)
    }

    return new NextResponse(
      JSON.stringify({
        message: 'Permohonan klaim inovasi berhasil diajukan',
        claimId: claimId
      }, null, 2),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error claiming innovation:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }, null, 2),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// =========================================================
// GET /api/villages/claim
// Mengambil daftar klaim inovasi (biasanya untuk admin atau user tertentu)
// Query: ?desaId=<id> atau ?status=<status>
// =========================================================
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["village", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url)
    const desaId = searchParams.get('desaId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '0')
    const skip = parseInt(searchParams.get('skip') || '0')

    const cacheKey = `cache:claims:list:desaId=${desaId || 'all'}:status=${status || 'all'}:search=${search || 'all'}:limit=${limit}:skip=${skip}`
    const cached = await getCachedData<any>(cacheKey)
    if (cached) {
      return new NextResponse(JSON.stringify(cached, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const db = await connectToDatabase()
    const filter: any = {}
    if (desaId) filter.desaId = desaId
    if (status) filter.status = status
    if (search) {
      filter.namaInovasi = { $regex: search, $options: 'i' }
    }

    let query = db.collection('claimInnovations').find(filter).sort({ createdAt: -1 })

    // Get total count for pagination metadata
    const total = await db.collection('claimInnovations').countDocuments(filter)

    if (skip > 0) query = query.skip(skip)
    if (limit > 0) query = query.limit(limit)

    const claims = await query.toArray()

    const result = claims.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }))

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    const responsePayload = {
      claims: result,
      pagination: {
        total,
        totalPages,
        limit,
        skip,
        hasMore: total > skip + result.length
      }
    }

    await setCachedData(cacheKey, responsePayload, 300)

    return new NextResponse(JSON.stringify(responsePayload, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching claims:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
