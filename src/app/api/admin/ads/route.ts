import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

type QueryParams = {
  page?: string
  limit?: string
  status?: string
  search?: string
}

// GET /api/admin/ads/
// Retrieve all ads with optional filtering and pagination - requires admin role
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

// test