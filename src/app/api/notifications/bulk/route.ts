import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

// =========================================================
// PATCH /api/notifications/bulk
// Tandai semua notifikasi milik user sebagai telah dibaca
// =========================================================
export async function PATCH(request: NextRequest) {
  try {
    // Bisa dipanggil oleh semua role selama login valid
    const auth = await requireRole(request, ["innovator", "village", "admin", "kementerian", "guest"]);
    if (auth instanceof NextResponse) return auth;

    const db = await connectToDatabase()

    const result = await db.collection('notifications').updateMany(
      { userId: auth.uid, isRead: false },
      { $set: { isRead: true } }
    )

    return NextResponse.json(
      {
        message: 'Semua notifikasi berhasil ditandai sudah dibaca',
        modifiedCount: result.modifiedCount,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// DELETE /api/notifications/bulk
// Hapus semua notifikasi milik user
// =========================================================
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["innovator", "village", "admin", "kementerian", "guest"]);
    if (auth instanceof NextResponse) return auth;

    const db = await connectToDatabase()

    const result = await db.collection('notifications').deleteMany({
      userId: auth.uid
    })

    return NextResponse.json(
      {
        message: 'Semua notifikasi berhasil dihapus',
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting all notifications:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
