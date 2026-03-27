import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string)

    const db = await connectToDatabase()

    // Cari user dan cek role innovator
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) }
    )

    if (!user || user.role !== 'innovator') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Ambil data innovator
    const innovator = await db.collection('innovators').findOne(
      { userId: user._id.toString() },
      { projection: { userId: 0 } } // exclude userId
    )

    if (!innovator) {
      return NextResponse.json({ message: 'Innovator profile not found' }, { status: 404 })
    }

    // Hitung inovasi milik innovator ini
    const totalInnovations = await db.collection('innovations').countDocuments({
      innovatorId: user._id.toString()
    })

    // Hitung inovasi berdasarkan status
    const verifiedInnovations = await db.collection('innovations').countDocuments({
      innovatorId: user._id.toString(),
      status: 'Terverifikasi'
    })

    const pendingInnovations = await db.collection('innovations').countDocuments({
      innovatorId: user._id.toString(),
      status: 'Menunggu'
    })

    const rejectedInnovations = await db.collection('innovations').countDocuments({
      innovatorId: user._id.toString(),
      status: 'Ditolak'
    })

    return NextResponse.json({
      innovator,
      totalInnovations,
      verifiedInnovations,
      pendingInnovations,
      rejectedInnovations
    })
  } catch (error) {
    console.error('Error fetching innovator dashboard:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}