import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { validateWordLimit } from '@/lib/utils/wordCount'
import { getCachedData, setCachedData, invalidateCachePattern, invalidateCacheKeys } from '@/lib/utils/cache'

// =========================================================
// GET /api/villages
// Mengambil daftar semua desa
// Query: ?status=<status>&limit=<n>&skip=<n> (misal: Terverifikasi, Menunggu, Ditolak)
// =========================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const provinsi = searchParams.get('provinsi')
    const kabupatenKota = searchParams.get('kabupatenKota')
    const limitVal = parseInt(searchParams.get('limit') || '0')
    const skipVal = parseInt(searchParams.get('skip') || '0')

    const cacheKey = `cache:villages:list:status=${status || 'all'}:search=${search || 'all'}:provinsi=${provinsi || 'all'}:kabupatenKota=${kabupatenKota || 'all'}:limit=${limitVal}:skip=${skipVal}`
    const cached = await getCachedData<any>(cacheKey)
    if (cached) {
      return new NextResponse(JSON.stringify(cached, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const db = await connectToDatabase()
    const andConditions: any[] = []

    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const normalizeRegionName = (value: string) =>
      value
        .trim()
        .replace(/^(kabupaten|kota|kab\.?)\s+/i, '')
        .replace(/\s+/g, ' ')

    if (status) {
      andConditions.push({ status })
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i')
      andConditions.push({
        $or: [
          { namaDesa: { $regex: searchRegex } },
          { desa: { $regex: searchRegex } },
          { "lokasi.desaKelurahan.label": { $regex: searchRegex } },
        ],
      })
    }

    if (provinsi && provinsi.trim()) {
      const provinsiRegex = new RegExp(`^${escapeRegex(provinsi.trim())}$`, 'i')
      andConditions.push({
        $or: [
          { provinsi: { $regex: provinsiRegex } },
          { "lokasi.provinsi.label": { $regex: provinsiRegex } },
        ],
      })
    }

    if (kabupatenKota && kabupatenKota.trim()) {
      const normalizedKabupaten = normalizeRegionName(kabupatenKota)
      const kabupatenRegex = new RegExp(
        `^(?:(?:kabupaten|kab\\.?|kota)\\s+)?${escapeRegex(normalizedKabupaten)}$`,
        'i'
      )
      andConditions.push({
        $or: [
          { kabupatenKota: { $regex: kabupatenRegex } },
          { kabupaten: { $regex: kabupatenRegex } },
          { "lokasi.kabupatenKota.label": { $regex: kabupatenRegex } },
        ],
      })
    }

    const filter: any = andConditions.length ? { $and: andConditions } : {}
    
    // Count total matched documents
    const totalCount = await db.collection('villages').countDocuments(filter)

    const pipeline: any[] = [
      { $match: filter },
      {
        $addFields: {
          sortDate: { $ifNull: ["$updatedAt", { $ifNull: ["$editedAt", "$createdAt"] }] }
        }
      },
      { $sort: { sortDate: -1 } },
    ]

    if (skipVal > 0) pipeline.push({ $skip: skipVal })
    if (limitVal > 0) pipeline.push({ $limit: limitVal })

    // Add fields for live counting
    pipeline.push(
      {
        $addFields: {
          villageIdStr: { $toString: "$_id" }
        }
      },
      {
        $lookup: {
          from: 'claimInnovations',
          let: { vId: "$userId", v_id: "$villageIdStr" },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $or: [{ $eq: ["$desaId", "$$vId"] }, { $eq: ["$desaId", "$$v_id"] }] },
                    { $eq: ["$status", "Terverifikasi"] },
                    { $or: [{ $eq: ["$inovasiId", null] }, { $not: ["$inovasiId"] }] } // Only Manual Claims
                  ]
                }
              }
            }
          ],
          as: 'manualClaims'
        }
      },
      {
        $lookup: {
          from: 'innovations',
          let: { vId: "$userId", v_id: "$villageIdStr" },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $or: [{ $in: ["$$vId", { $ifNull: ["$desaId", []] }] }, { $in: ["$$v_id", { $ifNull: ["$desaId", []] }] }] },
                    { $eq: ["$status", "Terverifikasi"] }
                  ]
                }
              }
            }
          ],
          as: 'standardInnovations'
        }
      },
      {
        $addFields: {
          liveCount: { $add: [{ $size: "$manualClaims" }, { $size: "$standardInnovations" }] }
        }
      },
      {
        $addFields: {
          // Use the live count as the primary source of truth
          jumlahInovasiDiterapkan: "$liveCount"
        }
      },
      {
        $project: { manualClaims: 0, standardInnovations: 0, villageIdStr: 0, liveCount: 0 }
      }
    )

    const villages = await db.collection('villages').aggregate(pipeline).toArray()

    const result = villages.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }))
    
    const totalPages = limitVal > 0 ? Math.ceil(totalCount / limitVal) : 1;

    const responsePayload = { 
      villages: result,
      pagination: {
        total: totalCount,
        totalPages,
        limit: limitVal,
        skip: skipVal
      }
    }

    await setCachedData(cacheKey, responsePayload, 300)

    return new NextResponse(JSON.stringify(responsePayload, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching villages:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// POST /api/villages
// Membuat profil desa baru
// =========================================================
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["village", "admin"])
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { 
      userId, 
      namaDesa, 
      deskripsi, 
      lokasi, 
      potensiDesa, 
      logo, 
      header,
      geografisDesa,
      sosialBudaya,
      sumberDaya,
      infrastrukturDesa,
      whatsapp,
      kondisijalan,
      jaringan,
      listrik,
      teknologi,
      kemampuan
    } = body

    // Tentukan targetUserId: jika bukan admin, gunakan UID dari token
    const targetUserId = auth.role === "admin" ? userId : auth.uid

    if (
      !targetUserId || 
      !namaDesa || 
      !deskripsi || 
      !potensiDesa || (Array.isArray(potensiDesa) && potensiDesa.length === 0) ||
      !logo || 
      !header ||
      !geografisDesa ||
      !sosialBudaya ||
      !sumberDaya ||
      !whatsapp ||
      !kondisijalan ||
      !jaringan ||
      !listrik ||
      !teknologi ||
      !kemampuan ||
      !lokasi || !lokasi.provinsi || !lokasi.kabupatenKota || !lokasi.kecamatan || !lokasi.desaKelurahan
    ) {
      return NextResponse.json({ 
        message: 'Field wajib tidak lengkap. Pastikan semua data bintang (*) telah diisi.' 
      }, { status: 400 })
    }

    try {
      validateWordLimit(deskripsi, 100, 'deskripsi');
      validateWordLimit(geografisDesa, 30, 'kondisi geografis');
      validateWordLimit(sosialBudaya, 30, 'kondisi sosial dan budaya');
      validateWordLimit(sumberDaya, 30, 'kondisi sumber daya alam');
      validateWordLimit(infrastrukturDesa, 30, 'kondisi infrastruktur');
    } catch (validationError: any) {
      return NextResponse.json({ message: validationError.message }, { status: 400 });
    }

    const db = await connectToDatabase()

    // 1. Validasi keberadaan user dan role di database
    const targetUser = await db.collection('users').findOne({
      $or: [
        { uid: targetUserId },
        { firebaseUid: targetUserId },
        { id: targetUserId },
        { _id: targetUserId as any }
      ]
    })
    if (!targetUser) {
      return NextResponse.json({ message: 'User tidak ditemukan di sistem' }, { status: 400 })
    }
    if (targetUser.role !== 'village') {
      return NextResponse.json({ message: 'Peran pengguna haruslah perangkat desa (village)' }, { status: 400 })
    }
    
    // Check if village profile already exists for this user
    const existing = await db.collection('villages').findOne({ userId: targetUserId })
    if (existing) {
      return NextResponse.json({ message: 'Profil desa untuk user ini sudah ada' }, { status: 409 })
    }

    const newVillage = {
      ...body,
      userId: targetUserId, // override to ensure consistency
      status: 'Menunggu', // Default status for admin verification
      catatanAdmin: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('villages').insertOne(newVillage)
    const villageId = result.insertedId.toString()

    // Invalidate village caches and auth status cache
    await invalidateCachePattern('cache:villages:list:*')
    await invalidateCacheKeys([`cache:auth:me:${targetUserId}`, `cache:user:role:${targetUserId}`])

    // Notify all admins about new registered village profile
    try {
      const { notifyAllAdmins } = await import('@/services/notificationServices')
      await notifyAllAdmins({
        type: 'personal',
        category: 'village_submission',
        title: `Pendaftaran Desa Baru: ${namaDesa}`,
        description: `Sebuah desa baru telah mendaftar: ${namaDesa}. Silakan verifikasi profil desa ini.`,
        actionType: 'profile',
        relatedId: targetUserId,
      })
    } catch (notifErr) {
      console.error('Error notifying admins about new village profile:', notifErr)
    }

    return new NextResponse(
      JSON.stringify({ 
        message: 'Profil desa berhasil dibuat', 
        villageId: villageId 
      }, null, 2),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error creating village profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
