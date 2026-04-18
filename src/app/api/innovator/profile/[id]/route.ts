import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

type Params = Promise<{ id: string }>
type MongoFilter = { [key: string]: any }
type InnovatorDoc = { _id: string | ObjectId; [key: string]: any }

const normalizeArray = (value: unknown) => {
  if (Array.isArray(value)) return value
  if (value) return [value]
  return []
}

const buildFilter = (id: string): MongoFilter => {
  const conditions: any[] = [{ _id: id }, { userId: id }]

  if (ObjectId.isValid(id)) {
    conditions.unshift({ _id: new ObjectId(id) })
  }

  return { $or: conditions }
}

// POST /api/innovator/profile/:id
// Create or update innovator profile in MongoDB using Firebase authentication.
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["innovator", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params
    const targetId = auth.role === "admin" ? id : auth.uid;

    if (!targetId) {
      return NextResponse.json({ message: 'Innovator ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const {
      namaInovator,
      deskripsi,
      kategori,
      whatsapp,
      instagram,
      website,
      logo,
      header,
      desaId,
      jumlahInovasi,
      jumlahDesaDampingan,
      status,
    } = body

    if (!namaInovator || !deskripsi || !kategori || !whatsapp) {
      return NextResponse.json(
        {
          message:
            'Field wajib tidak lengkap: namaInovator, deskripsi, kategori, dan whatsapp harus diisi.',
        },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const innovatorCollection = db.collection<InnovatorDoc>('innovators')
    const filter = buildFilter(targetId)
    const existingDoc = await innovatorCollection.findOne(filter)
    const now = new Date()

    const ownerUserId = existingDoc?.userId ?? (auth.role === 'admin' ? targetId : auth.uid);

    const profile = {
      userId: ownerUserId,
      namaInovator,
      deskripsi,
      kategori,
      whatsapp,
      instagram: instagram ?? existingDoc?.instagram ?? '',
      website: website ?? existingDoc?.website ?? '',
      logo: logo ?? existingDoc?.logo ?? null,
      header: header ?? existingDoc?.header ?? null,
      desaId: normalizeArray(desaId).length ? normalizeArray(desaId) : existingDoc?.desaId ?? [],
      jumlahInovasi:
        typeof jumlahInovasi === 'number' ? jumlahInovasi : existingDoc?.jumlahInovasi ?? 0,
      jumlahDesaDampingan:
        typeof jumlahDesaDampingan === 'number'
          ? jumlahDesaDampingan
          : existingDoc?.jumlahDesaDampingan ?? 0,
      status: status ?? (existingDoc?.status === 'Ditolak' ? 'Menunggu' : existingDoc?.status ?? 'Menunggu'),
      catatanAdmin:
        existingDoc?.status === 'Ditolak' && status === undefined
          ? ''
          : existingDoc?.catatanAdmin ?? '',
      editedAt: now,
      createdAt: existingDoc?.createdAt ?? now,
    }

    if (!existingDoc) {
      const newDoc = {
        _id: ObjectId.isValid(targetId) ? new ObjectId(targetId) : targetId,
        ...profile,
      }

      await innovatorCollection.insertOne(newDoc)

      return NextResponse.json(
        {
          message: 'Profil inovator berhasil dibuat',
          profile: { ...newDoc, id: newDoc._id.toString() },
        },
        { status: 201 }
      )
    }

    await innovatorCollection.updateOne(filter, { $set: profile })

    return NextResponse.json(
      {
        message: 'Profil inovator berhasil diperbarui',
        profile: { ...existingDoc, ...profile, id: existingDoc._id.toString() },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error saving innovator profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
