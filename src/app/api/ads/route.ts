import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'

// GET /api/ads
// Public endpoint — returns ads that are currently active based on date range.
// Does NOT rely on the stored status field since status is not auto-updated in DB.
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const now = new Date()

    // Find ads whose date range covers today, regardless of stored status.
    // This handles the case where admin hasn't manually changed status yet.
    const ads = await db
      .collection('ads')
      .find({
        minDate: { $lte: now },
        maxDate: { $gte: now },
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json(
      {
        message: 'Active ads retrieved successfully',
        data: ads,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error retrieving active ads:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
