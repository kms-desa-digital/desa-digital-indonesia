import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

type Params = Promise<{ id: string }>

// GET /api/innovator/[id]/villages
// Mengambil daftar semua desa dampingan dari seorang inovator
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ message: 'Innovator ID is required' }, { status: 400 })
    }

    const db = await connectToDatabase()

    // 1. Cari semua inovasi yang dimiliki oleh inovator tersebut
    const innovations = await db.collection('innovations')
      .find({ innovatorId: id })
      .project({ desaId: 1, namaInovasi: 1 }) // Ambil array desaId dan namaInovasi
      .toArray()

    // 2. Kumpulkan semua desaId unik dan asosiasikan dengan nama inovasi
    const villageDataMap = new Map<string, Set<string>>()
    innovations.forEach(inv => {
      if (Array.isArray(inv.desaId)) {
        inv.desaId.forEach(vId => {
          if (!villageDataMap.has(vId)) {
            villageDataMap.set(vId, new Set<string>())
          }
          villageDataMap.get(vId)!.add(inv.namaInovasi)
        })
      }
    })

    const uniqueVillageIds = Array.from(villageDataMap.keys())

    if (uniqueVillageIds.length === 0) {
      return NextResponse.json({ villages: [] }, { status: 200 })
    }

    // 3. Konversi array of string id menjadi ObjectId untuk query MongoDB
    const objectIds = uniqueVillageIds.map(vId => {
      try { return new ObjectId(vId) } catch { return vId }
    })

    // 4. Cari informasi detail desa dari kumpulan IDs tadi (termasuk String match dan ObjectID match)
    const query: any = {
      $or: [
        { _id: { $in: objectIds.filter(id => id instanceof ObjectId) } },
        { _id: { $in: uniqueVillageIds } },
        { userId: { $in: uniqueVillageIds } } // Fallback jika disangkutkan via userId
      ]
    }

    const villages = await db.collection('villages').find(query as any).toArray()

    const result = villages.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
      inovasiDiterapkan: Array.from(villageDataMap.get(doc.id) || villageDataMap.get(doc.userId) || villageDataMap.get(doc._id.toString()) || [])
    }))

    return NextResponse.json({ 
      villages: result,
      totalCount: uniqueVillageIds.length // Return unique claim counts for UI
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching assisted villages for innovator:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
