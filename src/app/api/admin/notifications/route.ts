import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/apiAuth'
import { notifyRole, notifyAll } from '@/services/notificationServices'
import { connectToDatabase } from '@/lib/db/mongodb'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (auth instanceof NextResponse) return auth

    const db = await connectToDatabase()

    // Statistics fetching
    const [
      totalAnnouncements,
      totalRead,
      totalGeneral,
      totalRanking
    ] = await Promise.all([
      db.collection('notifications').countDocuments({ category: 'announcement' }),
      db.collection('notifications').countDocuments({ isRead: true }),
      db.collection('notifications').countDocuments({ type: 'general' }),
      db.collection('notifications').countDocuments({ category: 'ranking' })
    ])

    const totalNotifications = await db.collection('notifications').countDocuments()
    const readRate = totalNotifications > 0 ? Math.round((totalRead / totalNotifications) * 100) : 0

    // For growth, let's count notifications in the last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const growth = await db.collection('notifications').countDocuments({
      createdAt: { $gte: yesterday.toISOString() }
    })

    return NextResponse.json({
      stats: {
        totalAnnouncements,
        readRate: `${readRate}%`,
        rankingSent: totalRanking,
        growth: `${growth}⬆`
      }
    })
  } catch (error) {
    console.error('Error fetching notification stats:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if triggered by an external Cron Job using a secret
    const cronSecret = request.headers.get("x-cron-secret");
    const isCron = cronSecret === (process.env.CRON_SECRET || "desadigital_cron_secret_777");

    // If not a cron job, check if it's a valid Admin
    if (!isCron) {
      const auth = await requireRole(request, ["admin"])
      if (auth instanceof NextResponse) return auth
    }

    const body = await request.json()
    const {
      type, // 'broadcast_role' | 'broadcast_all' | 'trigger_ranking'
      role,
      category,
      title,
      description,
      actionType,
      relatedId
    } = body

    if (type === 'broadcast_role') {
      if (!role || !title || !description) {
        return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
      }
      await notifyRole(role, {
        type: 'general',
        category: category || 'announcement',
        title,
        description,
        actionType: actionType || 'notification_detail',
        relatedId: relatedId || null
      })
      return NextResponse.json({ message: 'Broadcast successful' })
    }

    if (type === 'broadcast_all') {
      if (!title || !description) {
        return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
      }
      await notifyAll({
        type: 'general',
        category: category || 'announcement',
        title,
        description,
        actionType: actionType || 'notification_detail',
        relatedId: relatedId || null
      })
      return NextResponse.json({ message: 'Broadcast successful' })
    }

    if (type === 'trigger_ranking') {
      // Logic for ranking broadcast
      const db = await connectToDatabase()

      // Top 3 Desa
      const villages = await db.collection('villages')
        .find({ status: 'Terverifikasi' })
        .sort({ jumlahInovasiDiterapkan: -1 })
        .limit(3)
        .toArray()

      if (villages.length > 0) {
        const villageList = villages.map((v, i) => `${i + 1}. ${v.namaDesa || 'Desa'}`).join('\n')
        await notifyAll({
          type: 'general',
          category: 'ranking',
          title: 'Top 3 Desa\nTerbaik Bulan Ini',
          description: `Selamat kepada para pemenang:\n${villageList}\n\nAtas pencapaiannya sebagai desa terbaik bulan ini!`,
          actionType: 'notification_detail'
        })
      }

      // Top 3 Innovator
      const innovators = await db.collection('innovators')
        .find({ status: 'Terverifikasi' })
        .sort({ totalInovasi: -1 })
        .limit(3)
        .toArray()

      if (innovators.length > 0) {
        const innovatorList = innovators.map((v, i) => `${i + 1}. ${v.namaInovator || v.namaLengkap || v.name || 'Innovator'}`).join('\n')
        await notifyAll({
          type: 'general',
          category: 'ranking',
          title: 'Top 3 Innovator\nTerbaik Bulan Ini',
          description: `Selamat kepada para pemenang:\n${innovatorList}\n\nAtas kontribusinya bulan ini dalam memajukan digitalisasi desa!`,
          actionType: 'notification_detail'
        })
      }

      return NextResponse.json({ message: 'Ranking broadcast successful' })
    }

    return NextResponse.json({ message: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error in Admin Notification API:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
