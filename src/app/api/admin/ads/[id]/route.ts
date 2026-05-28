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
      { message: 'Ad retrieved successfully', data: ad },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error retrieving ad:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/ads/[id]
// Toggle the isVisible field of a specific ad - requires admin role
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
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

    const body = await request.json()

    if (typeof body.isVisible !== 'boolean') {
      return NextResponse.json(
        { message: 'isVisible must be a boolean' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()

    const query: any = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { _id: id }

    const result = await db.collection('ads').updateOne(query, {
      $set: { isVisible: body.isVisible, updatedAt: new Date() },
    })

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: 'Iklan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Ad visibility updated', data: { isVisible: body.isVisible } },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating ad visibility:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
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
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

type EditAdsBody = {
  name?: string
  minDate?: string
  maxDate?: string
  link?: string
  image?: string
  status?: string
}

// PUT /api/admin/ads/[id]
// Update an existing ad - requires admin role
export async function PUT(request: NextRequest, { params }: { params: Params }) {
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

    const body: EditAdsBody = await request.json().catch(() => ({}))

    // Check if at least one field is being updated
    const hasUpdateFields = body.name || body.minDate || body.maxDate || body.link || body.image !== undefined || body.status
    if (!hasUpdateFields) {
      return NextResponse.json(
        { message: 'At least one field must be provided for update' },
        { status: 400 }
      )
    }

    // Validate dates if provided
    if (body.minDate || body.maxDate) {
      const minDate = body.minDate ? new Date(body.minDate) : null
      const maxDate = body.maxDate ? new Date(body.maxDate) : null

      if (minDate && isNaN(minDate.getTime())) {
        return NextResponse.json(
          { message: 'Invalid minDate format' },
          { status: 400 }
        )
      }

      if (maxDate && isNaN(maxDate.getTime())) {
        return NextResponse.json(
          { message: 'Invalid maxDate format' },
          { status: 400 }
        )
      }

      if (minDate && maxDate && minDate >= maxDate) {
        return NextResponse.json(
          { message: 'Start date must be before end date' },
          { status: 400 }
        )
      }
    }

    // Validate link format if provided
    if (body.link) {
      try {
        new URL(body.link)
      } catch {
        return NextResponse.json(
          { message: 'Invalid link format' },
          { status: 400 }
        )
      }
    }

    // Validate status if provided
    const validStatuses = ['Menunggu', 'Ditampilkan', 'Selesai']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()

    // Build update payload
    const updatePayload: any = {
      updatedAt: new Date(),
    }

    if (body.name) updatePayload.name = body.name.trim()
    if (body.minDate) updatePayload.minDate = new Date(body.minDate)
    if (body.maxDate) updatePayload.maxDate = new Date(body.maxDate)
    if (body.link) updatePayload.link = body.link.trim()
    if (body.image !== undefined) updatePayload.image = body.image
    if (body.status) updatePayload.status = body.status

    // Find and update ad
    const query: any = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { _id: id }

    const result = await db.collection('ads').findOneAndUpdate(
      query,
      { $set: updatePayload },
      { returnDocument: 'after' }
    )

    // Handle perbedaan struktur return dari driver MongoDB versi lama (.value) vs versi baru (langsung document)
    const updatedAd = result?.value || result;

    if (!updatedAd || !updatedAd._id) {
      return NextResponse.json(
        { message: 'Iklan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        message: 'Iklan berhasil diperbarui',
        adId: id,
        ad: updatedAd,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating ad:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
