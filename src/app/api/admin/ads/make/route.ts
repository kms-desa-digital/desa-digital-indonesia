import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

type CreateAdsBody = {
  name: string
  minDate: string
  maxDate: string
  link: string
  image?: string
  status?: string
}

// POST /api/admin/ads/make
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin'])
    if (auth instanceof NextResponse) return auth

    const body: CreateAdsBody = await request.json().catch(() => ({}))

    if (!body.name || !body.minDate || !body.maxDate || !body.link) {
      return NextResponse.json(
        { message: 'Missing required fields: name, minDate, maxDate, link' },
        { status: 400 }
      )
    }

    const minDate = new Date(body.minDate)
    const maxDate = new Date(body.maxDate)

    if (isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
      return NextResponse.json({ message: 'Invalid date format' }, { status: 400 })
    }

    if (minDate >= maxDate) {
      return NextResponse.json(
        { message: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    try {
      new URL(body.link)
    } catch {
      return NextResponse.json({ message: 'Invalid link format' }, { status: 400 })
    }

    const db = await connectToDatabase()

    const adData = {
      name: body.name.trim(),
      minDate,
      maxDate,
      link: body.link.trim(),
      image: body.image || null,
      status: body.status || 'Menunggu',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('ads').insertOne(adData)

    return NextResponse.json(
      { message: 'Iklan berhasil dibuat', adId: result.insertedId, ad: { _id: result.insertedId, ...adData } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating ad:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}