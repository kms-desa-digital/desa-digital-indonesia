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

    // Cari user dan cek role admin
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) }
    )

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Ambil data dashboard
    const totalUsers = await db.collection('users').countDocuments()
    const totalInnovations = await db.collection('innovations').countDocuments()
    const totalVillages = await db.collection('villages').countDocuments()
    const totalInnovators = await db.collection('innovators').countDocuments()

    // Data lainnya bisa ditambahkan sesuai kebutuhan

    return NextResponse.json({
      totalUsers,
      totalInnovations,
      totalVillages,
      totalInnovators
    })
  } catch (error) {
    console.error('Error fetching admin dashboard:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}