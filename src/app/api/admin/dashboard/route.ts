import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const db = await connectToDatabase()

    // Cari user dengan aman (menghindari error jika auth.uid adalah Firebase UID)
    let userQuery: any = { 
      $or: [
        { firebaseUid: auth.uid }, 
        { uid: auth.uid }, 
        { id: auth.uid },
        { _id: auth.uid }
      ] 
    };

    if (ObjectId.isValid(auth.uid)) {
      try {
        userQuery.$or.push({ _id: new ObjectId(auth.uid) });
      } catch (e) {
        // Abaikan jika ternyata gagal diparsing sebagai ObjectId
      }
    }

    const user = await db.collection('users').findOne(userQuery)

    if (!user) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    // Ambil data dashboard
    const totalUsers = await db.collection('users').countDocuments()
    const totalInnovations = await db.collection('innovations').countDocuments()
    const totalVillages = await db.collection('villages').countDocuments()
    const totalInnovators = await db.collection('innovators').countDocuments()

    // Ambil data detail top 5
    const top5VillagesData = await db.collection('villages').find().sort({ jumlahInovasiDiterapkan: -1 }).limit(5).toArray();
    const top5Villages = top5VillagesData.map(v => ({
      name: v.namaDesa || '',
      totalInovasi: v.jumlahInovasiDiterapkan || 0,
      lat: v.latitude || 0,
      lng: v.longitude || 0
    }));

    const top5InnovatorsData = await db.collection('innovators').find().sort({ jumlahInovasi: -1 }).limit(5).toArray();
    const top5Innovators = top5InnovatorsData.map(i => ({
      name: i.namaInovator || '',
      totalInovasi: i.jumlahInovasi || 0,
      lat: i.latitude || 0,
      lng: i.longitude || 0
    }));

    const top5InnovationsData = await db.collection('innovations').find().sort({ jumlahKlaim: -1 }).limit(5).toArray();
    const top5Innovations = top5InnovationsData.map(i => ({
      name: i.namaInovasi || '',
      totalKlaim: i.jumlahKlaim || 0,
      kategori: i.kategori || ''
    }));

    // Data map markers
    const allVillages = await db.collection('villages').find({ latitude: { $exists: true } }).toArray();
    const allInnovators = await db.collection('innovators').find({ latitude: { $exists: true } }).toArray();
    const mapMarkers = [
      ...allVillages.map(v => ({ name: v.namaDesa, type: 'village', lat: v.latitude, lng: v.longitude })),
      ...allInnovators.map(i => ({ name: i.namaInovator, type: 'innovator', lat: i.latitude, lng: i.longitude }))
    ].filter(m => m.lat && m.lng);

    return NextResponse.json({
      totalUsers,
      totalInnovations,
      totalVillages,
      totalInnovators,
      top5Villages,
      top5Innovators,
      top5Innovations,
      mapMarkers
    })
  } catch (error) {
    console.error('Error fetching admin dashboard:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}