import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

type Params = Promise<{ id: string }>

type MongoFilter = { [key: string]: any }

type InnovatorDoc = { _id: string | ObjectId; [key: string]: any }

const normalizeArray = (value: unknown) => {
  if (Array.isArray(value)) return value
  if (value) return [value]
  return []
}

const buildFilter = (id: string): MongoFilter => {
  if (ObjectId.isValid(id)) {
    return { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
  }
  return { _id: id }
}

// PUT /api/innovator/edit/:id
// Edit innovator profile in MongoDB.
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params

    if (!id) {
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
    const filter = buildFilter(id)
    const existingDoc = await innovatorCollection.findOne(filter)

    if (!existingDoc) {
      return NextResponse.json({ message: 'Profil inovator tidak ditemukan' }, { status: 404 })
    }

    const now = new Date()
    const updatedProfile = {
      namaInovator,
      deskripsi,
      kategori,
      whatsapp,
      instagram: instagram ?? existingDoc.instagram ?? '',
      website: website ?? existingDoc.website ?? '',
      logo: logo ?? existingDoc.logo ?? null,
      header: header ?? existingDoc.header ?? null,
      desaId: normalizeArray(desaId).length ? normalizeArray(desaId) : existingDoc.desaId ?? [],
      jumlahInovasi:
        typeof jumlahInovasi === 'number' ? jumlahInovasi : existingDoc.jumlahInovasi ?? 0,
      jumlahDesaDampingan:
        typeof jumlahDesaDampingan === 'number'
          ? jumlahDesaDampingan
          : existingDoc.jumlahDesaDampingan ?? 0,
      status: status ?? existingDoc.status ?? 'Menunggu',
      catatanAdmin:
        existingDoc.status === 'Ditolak' && status === undefined
          ? ''
          : existingDoc.catatanAdmin ?? '',
      editedAt: now,
      createdAt: existingDoc.createdAt ?? existingDoc._id,
    }

    await innovatorCollection.updateOne(filter, { $set: updatedProfile })

    return NextResponse.json(
      {
        message: 'Profil inovator berhasil diperbarui',
        profile: { ...existingDoc, ...updatedProfile, id: existingDoc._id.toString() },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating innovator profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
