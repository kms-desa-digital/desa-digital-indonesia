import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { validateWordLimit } from '@/lib/utils/wordCount'

// GET /api/innovator
// Ambil semua profil inovator.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const kategori = searchParams.get('kategori')
    const limitVal = parseInt(searchParams.get('limit') || '0')
    const skipVal = parseInt(searchParams.get('skip') || '0')

    const db = await connectToDatabase()
    const filter: any = {}

    if (status) filter.status = status
    if (kategori) filter.kategori = kategori

    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.namaInovator = { $regex: escapedSearch, $options: 'i' }
    }

    const pipeline: any[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'innovations',
          let: { innovator_id: { $toString: '$_id' }, user_id: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ['$innovatorId', '$$innovator_id'] },
                        { $eq: ['$innovatorId', '$$user_id'] }
                      ]
                    },
                    { $eq: ['$status', 'Terverifikasi'] }
                  ]
                }
              }
            }
          ],
          as: 'allInnovations'
        }
      },
      {
        $addFields: {
          // Count all verified innovations
          jumlahInovasi: { $size: '$allInnovations' },

          // Extract and unwind desaId to count unique villages
          uniqueDesas: {
            $reduce: {
              input: '$allInnovations',
              initialValue: [],
              in: { $setUnion: ['$$value', { $ifNull: ['$$this.desaId', []] }] }
            }
          }
        }
      },
      {
        $addFields: {
          jumlahDesaDampingan: { $size: '$uniqueDesas' }
        }
      },
      { $sort: { createdAt: -1 } }
    ]

    if (skipVal > 0) pipeline.push({ $skip: skipVal })
    if (limitVal > 0) pipeline.push({ $limit: limitVal })

    const innovators = await db
      .collection('innovators')
      .aggregate(pipeline)
      .toArray()

    const result = innovators.map((doc) => ({
      ...doc,
      id: doc._id?.toString ? doc._id.toString() : doc._id,
      _id: doc._id?.toString ? doc._id.toString() : doc._id,
    }))

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    console.error('Error fetching innovators:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/innovator
// Create innovator profile in MongoDB using Firebase authentication.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["innovator", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json()
    // For admin, targetId is passed in body. For innovator, use auth.uid
    const targetId = auth.role === "admin" ? body.targetId : auth.uid;

    if (!targetId) {
      return NextResponse.json({ message: 'Target Innovator ID is required' }, { status: 400 })
    }

    const {
      namaInovator,
      deskripsi,
      kategori,
      whatsapp,
      instagram,
      website,
      logo,
      header,
      desaId,
      jumlahInovasi,
      jumlahDesaDampingan,
      status,
    } = body

    if (!namaInovator || !deskripsi || !kategori || !whatsapp || !logo || !header) {
      return NextResponse.json(
        {
          message:
            'Field wajib tidak lengkap.',
        },
        { status: 400 }
      )
    }

    try {
      validateWordLimit(namaInovator, 10, 'nama inovator');
      validateWordLimit(deskripsi, 80, 'deskripsi');
    } catch (validationError: any) {
      return NextResponse.json({ message: validationError.message }, { status: 400 });
    }

    const db = await connectToDatabase()

    // 1. Validasi keberadaan user dan role di database
    const targetUser = await db.collection('users').findOne({
      $or: [
        { uid: targetId },
        { firebaseUid: targetId },
        { id: targetId },
        { _id: targetId as any }
      ]
    })
    if (!targetUser) {
      return NextResponse.json({ message: 'User tidak ditemukan di sistem' }, { status: 400 })
    }
    if (targetUser.role !== 'innovator') {
      return NextResponse.json({ message: 'Peran pengguna haruslah inovator (innovator)' }, { status: 400 })
    }

    const innovatorCollection = db.collection('innovators')

    // Validasi apakah profil dengan targetId tersebut sudah ada
    const existingDoc = await innovatorCollection.findOne({
      $or: [{ _id: targetId }, { userId: targetId }]
    })

    if (existingDoc) {
      return NextResponse.json({ message: 'Profil inovator sudah ada. Gunakan metode PUT untuk mengupdate.' }, { status: 409 })
    }

    const now = new Date()

    const newDoc = {
      _id: targetId,
      ...body,
      userId: targetId,
      namaInovator,
      deskripsi,
      kategori,
      whatsapp,
      instagram: instagram ?? '',
      website: website ?? '',
      logo: logo ?? null,
      header: header ?? null,
      desaId: Array.isArray(desaId) ? desaId : (desaId ? [desaId] : []),
      jumlahInovasi: typeof jumlahInovasi === 'number' ? jumlahInovasi : 0,
      jumlahDesaDampingan: typeof jumlahDesaDampingan === 'number' ? jumlahDesaDampingan : 0,
      status: status ?? 'Menunggu',
      catatanAdmin: '',
      editedAt: now,
      createdAt: now,
    }

    await innovatorCollection.insertOne(newDoc)

    // Notify all admins about new registered innovator profile
    try {
      const { notifyAllAdmins } = await import('@/services/notificationServices')
      await notifyAllAdmins({
        type: 'personal',
        category: 'innovator_submission',
        title: `Pendaftaran Innovator Baru: ${namaInovator}`,
        description: `Seorang innovator baru telah mendaftar: ${namaInovator}. Silakan verifikasi profil ini.`,
        actionType: 'profile',
        relatedId: targetId,
      })
    } catch (notifErr) {
      console.error('Error notifying admins about new innovator profile:', notifErr)
    }

    return NextResponse.json(
      {
        message: 'Profil inovator berhasil dibuat',
        profile: { ...newDoc, id: newDoc._id.toString() },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error saving innovator profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
