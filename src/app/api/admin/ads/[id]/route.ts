import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

type Params = Promise<{ id: string }>

// GET /api/admin/ads/[id]
// Retrieve a specific ad by ID - requires admin role
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ['admin'])
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { message: 'Ad ID is required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()

    // Build query - try to find by ObjectId or string ID
    const query: any = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id }

    const ad = await db.collection('ads').findOne(query)

    if (!ad) {
      return NextResponse.json(
        { message: 'Iklan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        message: 'Ad retrieved successfully',
        data: ad,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error retrieving ad:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/ads/[id]
// Delete a specific ad by ID - requires admin role
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ['admin'])
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { message: 'Ad ID is required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()

    const query: any = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { _id: id }

    const result = await db.collection('ads').deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: 'Iklan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Ad deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting ad:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
