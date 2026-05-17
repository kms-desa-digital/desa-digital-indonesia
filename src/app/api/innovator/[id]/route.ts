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

// GET /api/innovator/:id
// Ambil detail profil inovator berdasarkan id.
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: 'Innovator ID is required' }, { status: 400 })
    }

    const db = await connectToDatabase()
    const query: any = buildFilter(id)

    const innovators = await db.collection('innovators').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'innovations',
          let: { innovator_id: { $toString: '$_id' }, user_id: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ['$innovatorId', '$$innovator_id'] },
                        { $eq: ['$innovatorId', '$$user_id'] }
                      ]
                    },
                    { $eq: ['$status', 'Terverifikasi'] }
                  ]
                }
              }
            }
          ],
          as: 'allInnovations'
        }
      },
      {
        $addFields: {
          jumlahInovasi: { $size: '$allInnovations' },
          uniqueDesas: {
            $reduce: {
              input: '$allInnovations',
              initialValue: [],
              in: { $setUnion: ['$$value', { $ifNull: ['$$this.desaId', []] }] }
            }
          }
        }
      },
      {
        $addFields: {
          jumlahDesaDampingan: { $size: '$uniqueDesas' }
        }
      }
    ]).toArray()

    const innovator = innovators[0]

    if (!innovator) {
      return NextResponse.json({ message: 'Innovator tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(
      { innovator: { ...innovator, id: innovator._id.toString(), _id: innovator._id.toString() } },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching innovator detail:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/innovator/:id
// Edit innovator profile in MongoDB.
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const auth = await requireRole(request, ["innovator", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const isAdmin = auth.role === 'admin'
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

    if (!namaInovator || !deskripsi || !kategori || !whatsapp || !logo || !header) {
      return NextResponse.json(
        {
          message:
            'Field wajib tidak lengkap: namaInovator, deskripsi, kategori, whatsapp, logo, dan header harus diisi.',
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
      ...body,
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
      status: status ?? (existingDoc.status === 'Ditolak' ? 'Menunggu' : existingDoc.status ?? 'Menunggu'),
      catatanAdmin:
        existingDoc.status === 'Ditolak' && status === undefined
          ? ''
          : existingDoc.catatanAdmin ?? '',
      editedAt: now,
      createdAt: existingDoc.createdAt ?? now,
    }

    const isResubmission = !isAdmin && existingDoc.status === 'Ditolak'
    await innovatorCollection.updateOne(filter, { $set: updatedProfile })

    // Notify admins about update/resubmission
    try {
        const { notifyAllAdmins } = await import('@/services/notificationServices')
        if (isResubmission) {
            await notifyAllAdmins({
                type: 'personal',
                category: 'profile_submission',
                title: `Pengajuan Ulang Profil Innovator: ${namaInovator}`,
                description: `Innovator ${namaInovator} telah memperbarui profil yang sebelumnya ditolak. Silakan verifikasi kembali.`,
                actionType: 'profile',
                relatedId: id,
            })
        }
    } catch (notifErr) {
        console.error('Error notifying admins about innovator profile update:', notifErr)
    }

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
