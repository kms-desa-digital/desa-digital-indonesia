import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { verifyRoleFromToken } from '@/lib/auth/verifyRole'
import { ObjectId } from 'mongodb'
import { getCachedData, setCachedData } from '@/lib/utils/cache'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify Firebase ID Token and retrieve role (checked in Firestore fallback if missing in MongoDB)
    const { uid, role, email } = await verifyRoleFromToken(authHeader)

    if (!uid) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 })
    }

    // Check Redis cache first
    const meCacheKey = `cache:auth:me:${uid}`
    const cachedMe = await getCachedData<any>(meCacheKey)
    if (cachedMe) {
      return NextResponse.json(cachedMe, { status: 200 })
    }

    const db = await connectToDatabase()
    
    // Cari user detail di MongoDB menggunakan UID dari Firebase
    let user = await db.collection('users').findOne({
      $or: [
        { uid: uid },
        { firebaseUid: uid },
        { id: uid },
        { _id: uid as any }
      ]
    })

    // Auto-sync: Jika user tidak ada di MongoDB tetapi token valid (berarti ada di Firebase/Firestore)
    if (!user) {
      console.log(`[Auth/Me] User ${uid} not found in MongoDB. Auto-syncing from Firebase info...`)
      const newUser = {
        uid: uid,
        firebaseUid: uid,
        email: email || '',
        role: role,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      try {
        const result = await db.collection('users').insertOne(newUser)
        user = { ...newUser, _id: result.insertedId } as any
      } catch (insertError) {
        console.error('[Auth/Me] Failed to auto-sync user to MongoDB:', insertError)
        // Fallback: create a temporary user object so the request can continue
        user = newUser as any
      }
    } else if (role !== 'guest' && user.role !== role) {
      console.log(`[Auth/Me] Syncing user role for ${uid} in MongoDB: ${user.role} -> ${role}`)
      try {
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { role: role, updatedAt: new Date() } }
        )
        user.role = role
      } catch (updateError) {
        console.error('[Auth/Me] Failed to sync user role in MongoDB:', updateError)
      }
    }

    const userIdString = user?._id ? user._id.toString() : uid

    // Ambil info tambahan (status verifikasi inovator/desa)
    // Cek di MongoDB karena Admin sekarang hanya memverifikasi di MongoDB
    const innovator = await db.collection('innovators').findOne({ 
      $or: [
        { userId: userIdString },
        { userId: uid }, // Add this to handle Firebase UID in userId field
        { firebaseUid: uid },
        { _id: uid as any },
        ...(ObjectId.isValid(userIdString) ? [{ _id: new ObjectId(userIdString) }] : [])
      ]
    })
    
    const village = await db.collection('villages').findOne({ 
      $or: [
        { userId: userIdString },
        { userId: uid }, // Add this to handle Firebase UID in userId field
        { firebaseUid: uid },
        { _id: uid as any },
        ...(ObjectId.isValid(userIdString) ? [{ _id: new ObjectId(userIdString) }] : [])
      ]
    })
    
    // Cek apakah ada inovasi yang sudah terverifikasi oleh user ini
    const verifiedInno = await db.collection('innovations').findOne({ 
      innovatorId: { $in: [userIdString, uid] }, 
      status: 'Terverifikasi' 
    })

    const responsePayload = {
      user: {
        uid: userIdString,
        firebaseUid: uid,
        email: user?.email || email,
        role: role !== 'guest' ? role : (user?.role || role),
        isInnovatorVerified: innovator?.status === 'Terverifikasi',
        isVillageVerified: village?.status === 'Terverifikasi',
        isInnovationVerified: !!verifiedInno,
      }
    }

    // Cache selama 30 detik
    await setCachedData(meCacheKey, responsePayload, 30)

    return NextResponse.json(responsePayload, { status: 200 })

  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
