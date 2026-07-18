import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { notifyAllAdmins } from '@/services/notificationServices'
import { validateWordLimit } from '@/lib/utils/wordCount'
import { getCachedData, setCachedData, invalidateCachePattern, invalidateCacheKeys } from '@/lib/utils/cache'

// Opt out of Next.js static caching so jumlahDesa always reflects live DB state
export const dynamic = 'force-dynamic'

// =========================================================
// GET /api/innovations
// Mengambil semua inovasi, support query:
//   ?category=<nama_kategori>  → filter by kategori
//   ?status=<Terverifikasi|Menunggu|Ditolak>  → filter by status
//   ?innovatorId=<id>  → filter by innovator
//   ?search=<keyword> → filter by nama inovasi / deskripsi / nama innovator
//   ?limit=<n> & ?skip=<n>
// =========================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const innovatorId = searchParams.get('innovatorId')
    const search = searchParams.get('search')
    const limitVal = parseInt(searchParams.get('limit') || '0')
    const skipVal = parseInt(searchParams.get('skip') || '0')

    const cacheKey = `cache:innovations:list:category=${category || 'all'}:status=${status || 'all'}:innovatorId=${innovatorId || 'all'}:search=${search || 'all'}:limit=${limitVal}:skip=${skipVal}`
    const cached = await getCachedData<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, { status: 200 })
    }

    const db = await connectToDatabase()
    const filter: Record<string, any> = {}

    if (category) filter.kategori = category
    if (status) filter.status = status
    if (innovatorId) filter.innovatorId = innovatorId

    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { namaInovasi: { $regex: escapedSearch, $options: 'i' } },
        { deskripsi: { $regex: escapedSearch, $options: 'i' } },
        { namaInnovator: { $regex: escapedSearch, $options: 'i' } },
      ]
    }

    const totalCount = await db.collection('innovations').countDocuments(filter)

    const pipeline: any[] = [
      { $match: filter },
      {
        $addFields: {
          _idStr: { $toString: "$_id" }
        }
      },
      {
        $lookup: {
          from: 'claimInnovations',
          localField: '_idStr',
          foreignField: 'inovasiId',
          as: 'allClaims',
        },
      },
      {
        $addFields: {
          jumlahDesa: {
            $size: {
              $filter: {
                input: '$allClaims',
                as: 'claim',
                cond: { $eq: ['$$claim.status', 'Terverifikasi'] },
              },
            },
          },
        },
      },
      { $project: { allClaims: 0, _idStr: 0 } },
      {
        $lookup: {
          from: 'innovators',
          let: { innovator_id: '$innovatorId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$innovator_id'] },
                    { $eq: ['$userId', '$$innovator_id'] }
                  ]
                }
              }
            }
          ],
          as: 'innovatorDetails'
        }
      },
      {
        $addFields: {
          innovatorInfo: { $arrayElemAt: ['$innovatorDetails', 0] }
        }
      },
      {
        $addFields: {
          namaInnovator: {
            $ifNull: [
              '$namaInnovator',
              {
                $ifNull: [
                  '$innovatorInfo.namaInovator',
                  { $ifNull: ['$innovatorInfo.namaInnovator', '$innovatorInfo.name'] }
                ]
              }
            ]
          },
          innovatorImgURL: {
            $ifNull: [
              '$innovatorImgURL',
              { $ifNull: ['$innovatorInfo.logo', '$innovatorInfo.imageUrl'] }
            ]
          }
        }
      },
      { $project: { innovatorDetails: 0, innovatorInfo: 0 } },
      {
        $addFields: {
          sortDate: { $ifNull: ["$updatedAt", { $ifNull: ["$editedAt", "$createdAt"] }] }
        }
      },
      { $sort: { sortDate: -1 } },
    ]

    if (skipVal > 0) pipeline.push({ $skip: skipVal })
    if (limitVal > 0) pipeline.push({ $limit: limitVal })

    const innovations = await db.collection('innovations').aggregate(pipeline).toArray()

    // Konversi _id ObjectId → string untuk kemudahan konsumsi frontend
    const result = innovations.map((doc) => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }))

    const totalPages = limitVal > 0 ? Math.ceil(totalCount / limitVal) : 1;

    const responsePayload = {
      innovations: result,
      pagination: {
        total: totalCount,
        totalPages,
        limit: limitVal,
        skip: skipVal
      }
    }

    await setCachedData(cacheKey, responsePayload, 300)

    return NextResponse.json(responsePayload, { status: 200 })
  } catch (error) {
    console.error('Error fetching innovations:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// POST /api/innovations
// Tambah inovasi baru
// =========================================================
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["innovator", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json()

    const {
      namaInovasi,
      kategori,
      tahunDibuat,
      deskripsi,
      innovatorId,
      statusInovasi,
      modelBisnis,
      inputDesaMenerapkan,
      manfaat,
      infrastruktur,
    } = body

    // Comprehensive Validation for Required Fields (matching frontend)
    if (
      !namaInovasi ||
      !kategori ||
      !tahunDibuat ||
      !deskripsi ||
      !innovatorId ||
      !statusInovasi ||
      !modelBisnis || (Array.isArray(modelBisnis) && modelBisnis.length === 0) ||
      !inputDesaMenerapkan ||
      !manfaat || (Array.isArray(manfaat) && manfaat.length === 0) ||
      !infrastruktur || (Array.isArray(infrastruktur) && infrastruktur.length === 0)
    ) {
      return NextResponse.json(
        { message: 'Field wajib tidak lengkap. Pastikan semua data bintang (*) telah diisi.' },
        { status: 400 }
      )
    }

    try {
      validateWordLimit(deskripsi, 80, 'deskripsi');
      validateWordLimit(inputDesaMenerapkan, 20, 'desa yang menerapkan');
      if (Array.isArray(modelBisnis)) {
        modelBisnis.forEach((model: string) => {
          validateWordLimit(model, 5, `model bisnis "${model}"`);
        });
      }
    } catch (validationError: any) {
      return NextResponse.json({ message: validationError.message }, { status: 400 });
    }

    const db = await connectToDatabase()

    // Validate innovator verification status
    if (auth.role !== 'admin') {
      const user = await db.collection('users').findOne({
        $or: [
          { uid: auth.uid },
          { firebaseUid: auth.uid },
          { id: auth.uid },
          { _id: auth.uid as any }
        ]
      })
      const mongoUserId = user?._id ? user._id.toString() : auth.uid

      const innovator = await db.collection('innovators').findOne({
        $or: [
          { userId: auth.uid },
          { userId: mongoUserId },
          { _id: auth.uid as any },
          { _id: mongoUserId as any }
        ]
      })

      if (!innovator || innovator.status !== 'Terverifikasi') {
        return NextResponse.json(
          { message: 'Profil Inovator Anda belum diverifikasi. Anda tidak dapat menambahkan inovasi.' },
          { status: 403 }
        )
      }
    }

    // Fetch innovator information to auto-populate missing fields
    let innovatorDoc = null
    if (innovatorId) {
      let queryId: any = innovatorId
      try {
        if (ObjectId.isValid(innovatorId)) {
          queryId = new ObjectId(innovatorId)
        }
      } catch (e) { }

      innovatorDoc = await db.collection('innovators').findOne({
        $or: [
          { _id: queryId },
          { _id: innovatorId },
          { userId: innovatorId }
        ]
      })
    }

    const finalNamaInnovator = body.namaInnovator || innovatorDoc?.namaInovator || innovatorDoc?.namaInnovator || innovatorDoc?.name || 'unknown'
    const finalInnovatorImgURL = body.innovatorImgURL || innovatorDoc?.logo || innovatorDoc?.imageUrl || null

    const newInnovation = {
      ...body,
      namaInnovator: finalNamaInnovator,
      innovatorImgURL: finalInnovatorImgURL,
      status: 'Menunggu',   // status verifikasi admin
      catatanAdmin: null,
      createdAt: new Date(),
      editedAt: new Date(),
    }

    const result = await db.collection('innovations').insertOne(newInnovation)
    const innovationId = result.insertedId.toString()

    // Invalidate list caches, recommendations cache and innovator dashboard cache
    await invalidateCachePattern('cache:innovations:list:*')
    await invalidateCachePattern('cache:recommendations:*')
    if (innovatorId) {
      await invalidateCacheKeys([
        `cache:innovator:dashboard:${innovatorId}`,
        `cache:auth:me:${innovatorId}`
      ])
    }

    // Notify admins about new innovation (innovator tidak perlu notif untuk aksi sendiri)
    try {
      await notifyAllAdmins({
        type: 'personal',
        category: 'innovation_submission',
        title: `Inovasi Baru: ${namaInovasi}`,
        description: `Innovator ${newInnovation.namaInnovator || 'unknown'} telah menambahkan inovasi baru. Silakan verifikasi pengajuan ini.`,
        actionType: 'innovation_detail',
        relatedId: innovationId,
      })
    } catch (notifError) {
      // Log notification error but don't fail the innovation creation
      console.error('Error creating notifications for innovation:', notifError)
    }

    return NextResponse.json(
      {
        message: 'Inovasi berhasil ditambahkan, menunggu verifikasi admin',
        innovationId: innovationId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating innovation:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
