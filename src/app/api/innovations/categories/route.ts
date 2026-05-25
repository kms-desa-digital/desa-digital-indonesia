import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
// Mengambil daftar kategori dari MongoDB beserta jumlah inovasi per kategori
// Query: ?name=<kategori> → tampilkan inovasi pada kategori tertentu
// =========================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryName = searchParams.get('name')

    const db = await connectToDatabase()

    // Jika ada query ?name=<kategori>, kembalikan inovasi terverifikasi di kategori itu
    if (categoryName) {
      const isAll = categoryName === 'Semua Kategori Inovasi'

      const pipeline: any[] = [
        {
          $match: {
            ...(isAll ? {} : { kategori: categoryName }),
            status: 'Terverifikasi',
          },
        },
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
        {
          $project: { allClaims: 0 },
        },
        { $sort: { createdAt: -1 } },
      ]

      const innovations = await db
        .collection('innovations')
        .aggregate(pipeline)
        .toArray()

      const result = innovations.map((doc) => ({
        ...doc,
        id: doc._id.toString(),
        _id: doc._id.toString(),
      }))

      return NextResponse.json(
        { category: categoryName, innovations: result, total: result.length },
        { status: 200 }
      )
    }

    // Ambil data kategori lengkap dari MongoDB
    const mongoCategories = await db.collection('categories').find({}).toArray();

    // Hitung jumlah inovasi per kategori
    const categoryCounts = await db
      .collection('innovations')
      .aggregate([
        { $match: { status: 'Terverifikasi' } },
        { $group: { _id: '$kategori', count: { $sum: 1 } } },
      ])
      .toArray()

    const countMap: Record<string, number> = {}
    categoryCounts.forEach((item) => {
      if (item._id) countMap[item._id] = item.count
    })

    // Gabungkan data kategori (termasuk icon & description) dengan jumlah inovasi
    const categories = mongoCategories.map((cat) => ({
      ...cat,
      id: cat._id.toString(),
      _id: cat._id.toString(),
      name: cat.title, // Pastikan ada field 'name' jika dibutuhkan frontend
      total: countMap[cat.title] || 0,
    }))

    return NextResponse.json({ categories }, { status: 200 })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
