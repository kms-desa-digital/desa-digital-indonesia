import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import { requireRole } from '@/lib/auth/apiAuth'
import { getCachedData, setCachedData } from '@/lib/utils/cache'

const provinceCoords: Record<string, { lat: number; lng: number }> = {
  'ACEH': { lat: 4.695135, lng: 96.749399 },
  'SUMATERA UTARA': { lat: 2.112102, lng: 99.084473 },
  'SUMATERA BARAT': { lat: -0.739945, lng: 100.800005 },
  'RIAU': { lat: 0.507068, lng: 101.543167 },
  'KEPULAUAN RIAU': { lat: 3.945651, lng: 108.142867 },
  'JAMBI': { lat: -1.61862, lng: 103.613898 },
  'SUMATERA SELATAN': { lat: -3.319437, lng: 104.914652 },
  'KEPULAUAN BANGKA BELITUNG': { lat: -2.741051, lng: 106.440587 },
  'BANGKA BELITUNG': { lat: -2.741051, lng: 106.440587 },
  'BENGKULU': { lat: -3.792845, lng: 102.260764 },
  'LAMPUNG': { lat: -4.558585, lng: 105.400005 },
  'DKI JAKARTA': { lat: -6.2088, lng: 106.8456 },
  'JAWA BARAT': { lat: -7.090911, lng: 107.668887 },
  'BANTEN': { lat: -6.405817, lng: 106.060005 },
  'JAWA TENGAH': { lat: -7.150975, lng: 110.140259 },
  'DI YOGYAKARTA': { lat: -7.875385, lng: 110.426208 },
  'YOGYAKARTA': { lat: -7.875385, lng: 110.426208 },
  'JAWA TIMUR': { lat: -7.536064, lng: 112.233154 },
  'BALI': { lat: -8.409518, lng: 115.188916 },
  'NUSA TENGGARA BARAT': { lat: -8.652933, lng: 117.361648 },
  'NUSA TENGGARA TIMUR': { lat: -8.657382, lng: 121.07937 },
  'KALIMANTAN BARAT': { lat: -0.278781, lng: 111.475285 },
  'KALIMANTAN TENGAH': { lat: -1.681488, lng: 113.382355 },
  'KALIMANTAN SELATAN': { lat: -3.092642, lng: 115.283759 },
  'KALIMANTAN TIMUR': { lat: 1.640629, lng: 116.419389 },
  'KALIMANTAN UTARA': { lat: 3.073125, lng: 116.041389 },
  'SULAWESI UTARA': { lat: 0.624693, lng: 123.975005 },
  'GORONTALO': { lat: 0.699937, lng: 122.446724 },
  'SULAWESI TENGAH': { lat: -1.430005, lng: 121.445587 },
  'SULAWESI BARAT': { lat: -2.844137, lng: 119.232078 },
  'SULAWESI SELATAN': { lat: -3.668799, lng: 119.974053 },
  'SULAWESI TENGGARA': { lat: -4.14491, lng: 122.174605 },
  'MALUKU': { lat: -3.238458, lng: 130.145273 },
  'MALUKU UTARA': { lat: 1.570999, lng: 127.800005 },
  'PAPUA BARAT': { lat: -1.336106, lng: 133.174716 },
  'PAPUA': { lat: -4.269928, lng: 138.080353 },
  'PAPUA SELATAN': { lat: -7.5, lng: 139.0 },
  'PAPUA TENGAH': { lat: -4.0, lng: 136.0 },
  'PAPUA PEGUNUNGAN': { lat: -4.0, lng: 139.0 },
  'PAPUA BARAT DAYA': { lat: -1.0, lng: 132.0 }
};

