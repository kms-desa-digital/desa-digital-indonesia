import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["village", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url)
    const desaId = searchParams.get('desaId')

    const db = await connectToDatabase()
    const filter: Record<string, any> = {}

    if (desaId) {
      filter.desaId = desaId
    }

    const [
      totalVillages,
      totalInnovations,
      totalClaimedInnovations,
      uniqueInnovators,
    ] = await Promise.all([
      db.collection('villages').countDocuments(),
      db.collection('innovations').countDocuments(),
      db.collection('claimInnovations').countDocuments(filter),
      db.collection('claimInnovations').distinct('inovatorId', filter),
    ])

    // --- Ambil data klaim untuk chart dan top inovator ---
    const claims = await db.collection('claimInnovations').find(filter).toArray();
    const inovatorMap: Record<string, number> = {};
    const inovasiIds = claims.map(c => c.inovasiId).filter(Boolean);
    
    // Siapkan array ID dengan mencoba parsing ke ObjectId
    const objectIdArray = inovasiIds.map(id => {
      try { return new ObjectId(id); } catch { return id; }
    });

    const claimedInnovations = await db.collection('innovations').find({
       $or: [ { _id: { $in: objectIdArray } }, { _id: { $in: inovasiIds } } ]
    } as any).toArray();

    const categoryMap: Record<string, number> = {};
    claimedInnovations.forEach(i => {
      const kat = i.kategori || 'Uncategorized';
      categoryMap[kat] = (categoryMap[kat] || 0) + 1;
      
      const inId = i.innovatorId || i.userId; // fallback
      if (inId) {
        inovatorMap[inId] = (inovatorMap[inId] || 0) + 1;
      }
    });

    // Top 5 Innovators
    const topInovatorIds = Object.keys(inovatorMap).sort((a,b) => inovatorMap[b] - inovatorMap[a]).slice(0, 5);
    const topInovatorObjIds = topInovatorIds.map(id => {
       try { return new ObjectId(id); } catch { return id; }
    });
    
    const innovatorsData = await db.collection('innovators').find({
      $or: [
        { _id: { $in: topInovatorObjIds } },
        { _id: { $in: topInovatorIds } },
        { userId: { $in: topInovatorIds } }
      ]
    } as any).toArray();

    const top5Innovators = topInovatorIds.map(id => {
      const inv = innovatorsData.find(d => d._id.toString() === id || d.userId === id);
      return {
        name: inv?.namaInovator || 'Unknown',
        totalInovasi: inovatorMap[id]
      };
    });

    // Category Stats
    const categoryStats = Object.keys(categoryMap).map(kat => ({ kategori: kat, total: categoryMap[kat] }));

    // Recommendations (5 inovasi terverifikasi, secara ideal tidak termasuk yang sudah diklaim)
    const recommendationsData = await db.collection('innovations')
      .find({ status: 'Terverifikasi' }) // Jika ingin exclude yg sudah ada: , _id: { $nin: objectIdArray }
      .limit(5)
      .toArray();
    
    const recommendations = await Promise.all(recommendationsData.map(async (i) => {
      let innovatorName = 'Unknown';
      if (i.innovatorId) {
        let invObjId;
        try { invObjId = new ObjectId(i.innovatorId); } catch { invObjId = i.innovatorId; }
        const inv = await db.collection('innovators').findOne({
          $or: [
             { _id: invObjId },
             { _id: i.innovatorId },
             { userId: i.innovatorId }
          ]
        } as any);
        if (inv) innovatorName = inv.namaInovator;
      }
      return {
        name: i.namaInovasi || '',
        innovator: innovatorName,
        kategori: i.kategori || '',
        id: i._id.toString()
      };
    }));

    return NextResponse.json(
      {
        dashboard: {
          totalVillages,
          totalInnovations,
          totalClaimedInnovations,
          totalInnovators: Array.isArray(uniqueInnovators) ? uniqueInnovators.length : 0,
          filteredBy: desaId ? { desaId } : null,
          top5Innovators,
          categoryStats,
          recommendations
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching village dashboard:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
