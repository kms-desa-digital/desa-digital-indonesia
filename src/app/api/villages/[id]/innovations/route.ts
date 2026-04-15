import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

type Params = Promise<{ id: string }>

// =========================================================
// GET /api/villages/[id]/innovations
// Mengambil daftar inovasi yang telah diterapkan oleh desa tertentu
// =========================================================
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const db = await connectToDatabase()

    // 1. Ambil inovasi dari koleksi 'innovations' yang memiliki desaId ini
    const innovations = await db.collection('innovations')
      .find({
        desaId: { $in: [id] },
        status: 'Terverifikasi'
      })
      .toArray()

    // 2. Ambil klaim manual dari koleksi 'claimInnovations' yang terverifikasi dan tidak punya inovasiId
    // (Jika punya inovasiId, seharusnya sudah ada di list di atas melalui desaId)
    const manualClaims = await db.collection('claimInnovations')
      .find({
        desaId: id,
        status: 'Terverifikasi',
        inovasiId: { $in: [null, ""] }
      })
      .toArray()

    // Gabungkan hasil
    const result_innovations = innovations.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }))

    const result_claims = manualClaims.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
      namaInovasi: doc.namaInovasi,
      namaInnovator: doc.namaInovator,
      deskripsi: doc.deskripsiInovasi,
      images: doc.fotoInovasi ? [doc.fotoInovasi] : (doc.buktiFiles?.foto || []),
      status: 'Terverifikasi'
    }))

    const finalResult = [...result_innovations, ...result_claims]

    return new NextResponse(
      JSON.stringify({ innovations: finalResult, total: finalResult.length }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error fetching village innovations:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
