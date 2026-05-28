import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

// =========================================================
// GET /api/notifications
// Fetch user's notifications with optional type filter
// Query: ?type=general|personal&limit=20&skip=0
// =========================================================
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["innovator", "village", "admin", "kementerian"]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'general' or 'personal' or null for all
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = parseInt(searchParams.get('skip') || '0')

    const db = await connectToDatabase()
    const filter: any = { userId: auth.uid }

    if (type) {
      filter.type = type
    }
    if (category && category !== 'all') {
      // Handle legacy smart mapping for categories
      if (category === 'claim_submission') {
          filter.$or = [
              { category: 'claim_submission' },
              { category: { $in: [null, 'profile_submission', 'submission_status'] }, title: { $regex: /klaim/i } }
          ]
      } else if (category === 'innovation_submission') {
          filter.$or = [
              { category: 'innovation_submission' },
              { category: { $in: [null, 'profile_submission', 'submission_status'] }, title: { $regex: /^(?!.*klaim).*inovasi/i } }
          ]
      } else if (category === 'village_submission') {
          filter.$or = [
              { category: 'village_submission' },
              { category: { $in: [null, 'profile_submission', 'submission_status'] }, title: { $regex: /profil desa|pengajuan desa|pendaftaran desa/i } }
          ]
      } else if (category === 'innovator_submission') {
          filter.$or = [
              { category: 'innovator_submission' },
              { category: { $in: [null, 'profile_submission', 'submission_status'] }, title: { $regex: /innovator|inovator/i } }
          ]
      } else {
          filter.category = category
      }
    }

    let query = db.collection('notifications').find(filter).sort({ createdAt: -1 })

    // Get total count for pagination metadata
    const total = await db.collection('notifications').countDocuments(filter)

    if (skip > 0) query = query.skip(skip)
    if (limit > 0) query = query.limit(limit)

    const notifications = await query.toArray()

    const result = notifications.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }))

    const unreadFilter: any = {
      userId: auth.uid,
      isRead: false,
      ...(type && { type })
    }

    if (category && category !== 'all') {
        if (filter.$or) {
            unreadFilter.$or = filter.$or;
        } else {
            unreadFilter.category = category;
        }
    }

    const unreadCount = await db.collection('notifications').countDocuments(unreadFilter)

    return NextResponse.json(
      {
        notifications: result,
        pagination: {
          total,
          limit,
          skip,
          hasMore: total > skip + result.length
        },
        unreadCount
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// POST /api/notifications
// Create a new notification (internal use)
// Body: { userId, type, title, description, actionType, relatedId, actionUrl? }
// =========================================================
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const {
      userId,
      type, // 'general' or 'personal'
      title,
      description,
      actionType, // 'innovation_detail', 'claim_detail', 'profile', 'dashboard'
      relatedId,
      actionUrl
    } = body

    // Validate required fields
    if (!userId || !type || !title || !description || !actionType) {
      return NextResponse.json(
        { message: 'Required fields: userId, type, title, description, actionType' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()

    const newNotification = {
      ...body,
      userId,
      type,
      title,
      description,
      isRead: false,
      actionType,
      relatedId: relatedId || null,
      actionUrl: actionUrl || null,
      createdAt: new Date(),
    }

    const result = await db.collection('notifications').insertOne(newNotification)

    return NextResponse.json(
      {
        message: 'Notifikasi berhasil dibuat',
        notificationId: result.insertedId.toString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
