import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { notifyAllAdmins } from '@/services/notificationServices'

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
    const category    = searchParams.get('category')
    const status      = searchParams.get('status')
    const innovatorId = searchParams.get('innovatorId')
    const search      = searchParams.get('search')
    const limitVal    = parseInt(searchParams.get('limit') || '0')
    const skipVal     = parseInt(searchParams.get('skip') || '0')

    const db = await connectToDatabase()
    const filter: Record<string, any> = {}

    if (category)    filter.kategori    = category
    if (status)      filter.status      = status
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

    return NextResponse.json({ 
      innovations: result,
      pagination: {
        total: totalCount,
        totalPages,
        limit: limitVal,
        skip: skipVal
      }
    }, { status: 200 })
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
    } = body

    // Validasi field wajib
    if (!namaInovasi || !kategori || !tahunDibuat || !deskripsi || !innovatorId) {
      return NextResponse.json(
        { message: 'Field wajib tidak lengkap: namaInovasi, kategori, tahunDibuat, deskripsi, innovatorId' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()

    const newInnovation = {
      ...body,
      status:               'Menunggu',   // status verifikasi admin
      catatanAdmin:         null,
      createdAt:            new Date(),
      editedAt:             new Date(),
    }

    const result = await db.collection('innovations').insertOne(newInnovation)

    const innovationId = result.insertedId.toString()

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
        message:      'Inovasi berhasil ditambahkan, menunggu verifikasi admin',
        innovationId: innovationId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating innovation:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
