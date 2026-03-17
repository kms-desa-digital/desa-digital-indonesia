import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'

// =========================================================
// GET /api/villages
// Mengambil daftar semua desa
// Query: ?status=<status> (misal: Terverifikasi, Menunggu, Ditolak)
// =========================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const db = await connectToDatabase()
    const filter: any = {}
    if (status) filter.status = status

    const villages = await db.collection('villages')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    const result = villages.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }))

    return new NextResponse(JSON.stringify({ villages: result }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching villages:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// =========================================================
// POST /api/villages
// Membuat profil desa baru
// =========================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, namaDesa, deskripsi, logo, header, 
      manfaat, whatsApp, provinsi, kabupaten, 
      kecamatan, desa 
    } = body

    if (!userId || !namaDesa) {
      return NextResponse.json({ message: 'userId dan namaDesa wajib diisi' }, { status: 400 })
    }

    const db = await connectToDatabase()
    
    // Cek apakah profil desa untuk userId ini sudah ada
    const existing = await db.collection('villages').findOne({ userId })
    if (existing) {
      return NextResponse.json({ message: 'Profil desa untuk user ini sudah ada' }, { status: 400 })
    }

    const newVillage = {
      userId,
      namaDesa,
      deskripsi: deskripsi || '',
      logo: logo || null,
      header: header || null,
      manfaat: manfaat || '',
      whatsApp: whatsApp || '',
      provinsi: provinsi || '',
      kabupaten: kabupaten || '',
      kecamatan: kecamatan || '',
      desa: desa || '',
      status: 'Menunggu', // Default status verifikasi admin
      catatanAdmin: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('villages').insertOne(newVillage)

    return new NextResponse(
      JSON.stringify({ 
        message: 'Profil desa berhasil dibuat', 
        villageId: result.insertedId.toString() 
      }, null, 2),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error creating village profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
