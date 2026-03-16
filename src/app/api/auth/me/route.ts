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
    
    // Cari user detail
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    )

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Ambil info tambahan (status verifikasi inovator/desa)
    const innovator = await db.collection('innovators').findOne({ userId: user._id.toString() })
    const village = await db.collection('villages').findOne({ userId: user._id.toString() })
    
    // Cek apakah ada inovasi yang sudah terverifikasi oleh user ini
    const verifiedInno = await db.collection('innovations').findOne({ 
      innovatorId: user._id.toString(), 
      status: 'Terverifikasi' 
    })

    return NextResponse.json({
      user: {
        uid: user._id.toString(),
        email: user.email,
        role: user.role,
        isInnovatorVerified: innovator?.status === 'Terverifikasi',
        isVillageVerified: village?.status === 'Terverifikasi',
        isInnovationVerified: !!verifiedInno,
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }
}
