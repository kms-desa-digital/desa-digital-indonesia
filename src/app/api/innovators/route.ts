import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

// =========================================================
// GET /api/innovators
// Mengambil semua inovator, support query status
// =========================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const kategori = searchParams.get('kategori')

    const db = await connectToDatabase()
    const filter: any = {}

    if (status) filter.status = status
    if (kategori) filter.kategori = kategori

    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.namaInovator = { $regex: escapedSearch, $options: 'i' }
    }

    const innovators = await db
      .collection('innovators')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    const result = innovators.map((doc) => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }))

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    console.error('Error fetching innovators:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// POST /api/innovators
// Buat profil inovator baru
// =========================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, namaInovator, kategori, deskripsi, whatsapp, logo, header } = body

    if (!userId || !namaInovator) {
      return NextResponse.json({ message: 'UserId dan Nama Inovator wajib diisi' }, { status: 400 })
    }

    const db = await connectToDatabase()

    const newInnovator = {
      userId,
      namaInovator,
      kategori:             kategori || 'Perusahaan',
      deskripsi:            deskripsi || '',
      whatsapp:             whatsapp || '',
      logo:                 logo || null,
      header:               header || null,
      status:               'Menunggu',
      catatanAdmin:         null,
      jumlahInovasi:        0,
      jumlahDesaDampingan:  0,
      createdAt:            new Date(),
      editedAt:             new Date(),
    }

    const result = await db.collection('innovators').insertOne(newInnovator)

    return NextResponse.json({
      message: 'Profil inovator berhasil dibuat',
      innovatorId: result.insertedId.toString()
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating innovator:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
