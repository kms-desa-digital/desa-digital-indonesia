import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["innovator", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url)
    const queriedInnovatorId = searchParams.get('innovatorId')

    const db = await connectToDatabase()

    let targetUserId = '';

    if (queriedInnovatorId) {
      targetUserId = queriedInnovatorId;
    } else {
      // Cari user dengan format ID yang aman (Firebase UID atau ObjectId)
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
          // Abaikan
        }
      }

      const user = await db.collection('users').findOne(userQuery)

      if (!user) {
        return NextResponse.json({ message: 'User not found in database' }, { status: 404 })
      }

      targetUserId = user._id.toString();
    }

    // 1. Cari Profil Innovator dengan pencarian cerdas
    let innovatorQuery: any = {
      $or: [
        { userId: targetUserId },
        { _id: targetUserId }
      ]
    };
    if (ObjectId.isValid(targetUserId)) {
      innovatorQuery.$or.push({ _id: new ObjectId(targetUserId) });
    }

    const innovator = await db.collection('innovators').findOne(innovatorQuery)

    if (!innovator) {
      return NextResponse.json({
        message: 'Innovator profile not found',
        innovator: null,
        totalInnovations: 0,
        verifiedInnovations: 0,
        pendingInnovations: 0,
        rejectedInnovations: 0,
        top3Innovations: [],
        categoryStats: [],
        mapVillages: []
      }, { status: 200 })
    }

    // 2. Siapkan filter cerdas untuk inovasi (karena innovatorId di database bisa berupa userId atau profile _id)
    const innovationFilter = {
      $or: [
        { innovatorId: targetUserId },
        { innovatorId: innovator._id.toString() },
        ...(innovator.userId ? [{ innovatorId: innovator.userId }] : [])
      ]
    };

    // Hitung inovasi milik innovator ini
    const totalInnovations = await db.collection('innovations').countDocuments(innovationFilter)

    // Hitung inovasi berdasarkan status
    const verifiedInnovations = await db.collection('innovations').countDocuments({
      ...innovationFilter,
      status: 'Terverifikasi'
    })

    const pendingInnovations = await db.collection('innovations').countDocuments({
      ...innovationFilter,
      status: 'Menunggu'
    })

    const rejectedInnovations = await db.collection('innovations').countDocuments({
      ...innovationFilter,
      status: 'Ditolak'
    })

    // 3. Ambil Top 3 Innovations
    const top3InnovationsData = await db.collection('innovations')
      .find(innovationFilter)
      .sort({ jumlahKlaim: -1 })
      .limit(3)
      .toArray();

    const top3Innovations = top3InnovationsData.map(i => ({
      name: i.namaInovasi || '',
      totalKlaim: i.jumlahKlaim || 0,
      kategori: i.kategori || ''
    }));

    // 4. Category Stats
    const allInnovations = await db.collection('innovations').find(innovationFilter).toArray();
    const categoryMap: Record<string, number> = {};
    allInnovations.forEach(i => {
      const kat = i.kategori || 'Uncategorized';
      categoryMap[kat] = (categoryMap[kat] || 0) + 1;
    });
    const categoryStats = Object.keys(categoryMap).map(kat => ({ kategori: kat, total: categoryMap[kat] }));

    // 5. Map Villages (Desa yang mengklaim inovasi innovator ini)
    const claims = await db.collection('claimInnovations').find({ inovatorId: targetUserId }).toArray();
    // jika di database inovatorId juga ada yg pakai userId profil, pastikan mencari klaim dgn dua ID tersebut
    if (claims.length === 0 && innovator.userId) {
       const claims2 = await db.collection('claimInnovations').find({ inovatorId: innovator.userId }).toArray();
       claims.push(...claims2);
    }
    
    const desaIds = [...new Set(claims.map(c => c.desaId).filter(Boolean))];
    const villageData = await db.collection('villages').find({ userId: { $in: desaIds } }).toArray();
    
    const mapVillages = villageData.map(v => ({
      name: v.namaDesa || '',
      lat: v.latitude || 0,
      lng: v.longitude || 0
    })).filter(v => v.lat && v.lng);

    return NextResponse.json({
      innovator,
      totalInnovations,
      verifiedInnovations,
      pendingInnovations,
      rejectedInnovations,
      top3Innovations,
      categoryStats,
      mapVillages
    })
  } catch (error) {
    console.error('Error fetching innovator dashboard:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}