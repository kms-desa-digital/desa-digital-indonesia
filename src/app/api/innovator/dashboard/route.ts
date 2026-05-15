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

    let possibleIds: string[] = [];
    if (queriedInnovatorId) {
      possibleIds.push(queriedInnovatorId);
    } else {
      possibleIds.push(auth.uid);
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

      possibleIds.push(user._id.toString());
      if (user.firebaseUid) possibleIds.push(user.firebaseUid);
      if (user.uid) possibleIds.push(user.uid);
    }

    // Buat daftar ID unik
    possibleIds = [...new Set(possibleIds.filter(Boolean))];

    // 1. Cari Profil Innovator dengan pencarian cerdas
    let innovatorQuery: any = {
      $or: [
        { userId: { $in: possibleIds } },
        { _id: { $in: possibleIds } }
      ]
    };
    
    possibleIds.forEach(id => {
      if (ObjectId.isValid(id)) {
        innovatorQuery.$or.push({ _id: new ObjectId(id) });
        innovatorQuery.$or.push({ userId: new ObjectId(id) });
      }
    });

    const innovator = await db.collection('innovators').findOne(innovatorQuery)
    console.log("Dashboard Debug: possibleIds:", possibleIds, "innovator found:", innovator ? innovator._id : 'null')

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
        { innovatorId: { $in: possibleIds } },
        { innovatorId: innovator._id.toString() },
        ...(innovator.userId ? [{ innovatorId: innovator.userId }] : [])
      ]
    };
    
    console.log("Dashboard Debug: innovationFilter:", JSON.stringify(innovationFilter));

    // Hitung inovasi milik innovator ini
    const totalInnovations = await db.collection('innovations').countDocuments(innovationFilter)
    console.log("Dashboard Debug: totalInnovations:", totalInnovations);

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
    const claimFilter = {
      $or: [
        { inovatorId: { $in: possibleIds } },
        { inovatorId: innovator._id.toString() },
        ...(innovator.userId ? [{ inovatorId: innovator.userId }] : [])
      ]
    };
    const claims = await db.collection('claimInnovations').find(claimFilter).toArray();

    const desaIds = [...new Set(claims.map(c => c.desaId).filter(Boolean))];
    const villageData = await db.collection('villages').find({ userId: { $in: desaIds } }).toArray();

    const mapVillages = villageData.map(v => ({
      name: v.namaDesa || '',
      lat: v.latitude || 0,
      lng: v.longitude || 0
    })).filter(v => v.lat && v.lng);

    const totalKlienDesa = desaIds.length;

    // Export claims for Pertumbuhan Desa Dampingan
    const pertumbuhanDesa = claims.map(c => ({
      namaDesa: c.namaDesa || '',
      namaInovasi: c.namaInovasi || '',
      namaInovator: c.namaInovator || '',
      year: new Date(c.createdAt).getFullYear() || new Date().getFullYear()
    }));

    return NextResponse.json({
      innovator,
      totalInnovations,
      totalInovasi: totalInnovations,
      totalKlienDesa,
      verifiedInnovations,
      pendingInnovations,
      rejectedInnovations,
      top3Innovations,
      categoryStats,
      mapVillages,
      pertumbuhanDesa
    })
  } catch (error) {
    console.error('Error fetching innovator dashboard:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}