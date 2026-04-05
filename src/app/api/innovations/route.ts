import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

// =========================================================
// GET /api/innovations
// Mengambil semua inovasi, support query:
//   ?category=<nama_kategori>  → filter by kategori
//   ?status=<Terverifikasi|Menunggu|Ditolak>  → filter by status
//   ?innovatorId=<id>  → filter by innovator
//   ?search=<keyword> → filter by nama inovasi / deskripsi / nama innovator
// =========================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category    = searchParams.get('category')
    const status      = searchParams.get('status')
    const innovatorId = searchParams.get('innovatorId')
    const search      = searchParams.get('search')

    const db = await connectToDatabase()
    const filter: Record<string, any> = {}

    if (category)    filter.kategori    = category
    if (status)      filter.status      = status
    if (innovatorId) filter.innovatorId = innovatorId

    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { namaInovasi: { $regex: escapedSearch, $options: 'i' } },
        { deskripsi: { $regex: escapedSearch, $options: 'i' } },
        { namaInnovator: { $regex: escapedSearch, $options: 'i' } },
      ]
    }

    const innovations = await db
      .collection('innovations')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    // Konversi _id ObjectId → string untuk kemudahan konsumsi frontend
    const result = innovations.map((doc) => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }))

    return NextResponse.json({ innovations: result }, { status: 200 })
  } catch (error) {
    console.error('Error fetching innovations:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// POST /api/innovations
// Tambah inovasi baru
// Body: { namaInovasi, kategori, tahunDibuat, deskripsi,
//         statusInovasi, modelBisnis[], manfaat[], infrastruktur[],
//         inputDesaMenerapkan, hargaMinimal, hargaMaksimal,
//         innovatorId, namaInnovator, innovatorImgURL, images[] }
// =========================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      namaInovasi,
      kategori,
      tahunDibuat,
      deskripsi,
      statusInovasi,
      modelBisnis,
      manfaat,
      infrastruktur,
      inputDesaMenerapkan,
      hargaMinimal,
      hargaMaksimal,
      innovatorId,
      namaInnovator,
      innovatorImgURL,
      images,
    } = body

    // Validasi field wajib
    if (!namaInovasi || !kategori || !tahunDibuat || !deskripsi || !innovatorId) {
      return NextResponse.json(
        { message: 'Field wajib tidak lengkap: namaInovasi, kategori, tahunDibuat, deskripsi, innovatorId' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()

    const newInnovation = {
      namaInovasi,
      kategori,
      tahunDibuat,
      deskripsi,
      statusInovasi:        statusInovasi || 'Masih diproduksi',
      modelBisnis:          modelBisnis   || [],
      manfaat:              manfaat       || [],
      infrastruktur:        infrastruktur || [],
      inputDesaMenerapkan:  inputDesaMenerapkan || '',
      hargaMinimal:         hargaMinimal  || '',
      hargaMaksimal:        hargaMaksimal || '',
      innovatorId,
      namaInnovator:        namaInnovator || '',
      innovatorImgURL:      innovatorImgURL || null,
      images:               images || [],
      status:               'Menunggu',   // status verifikasi admin
      catatanAdmin:         null,
      createdAt:            new Date(),
      editedAt:             new Date(),
    }

    const result = await db.collection('innovations').insertOne(newInnovation)

    return NextResponse.json(
      {
        message:      'Inovasi berhasil ditambahkan, menunggu verifikasi admin',
        innovationId: result.insertedId.toString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating innovation:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
