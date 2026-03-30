import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

// =========================================================
// POST /api/villages/claim
// Mengajukan klaim inovasi oleh desa (Mendukung Klaim Manual)
// =========================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      desaId, 
      namaDesa, 
      inovasiId,      // Optional untuk klaim manual
      namaInovasi,    // Wajib
      namaInovator,   // Wajib
      deskripsiInovasi, // Wajib
      logoInovator,   // Optional
      fotoInovasi,    // Optional
      buktiJenis,     // Wajib (Array: ['foto', 'video', 'dokumen'])
      buktiFiles      // Object: { foto: [], video: [], dokumen: [] }
    } = body

    // Validasi field wajib
    if (!desaId || !namaInovasi || !namaInovator || !deskripsiInovasi || !buktiJenis || buktiJenis.length === 0) {
      return new NextResponse(
        JSON.stringify({ 
          message: 'Field wajib tidak lengkap: desaId, namaInovasi, namaInovator, deskripsiInovasi, dan buktiJenis harus diisi.' 
        }, null, 2),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const db = await connectToDatabase()

    // Jika ada inovasiId, cek apakah klaim ini sudah pernah diajukan untuk inovasi yang sama
    if (inovasiId) {
      const existing = await db.collection('claimInnovations').findOne({ 
        desaId, 
        inovasiId 
      })
      
      if (existing) {
        return new NextResponse(
          JSON.stringify({ message: 'Inovasi ini sudah dalam proses klaim oleh desa Anda' }, null, 2),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    const newClaim = {
      desaId,
      namaDesa: namaDesa || '',
      inovasiId: inovasiId || null,
      namaInovasi,
      namaInovator,
      deskripsiInovasi,
      logoInovator: logoInovator || null,
      fotoInovasi: fotoInovasi || null,
      buktiJenis: buktiJenis, // Menyimpan jenis bukti yang dipilih
      buktiFiles: buktiFiles || {}, // Menyimpan URL file bukti (foto/video/dokumen)
      status: 'Menunggu', // Status verifikasi admin
      catatanAdmin: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('claimInnovations').insertOne(newClaim)

    return new NextResponse(
      JSON.stringify({ 
        message: 'Permohonan klaim inovasi berhasil diajukan', 
        claimId: result.insertedId.toString() 
      }, null, 2),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error claiming innovation:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }, null, 2),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// =========================================================
// GET /api/villages/claim
// Mengambil daftar klaim inovasi (biasanya untuk admin atau user tertentu)
// Query: ?desaId=<id> atau ?status=<status>
// =========================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const desaId = searchParams.get('desaId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '0')
    const skip = parseInt(searchParams.get('skip') || '0')

    const db = await connectToDatabase()
    const filter: any = {}
    if (desaId) filter.desaId = desaId
    if (status) filter.status = status
    if (search) {
      filter.namaInovasi = { $regex: search, $options: 'i' }
    }

    let query = db.collection('claimInnovations').find(filter).sort({ createdAt: -1 })
    
    // Get total count for pagination metadata
    const total = await db.collection('claimInnovations').countDocuments(filter)

    if (skip > 0) query = query.skip(skip)
    if (limit > 0) query = query.limit(limit)

    const claims = await query.toArray()

    const result = claims.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }))

    return new NextResponse(JSON.stringify({ 
      claims: result,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + result.length
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching claims:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
