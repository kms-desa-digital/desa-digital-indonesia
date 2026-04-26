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
    
    // 1. Ambil desaId dari koleksi 'claimInnovations' (Reguler)
    const claims = await db.collection('claimInnovations')
      .find({
        inovasiId: id,
        status: 'Terverifikasi'
      }, { projection: { desaId: 1 } })
      .toArray()

    const claimDesaIds = claims.map(c => c.desaId);

    // 2. Cari inovasi untuk mendapatkan array desaId (Direct Assignment/Legacy)
    const innovQuery: any = ObjectId.isValid(id) 
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const innovation = await db.collection('innovations').findOne(innovQuery)
    const directDesaIds = innovation?.desaId || []

    // Gabungkan dan hilangkan duplikasi
    const allDesaIds = Array.from(new Set([...claimDesaIds, ...directDesaIds]));

    if (allDesaIds.length === 0) {
      return NextResponse.json({ villages: [] }, { status: 200 })
    }

    // 3. Cari detail desa dari koleksi 'villages'
    const villageDocs = await db.collection('villages')
      .find({
        $or: [
          { _id: { $in: allDesaIds.map((did: string) => ObjectId.isValid(did) ? new ObjectId(did) : did) } },
          { userId: { $in: allDesaIds } }
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
