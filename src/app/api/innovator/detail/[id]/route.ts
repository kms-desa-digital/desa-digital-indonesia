import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

type Params = Promise<{ id: string }>

// GET /api/innovator/detail/:id
// Ambil detail profil inovator berdasarkan id.
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: 'Innovator ID is required' }, { status: 400 })
    }

    const db = await connectToDatabase()
    const query: any = { 
      $or: [
        ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : []),
        { _id: id },
        { userId: id }
      ] 
    }

    const innovators = await db.collection('innovators').aggregate([
      { $match: query },
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
          jumlahDesaDampingan: { $size: '$uniqueDesas' }
        }
      }
    ]).toArray()

    const innovator = innovators[0]

    if (!innovator) {
      return NextResponse.json({ message: 'Innovator tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(
      { innovator: { ...innovator, id: innovator._id.toString(), _id: innovator._id.toString() } },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching innovator detail:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
