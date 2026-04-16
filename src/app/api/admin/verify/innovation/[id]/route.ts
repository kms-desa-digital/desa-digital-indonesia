// app/api/admin/verify/innovation/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

type Params = Promise<{ id: string }>

type VerifyBody = {
  status?: string
  catatanAdmin?: string | null
}

// POST /api/admin/verify/innovation/:id
// Verifikasi atau tolak inovasi oleh admin.
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Innovation ID is required' }, { status: 400 })
    }

    const body: VerifyBody = await request.json().catch(() => ({}))
    const desiredStatus = body.status === 'Ditolak' ? 'Ditolak' : 'Terverifikasi'
    const catatanAdmin = body.catatanAdmin ?? null

    const db = await connectToDatabase()
    const query: any = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { userId: id }] }
      : { userId: id }

    const innovation = await db.collection('innovations').findOne(query)
    if (!innovation) {
      return NextResponse.json({ message: 'Inovasi tidak ditemukan' }, { status: 404 })
    }

    const updatePayload: any = {
      status: desiredStatus,
      catatanAdmin,
      editedAt: new Date(),
    }

    if (desiredStatus === 'Terverifikasi') {
      updatePayload.verifiedAt = new Date()
    }

    const result = await db.collection('innovations').updateOne(query, { $set: updatePayload })
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Inovasi tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(
      {
        message:
          desiredStatus === 'Terverifikasi'
            ? 'Inovasi berhasil diverifikasi'
            : 'Inovasi berhasil ditolak',
        innovationId: id,
        status: desiredStatus,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying innovation:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}