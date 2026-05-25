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

    // Temukan dokumen desa berdasarkan id (bisa berupa Firebase UID atau MongoDB _id)
    let village = null;
    try {
      if (ObjectId.isValid(id)) {
        village = await db.collection('villages').findOne({ _id: new ObjectId(id) });
      }
    } catch (e) {}

    if (!village) {
      village = await db.collection('villages').findOne({
        $or: [
          { userId: id },
          { _id: id as any }
        ]
      });
    }

    const possibleIds = [id];
    if (village) {
      possibleIds.push(village._id.toString());
      if (village.userId) possibleIds.push(village.userId);
    }
    const uniqueIds = [...new Set(possibleIds)];

    // 1. Ambil inovasi dari koleksi 'innovations' yang memiliki desaId ini (penugasan langsung)
    // dengan jumlah desa yang menerapkan dari claimInnovations
    const directPipeline: any[] = [
      { $match: { desaId: { $in: [id] }, status: 'Terverifikasi' } },
      {
        $lookup: {
          from: 'claimInnovations',
          localField: '_id',
          foreignField: 'inovasiId',
          as: 'allClaims',
        },
      },
      {
        $addFields: {
          jumlahDesa: {
            $size: {
              $filter: {
                input: '$allClaims',
                as: 'claim',
                cond: { $eq: ['$$claim.status', 'Terverifikasi'] },
              },
            },
          },
        },
      },
      { $project: { allClaims: 0 } },
    ]

    const directInnovations = await db.collection('innovations')
      .find({
        desaId: { $in: uniqueIds },
        status: 'Terverifikasi'
      })
      .aggregate(directPipeline)
      .toArray()

    // 2. Ambil SEMUA klaim dari koleksi 'claimInnovations' yang terverifikasi (Manual & Reguler)
    const verifiedClaims = await db.collection('claimInnovations')
      .find({
        desaId: { $in: uniqueIds },
        status: 'Terverifikasi'
      })
      .toArray()

    // Map dan Gabungkan hasil
    const result_direct = directInnovations.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }))

    // Untuk klaim, kita gunakan data dari dokumen klaim (snapshot)
    // Hindari duplikasi jika inovasiId sudah ada di result_direct
    const existingInnovIds = new Set(result_direct.map(i => i.id));
    
    const result_claims = verifiedClaims
      .filter(doc => !doc.inovasiId || !existingInnovIds.has(doc.inovasiId.toString()))
      .map(doc => ({
        ...doc,
        id: doc._id.toString(),
        _id: doc._id.toString(),
        namaInovasi: doc.namaInovasi,
        namaInnovator: doc.namaInovator,
        innovatorImgURL: doc.logoInovator || null, // Map logoInovator to innovatorImgURL for consistency
        kategori: 'Inovasi Manual', // Default category for manual claims
        deskripsi: doc.deskripsiInovasi || doc.deskripsi,
        images: doc.fotoInovasi ? [doc.fotoInovasi] : (doc.buktiFiles?.foto || []),
        status: 'Terverifikasi',
        jumlahDesa: 1, // klaim manual minimal diterapkan oleh desa yang mengklaim
      }))

    const finalResult = [...result_direct, ...result_claims]

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