function getCoordsByProvince(prov: string, index: number = 0) {
  const norm = (prov || '').toUpperCase().trim();
  let coords = provinceCoords[norm];
  if (!coords) {
    const matchingKey = Object.keys(provinceCoords).find(k => norm.includes(k) || k.includes(norm));
    if (matchingKey) {
      coords = provinceCoords[matchingKey];
    }
  }
  
  if (coords) {
    const jitterLat = ((index * 17) % 100 - 50) / 500;
    const jitterLng = ((index * 23) % 100 - 50) / 500;
    return {
      lat: coords.lat + jitterLat,
      lng: coords.lng + jitterLng
    };
  }
  
  const jitterLat = ((index * 17) % 100 - 50) / 250;
  const jitterLng = ((index * 23) % 100 - 50) / 250;
  return {
    lat: -2.5 + jitterLat,
    lng: 118.0 + jitterLng
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["innovator", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url)
    const queriedInnovatorId = searchParams.get('innovatorId')
    const targetInnovatorId = queriedInnovatorId || auth.uid

    const cacheKey = `cache:innovator:dashboard:${targetInnovatorId}`
    const cached = await getCachedData<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, { status: 200 })
    }

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
    const objectIds = possibleIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    if (innovator._id && ObjectId.isValid(innovator._id.toString())) {
      objectIds.push(new ObjectId(innovator._id.toString()));
    }
    const allIds = [...possibleIds, innovator._id.toString()];
    if (innovator.userId) allIds.push(innovator.userId);

    const innovationFilter = {
      $or: [
        { innovatorId: { $in: allIds } },
        { userId: { $in: allIds } },
        { innovator_id: { $in: allIds } },
        { user_id: { $in: allIds } },
        { innovatorId: { $in: objectIds } },
        { userId: { $in: objectIds } }
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

    // 5. Query mencari semua klaim inovasi yang inovasi_id-nya dimiliki oleh inovator ini
    const inovasiIds = allInnovations.map(i => i._id.toString());
    allInnovations.forEach(i => {
      if (i.id) inovasiIds.push(i.id);
    });
    const inovasiObjectIds = allInnovations.map(i => i._id);

    const claims = await db.collection('claimInnovations').find({
      $or: [
        { inovasiId: { $in: inovasiIds } },
        { inovasi_id: { $in: inovasiIds } },
        { idInovasi: { $in: inovasiIds } },
        { inovasiId: { $in: inovasiObjectIds } },
        { inovasi_id: { $in: inovasiObjectIds } }
      ]
    }).toArray();

    console.log("Dashboard Debug: inovasiIds:", inovasiIds, "claims.length:", claims.length);

    const desaIds = [...new Set(claims.map(c => c.desaId || c.desa_id).filter(Boolean))];
    const desaObjectIds = desaIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    
    let villageQuery: any = { userId: { $in: desaIds } };
    if (desaIds.length > 0) {
      villageQuery = {
        $or: [
          { userId: { $in: desaIds } },
          { user_id: { $in: desaIds } },
          ...(desaObjectIds.length > 0 ? [{ _id: { $in: desaObjectIds } }] : [])
        ]
      };
    }
    const villageData = await db.collection('villages').find(villageQuery).toArray();

    const mapVillages = villageData.map((v, index) => {
      // Find all claims for this village
      const vClaims = claims.filter(c => {
        const cDesaId = (c.desaId || c.desa_id)?.toString();
        const vIdStr = v._id.toString();
        return cDesaId === v.userId || cDesaId === v.user_id || cDesaId === vIdStr;
      });

      const inovasiList = [...new Set(vClaims.map(c => c.namaInovasi).filter(Boolean))];
      const categoryList = [...new Set(vClaims.map(c => c.kategoriInovasi || c.kategori).filter(Boolean))];

      const prov = v.provinsi || v.lokasi?.provinsi?.label || 'Unknown';
      const kab = v.kabupaten || v.kabupatenKota || v.lokasi?.kabupatenKota?.label || '-';
      const kec = v.kecamatan || v.lokasi?.kecamatan?.label || '-';
      const des = v.desa || v.namaDesa || v.lokasi?.desaKelurahan?.label || '-';

      // Get coordinates from province dictionary if not set
      let lat = parseFloat(v.latitude);
      let lng = parseFloat(v.longitude);

      if (isNaN(lat) || isNaN(lng) || !lat || !lng) {
        const coords = getCoordsByProvince(prov, index);
        lat = coords.lat;
        lng = coords.lng;
      }

      return {
        name: v.namaDesa || '',
        provinsi: prov,
        kabupatenKota: kab,
        kecamatan: kec,
        desaKelurahan: des,
        lat,
        lng,
        inovasiList,
        namaInovasi: inovasiList.join(', ') || '-',
        kategoriInovasi: categoryList.join(', ') || '-'
      };
    }).filter(v => v.lat && v.lng);

    const totalKlienDesa = desaIds.length;

    // Build Daftar Inovasi (Menghitung jumlah desa per inovasi)
    const daftarInovasi = allInnovations.map(inov => {
      const idStr = inov._id.toString();
      const claimedBy = new Set(claims.filter(c => {
        const cInovasiId = (c.inovasiId || c.inovasi_id || c.idInovasi || '').toString();
        return cInovasiId === idStr || cInovasiId === inov.id;
      }).map(c => c.desaId || c.desa_id));
      return {
        innovationId: idStr,
        namaInovasi: inov.namaInovasi || '',
        kategori: inov.kategori || '',
        tahunDibuat: inov.tahunDibuat || '-',
        inovator: innovator.namaInovator || '',
        jumlahDesa: claimedBy.size
      };
    });

    // Build Desa Dampingan
    const desaDampinganMap = new Map<string, { villageId: string, namaDesa: string, inovasiIdSet: Set<string> }>();
    claims.forEach(claim => {
      const cDesaId = (claim.desaId || claim.desa_id)?.toString();
      if (!cDesaId) return;
      if (!desaDampinganMap.has(cDesaId)) {
        const vData = villageData.find(v => v.userId === cDesaId || v.user_id === cDesaId || v._id.toString() === cDesaId);
        desaDampinganMap.set(cDesaId, {
          villageId: cDesaId,
          namaDesa: vData ? vData.namaDesa : (claim.namaDesa || 'Unknown'),
          inovasiIdSet: new Set()
        });
      }
      const cInovasiId = (claim.inovasiId || claim.inovasi_id || claim.idInovasi)?.toString();
      if (cInovasiId) {
        desaDampinganMap.get(cDesaId)!.inovasiIdSet.add(cInovasiId);
      }
    });

    const desaDampingan = Array.from(desaDampinganMap.values()).map(d => ({
      villageId: d.villageId,
      namaDesa: d.namaDesa,
      namaInovator: innovator.namaInovator || '',
      jumlahInovasi: d.inovasiIdSet.size
    }));

    // Export claims for Pertumbuhan Desa Dampingan
    const pertumbuhanDesa = claims.map(c => ({
      namaDesa: c.namaDesa || '',
      namaInovasi: c.namaInovasi || '',
      namaInovator: c.namaInovator || '',
      year: new Date(c.createdAt).getFullYear() || new Date().getFullYear()
    }));

    const responsePayload = {
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
      pertumbuhanDesa,
      daftarInovasi,
      desaDampingan
    }

    await setCachedData(cacheKey, responsePayload, 300)

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error('Error fetching innovator dashboard:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}