// app/api/admin/verify/claims/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

type Params = Promise<{ id: string }>

type VerifyBody = {
  status?: string
  catatanAdmin?: string | null
}

// POST /api/admin/verify/claims/:id
// Verifikasi atau tolak klaim inovasi oleh admin.
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Claim ID is required' }, { status: 400 })
    }

    const body: VerifyBody = await request.json().catch(() => ({}))
    const desiredStatus = body.status === 'Ditolak' ? 'Ditolak' : 'Terverifikasi'
    const catatanAdmin = body.catatanAdmin ?? null

    const db = await connectToDatabase()

    // Query for the claim
    let query: any = {}
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id)
    } else {
      query = { $or: [{ _id: id as any }, { id: id as any }] }
    }

    const claim = await db.collection('claimInnovations').findOne(query)
    if (!claim) {
      return NextResponse.json({ message: 'Klaim tidak ditemukan' }, { status: 404 })
    }

    const updatePayload: any = {
      status: desiredStatus,
      catatanAdmin,
      updatedAt: new Date(),
    }

    if (desiredStatus === 'Terverifikasi') {
      updatePayload.verifiedAt = new Date()
    }

    const result = await db.collection('claimInnovations').updateOne(query, { $set: updatePayload })
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Klaim tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(
      {
        message:
          desiredStatus === 'Terverifikasi'
            ? 'Klaim inovasi berhasil diverifikasi'
            : 'Klaim inovasi berhasil ditolak',
        claimId: id,
        status: desiredStatus,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying claim:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}