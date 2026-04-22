import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

type Params = Promise<{ id: string }>

// =========================================================
// GET /api/notifications/:id
// Fetch a single notification by ID
// =========================================================
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["innovator", "village", "admin", "kementerian"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: 'Notification ID is required' }, { status: 400 })
    }

    const db = await connectToDatabase()

    let query: any = {}
    if (ObjectId.isValid(id)) {
      query = { $and: [{ _id: new ObjectId(id) }, { userId: auth.uid }] }
    } else {
      query = { $and: [{ _id: id }, { userId: auth.uid }] }
    }

    const notification = await db.collection('notifications').findOne(query)
    if (!notification) {
      return NextResponse.json(
        { message: 'Notifikasi tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        notification: {
          ...notification,
          id: notification._id.toString(),
          _id: notification._id.toString()
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching notification:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// PATCH /api/notifications/:id
// Mark notification as read
// =========================================================
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["innovator", "village", "admin", "kementerian"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: 'Notification ID is required' }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Build query to find notification by ID and ensure user owns it
    let query: any = {}
    if (ObjectId.isValid(id)) {
      query = { $and: [{ _id: new ObjectId(id) }, { userId: auth.uid }] }
    } else {
      query = { $and: [{ _id: id }, { userId: auth.uid }] }
    }

    const notification = await db.collection('notifications').findOne(query)
    if (!notification) {
      return NextResponse.json(
        { message: 'Notifikasi tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      )
    }

    const result = await db.collection('notifications').updateOne(
      query,
      { $set: { isRead: true, readAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Notifikasi tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(
      { message: 'Notifikasi berhasil ditandai sebagai sudah dibaca' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// DELETE /api/notifications/:id
// Delete a notification
// =========================================================
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["innovator", "village", "admin", "kementerian"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: 'Notification ID is required' }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Build query to find notification by ID and ensure user owns it
    let query: any = {}
    if (ObjectId.isValid(id)) {
      query = { $and: [{ _id: new ObjectId(id) }, { userId: auth.uid }] }
    } else {
      query = { $and: [{ _id: id }, { userId: auth.uid }] }
    }

    const result = await db.collection('notifications').deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: 'Notifikasi tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Notifikasi berhasil dihapus' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
