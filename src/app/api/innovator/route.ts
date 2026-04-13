import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'

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
                  $or: [
                    { $eq: ['$innovatorId', '$$innovator_id'] },
                    { $eq: ['$innovatorId', '$$user_id'] }
                  ]
                }
              }
            },
            { $unwind: { path: '$desaId', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$desaId' } }
          ],
          as: 'uniqueDesas'
        }
      },
      {
        $addFields: {
          // override the static field with the calculated one if innovations exist
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
