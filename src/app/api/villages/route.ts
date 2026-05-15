import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

// =========================================================
// GET /api/villages
// Mengambil daftar semua desa
// Query: ?status=<status>&limit=<n>&skip=<n> (misal: Terverifikasi, Menunggu, Ditolak)
// =========================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const provinsi = searchParams.get('provinsi')
    const kabupatenKota = searchParams.get('kabupatenKota')
    const limitVal = parseInt(searchParams.get('limit') || '0')
    const skipVal = parseInt(searchParams.get('skip') || '0')
    const db = await connectToDatabase()
    const andConditions: any[] = []

    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const normalizeRegionName = (value: string) =>
      value
        .trim()
        .replace(/^(kabupaten|kota|kab\.?)\s+/i, '')
        .replace(/\s+/g, ' ')

    if (status) {
      andConditions.push({ status })
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i')
      andConditions.push({
        $or: [
          { namaDesa: { $regex: searchRegex } },
          { desa: { $regex: searchRegex } },
          { "lokasi.desaKelurahan.label": { $regex: searchRegex } },
        ],
      })
    }

    if (provinsi && provinsi.trim()) {
      const provinsiRegex = new RegExp(`^${escapeRegex(provinsi.trim())}$`, 'i')
      andConditions.push({
        $or: [
          { provinsi: { $regex: provinsiRegex } },
          { "lokasi.provinsi.label": { $regex: provinsiRegex } },
        ],
      })
    }

    if (kabupatenKota && kabupatenKota.trim()) {
      const normalizedKabupaten = normalizeRegionName(kabupatenKota)
      const kabupatenRegex = new RegExp(
        `^(?:(?:kabupaten|kab\\.?|kota)\\s+)?${escapeRegex(normalizedKabupaten)}$`,
        'i'
      )
      andConditions.push({
        $or: [
          { kabupatenKota: { $regex: kabupatenRegex } },
          { kabupaten: { $regex: kabupatenRegex } },
          { "lokasi.kabupatenKota.label": { $regex: kabupatenRegex } },
        ],
      })
    }

    const filter: any = andConditions.length ? { $and: andConditions } : {}

    let villageQuery = db.collection('villages').find(filter).sort({ createdAt: -1 })

    if (skipVal > 0) villageQuery = villageQuery.skip(skipVal)
    if (limitVal > 0) villageQuery = villageQuery.limit(limitVal)

    const villages = await villageQuery.toArray()

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
    const auth = await requireRole(request, ["village", "admin"])
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { userId, namaDesa } = body

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
      ...body,
      status: 'Menunggu', // Default status verifikasi admin
      catatanAdmin: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('villages').insertOne(newVillage)
    const villageId = result.insertedId.toString()

    // Notify all admins about new registered village profile
    try {
      const { notifyAllAdmins } = await import('@/services/notificationServices')
      await notifyAllAdmins({
        type: 'personal',
        category: 'village_submission',
        title: `Pendaftaran Desa Baru: ${namaDesa}`,
        description: `Sebuah desa baru telah mendaftar: ${namaDesa}. Silakan verifikasi profil desa ini.`,
        actionType: 'profile',
        relatedId: userId,
      })
    } catch (notifErr) {
      console.error('Error notifying admins about new village profile:', notifErr)
    }

    return new NextResponse(
      JSON.stringify({ 
        message: 'Profil desa berhasil dibuat', 
        villageId: villageId 
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
