import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["village", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const firebaseUid = auth.uid;
    const db = await connectToDatabase();

    // 1. Temukan dokumen desa berdasarkan Firebase UID
    //    userId di villages bisa berupa Firebase UID atau MongoDB ObjectId user
    let village = await db.collection('villages').findOne({ userId: firebaseUid });

    // Jika tidak ketemu by firebase UID langsung, coba cari via user MongoDB doc
    if (!village) {
      let userObjectId;
      try { userObjectId = new ObjectId(firebaseUid); } catch { userObjectId = null; }

      // Cari user di collection users
      const userDoc = await db.collection('users').findOne({
        $or: [
          ...(userObjectId ? [{ _id: userObjectId }] : []),
          { uid: firebaseUid },
          { firebaseUid: firebaseUid },
        ]
      } as any);

      if (userDoc) {
        const userMongoId = userDoc._id.toString();
        village = await db.collection('villages').findOne({
          $or: [
            { userId: userMongoId },
            { userId: firebaseUid },
          ]
        });
      }
    }

    // 2. Tentukan semua kemungkinan ID desa untuk filter claim
    //    desaId di claimInnovations bisa berupa Firebase UID atau MongoDB village _id
    const possibleDesaIds: string[] = [firebaseUid];
    if (village) {
      possibleDesaIds.push(village._id.toString());
      if (village.userId) possibleDesaIds.push(village.userId.toString());
    }
    // Hapus duplikat
    const uniqueDesaIds = [...new Set(possibleDesaIds)];

    // 3. Ambil semua klaim milik desa ini
    const claims = await db.collection('claimInnovations').find({
      desaId: { $in: uniqueDesaIds }
    }).toArray();

    // 4. Hitung statistik dari klaim
    const totalClaimedInnovations = claims.length;

    // 5. Ambil detail inovasi yang diklaim
    const inovasiIds = claims.map(c => c.inovasiId).filter(Boolean);
    const inovasiObjectIds = inovasiIds.map(id => {
      try { return new ObjectId(id); } catch { return id; }
    });

    const claimedInnovations = inovasiIds.length > 0
      ? await db.collection('innovations').find({
          $or: [
            { _id: { $in: inovasiObjectIds } },
            { _id: { $in: inovasiIds } }
          ]
        } as any).toArray()
      : [];

    // 6. Hitung unik inovator dan kategori
    const inovatorMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};

    claimedInnovations.forEach(i => {
      const kat = i.kategori || 'Lainnya';
      categoryMap[kat] = (categoryMap[kat] || 0) + 1;

      const inId = i.innovatorId || i.userId;
      if (inId) {
        inovatorMap[inId] = (inovatorMap[inId] || 0) + 1;
      }
    });

    const totalInovasi = claimedInnovations.length;
    const totalUniqueInovators = Object.keys(inovatorMap).length;

    // 7. Top 5 Inovator
    const topInovatorIds = Object.keys(inovatorMap)
      .sort((a, b) => inovatorMap[b] - inovatorMap[a])
      .slice(0, 5);

    const topInovatorObjIds = topInovatorIds.map(id => {
      try { return new ObjectId(id); } catch { return id; }
    });

    const innovatorsData = topInovatorIds.length > 0
      ? await db.collection('innovators').find({
          $or: [
            { _id: { $in: topInovatorObjIds } },
            { _id: { $in: topInovatorIds } },
            { userId: { $in: topInovatorIds } }
          ]
        } as any).toArray()
      : [];

    const top5Innovators = topInovatorIds.map(id => {
      const inv = innovatorsData.find(d =>
        d._id.toString() === id || d.userId === id
      );
      return {
        name: inv?.namaInovator || 'Unknown',
        totalInovasi: inovatorMap[id]
      };
    });

    // 8. Category Stats
    const categoryStats = Object.keys(categoryMap).map(kat => ({
      kategori: kat,
      total: categoryMap[kat]
    }));

    // 9. Perkembangan inovasi per tahun (dari claims)
    const perkembanganMap: Record<number, number> = {};
    claims.forEach(c => {
      if (c.createdAt) {
        const year = new Date(c.createdAt).getFullYear();
        perkembanganMap[year] = (perkembanganMap[year] || 0) + 1;
      }
    });
    const perkembanganInovasi = Object.keys(perkembanganMap)
      .sort()
      .map(year => ({ year: Number(year), total: perkembanganMap[Number(year)] }));

    // 10. Rekomendasi inovasi (yang belum diklaim desa ini)
    const recommendationsData = await db.collection('innovations')
      .find({
        status: 'Terverifikasi',
        ...(inovasiObjectIds.length > 0 ? { _id: { $nin: inovasiObjectIds } } : {})
      } as any)
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

    // 11. Info desa untuk response
    const desaInfo = village ? {
      _id: village._id.toString(),
      namaDesa: village.namaDesa || '-',
      provinsi: village.lokasi?.provinsi?.label || village.provinsi || '-',
      kabupaten: village.lokasi?.kabupatenKota?.label || village.lokasi?.kabupatenKota || village.kabupatenKota || village.kabupaten || '-',
      kecamatan: village.lokasi?.kecamatan?.label || village.kecamatan || '-',
      potensiDesa: village.potensiDesa || [],
      kondisijalan: village.kondisijalan || '-',
      jaringan: village.jaringan || '-',
      listrik: village.listrik || '-',
      infrastrukturDesa: village.infrastrukturDesa || '-',
      geografisDesa: village.geografisDesa || '-',
      kesiapanDigital: village.kesiapanDigital || 'Data Masih Kosong',
      pemantapanPelayanan: village.pemantapanPelayanan || 'Data Masih Kosong',
      sosialBudaya: village.sosialBudaya || 'Data Masih Kosong',
      sumberDaya: village.sumberDaya || '-',
      teknologi: village.teknologi || '-',
      kemampuan: village.kemampuan || '-',
    } : null;

    const systemTotalInnovations = await db.collection('innovations').countDocuments();
    const systemTotalInnovators = await db.collection('innovators').countDocuments();

    return NextResponse.json({
      desa: desaInfo,
      desaFound: !!village,
      dashboard: {
        totalInovasi,
        totalInovator: totalUniqueInovators,
        systemTotalInnovations,
        systemTotalInnovators,
        totalClaimedInnovations,
        top5Innovators,
        categoryStats,
        perkembanganInovasi,
        recommendations,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching village dashboard:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
