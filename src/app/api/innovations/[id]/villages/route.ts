import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

type Params = Promise<{ id: string }>

// =========================================================
// GET /api/innovations/[id]/villages
// Mengambil daftar desa yang telah menerapkan inovasi tertentu
// =========================================================
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params

    const db = await connectToDatabase()
    
    // 1. Cari inovasi untuk mendapatkan array desaId
    const query: any = ObjectId.isValid(id) 
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const innovation = await db.collection('innovations').findOne(query)

    if (!innovation) {
      return NextResponse.json({ message: 'Inovasi tidak ditemukan' }, { status: 404 })
    }

    const desaIds = innovation.desaId || []

    if (desaIds.length === 0) {
      return NextResponse.json({ villages: [] }, { status: 200 })
    }

    // 2. Cari detail desa dari koleksi 'villages' atau 'users'
    // Mengasumsikan ada koleksi 'villages' yang menyimpan profil desa
    // Jika tidak ada, kita fallback ke 'users' dengan filter role: village
    const villageDocs = await db.collection('villages')
      .find({
        $or: [
          { _id: { $in: desaIds.map((did: string) => ObjectId.isValid(did) ? new ObjectId(did) : did) } },
          { userId: { $in: desaIds } } // Kadang disimpan berdasarkan userId string
        ]
      })
      .toArray()

    // Map ke format yang diinginkan frontend
    const result = villageDocs.map(doc => ({
      id: doc._id.toString(),
      userId: doc.userId || doc._id.toString(),
      namaDesa: doc.namaDesa || 'Desa Tanpa Nama',
      logo: doc.logo || null,
      provinsi: doc.provinsi,
      kabupaten: doc.kabupaten,
      kecamatan: doc.kecamatan,
    }))

    return NextResponse.json({ villages: result }, { status: 200 })
  } catch (error) {
    console.error('Error fetching applied villages:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
