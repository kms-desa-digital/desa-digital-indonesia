import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { ObjectId } from 'mongodb'

// Compute what an ad's status SHOULD be based on its date range
function computeStatus(minDate: Date, maxDate: Date, now: Date): string {
  if (now < minDate) return 'Menunggu'
  if (now > maxDate) return 'Selesai'
  return 'Ditampilkan'
}

type QueryParams = {
  page?: string
  limit?: string
  status?: string
  search?: string
}

// GET /api/admin/ads/
// Retrieve all ads with optional filtering and pagination - requires admin role.
// Also auto-syncs ad statuses based on date ranges before returning results.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin'])
    if (auth instanceof NextResponse) return auth

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { message: 'Page and limit must be greater than 0' },
        { status: 400 }
      )
    }

    if (limit > 100) {
      return NextResponse.json(
        { message: 'Limit cannot exceed 100' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const now = new Date()

    // ── Auto-sync statuses based on date ─────────────────────────────────
    // Fetch all ads (no filter) to determine which need status updates
    const allAds = await db.collection('ads').find({}).toArray()

    const bulkOps: any[] = []
    for (const ad of allAds) {
      const minDate = ad.minDate instanceof Date ? ad.minDate : new Date(ad.minDate)
      const maxDate = ad.maxDate instanceof Date ? ad.maxDate : new Date(ad.maxDate)
      const correctStatus = computeStatus(minDate, maxDate, now)

      if (ad.status !== correctStatus) {
        bulkOps.push({
          updateOne: {
            filter: { _id: ad._id },
            update: { $set: { status: correctStatus, updatedAt: now } },
          },
        })
      }
    }

    if (bulkOps.length > 0) {
      await db.collection('ads').bulkWrite(bulkOps)
    }
    // ─────────────────────────────────────────────────────────────────────

    // Build query filter
    const filter: any = {}

    if (status) {
      const validStatuses = ['Menunggu', 'Ditampilkan', 'Selesai']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      filter.status = status
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { link: { $regex: search, $options: 'i' } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count
    const total = await db.collection('ads').countDocuments(filter)

    // Get ads
    const ads = await db
      .collection('ads')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json(
      {
        message: 'Ads retrieved successfully',
        data: ads,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error retrieving ads:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
