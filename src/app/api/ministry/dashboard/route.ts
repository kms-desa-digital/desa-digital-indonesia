import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { requireRole } from '@/lib/auth/apiAuth'

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
    const auth = await requireRole(request, ["kementerian", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const db = await connectToDatabase()

    // Hitung jumlah provinsi unik
    const distinctProvinces = await db.collection('villages').distinct('lokasi.provinsi.label');
    const distinctProvincesLegacy = await db.collection('villages').distinct('provinsi');
    const allProvinces = [...new Set([...distinctProvinces, ...distinctProvincesLegacy])].filter(Boolean);
    const totalProvinces = allProvinces.length;

    // Kategori Desa (Kesiapan Digital)
    const rawVillages = await db.collection('villages').find({}).toArray();
    const villageStatsMap: Record<string, number> = {
      "Sangat Siap": 0,
      "Siap": 0,
      "Cukup Siap": 0,
      "Kurang Siap": 0,
      "Belum Siap": 0
    };

    const resolveKesiapanDigital = (item: any) => {
      let kategori = item.kesiapanDigital || item.kategori || item.kategoriDesa;
      if (kategori && kategori !== 'ND' && kategori !== '-' && kategori.trim() !== '') {
        return kategori;
      }
      let score = 0;
      const jar = String(item.jaringan || '').toLowerCase();
      if (jar.includes('seluruh') || jar.includes('baik')) score += 3;
      else if (jar.includes('sebagian') || jar.includes('cukup')) score += 2;
      else if (jar.includes('tidak') || jar.includes('belum')) score += 1;

      const lis = String(item.listrik || '').toLowerCase();
      if (lis.includes('seluruh') || lis.includes('tersedia')) score += 3;
      else if (lis.includes('sebagian')) score += 2;
      else if (lis.includes('belum') || lis.includes('tidak')) score += 1;

      const tek = String(item.teknologi || '').toLowerCase();
      if (tek.includes('seluruh') || tek.includes('baik') || tek.includes('berkembang')) score += 3;
      else if (tek.includes('sebagian')) score += 2;
      else if (tek.includes('belum') || tek.includes('tidak')) score += 1;

      const kem = String(item.kemampuan || '').toLowerCase();
      if (kem.includes('sangat') || kem.includes('baik')) score += 3;
      else if (kem.includes('cukup')) score += 2;
      else if (kem.includes('belum') || kem.includes('tidak')) score += 1;

      if (score >= 10) return "Sangat Siap";
      if (score >= 8) return "Siap";
      if (score >= 6) return "Cukup Siap";
      if (score >= 4) return "Kurang Siap";
      return "Belum Siap";
    };

    rawVillages.forEach(v => {
      const cat = resolveKesiapanDigital(v);
      villageStatsMap[cat] = (villageStatsMap[cat] || 0) + 1;
    });

    const villageChartData = Object.keys(villageStatsMap).map((cat, idx) => ({
      id: idx + 1,
      name: cat,
      value: villageStatsMap[cat],
    })).filter(c => c.value > 0);

    // Kategori Inovasi
    const innovationStats = await db.collection('innovations').aggregate([
      { $group: { _id: '$kategori', count: { $sum: 1 } } }
    ]).toArray();
    const innovationChartData = innovationStats.map(s => ({
      name: s._id || 'Lainnya',
      value: s.count
    }));

    // Kategori Inovator
    const innovatorStats = await db.collection('innovators').aggregate([
      { $group: { _id: '$kategori', count: { $sum: 1 } } }
    ]).toArray();
    const innovatorChartData = innovatorStats.map(s => ({
      name: s._id || 'Lainnya',
      value: s.count
    }));

    const [
      totalVillages,
      verifiedVillages,
      totalInnovations,
      verifiedInnovations,
      totalInnovators,
      verifiedInnovators,
      totalUsers,
      villagesList,
      allClaims,
      innovatorsList,
    ] = await Promise.all([
      db.collection('villages').countDocuments(),
      db.collection('villages').countDocuments({ status: 'Terverifikasi' }),
      db.collection('innovations').countDocuments(),
      db.collection('innovations').countDocuments({ status: 'Terverifikasi' }),
      db.collection('innovators').countDocuments(),
      db.collection('innovators').countDocuments({ status: 'Terverifikasi' }),
      db.collection('users').countDocuments(),
      db.collection('villages').find({}).toArray(),
      db.collection('claimInnovations').find({}).toArray(),
      db.collection('innovators').find({}).toArray(),
    ])

    const { ObjectId } = require('mongodb');
    const pertumbuhanDesa = villagesList.map(v => {
      const vClaim = allClaims.find(c => c.desaId === v.userId || c.desaId === v._id.toString());
      let year = 2026;
      if (v.createdAt) {
        year = new Date(v.createdAt).getFullYear();
      } else if (ObjectId.isValid(v._id)) {
        year = new ObjectId(v._id).getTimestamp().getFullYear();
      }
      return {
        namaDesa: v.namaDesa || '-',
        namaInovasi: vClaim ? (vClaim.namaInovasi || '-') : '-',
        namaInovator: vClaim ? (vClaim.namaInovator || vClaim.namaInovasi || '-') : '-',
        year: year
      };
    });

    const mappedVillages = villagesList.map((v, idx) => {
      const prov = v.provinsi || v.lokasi?.provinsi?.label || 'Unknown';
      let lat = parseFloat(v.latitude);
      let lng = parseFloat(v.longitude);
      if (isNaN(lat) || isNaN(lng) || !lat || !lng) {
        const coords = getCoordsByProvince(prov, idx);
        lat = coords.lat;
        lng = coords.lng;
      }
      return { name: v.namaDesa || 'Desa', type: 'village', lat, lng };
    });

    const mappedInnovators = innovatorsList.map((i, idx) => {
      const prov = i.provinsi || i.lokasi?.provinsi?.label || 'Unknown';
      let lat = parseFloat(i.latitude);
      let lng = parseFloat(i.longitude);
      if (isNaN(lat) || isNaN(lng) || !lat || !lng) {
        const coords = getCoordsByProvince(prov, idx + 100);
        lat = coords.lat;
        lng = coords.lng;
      }
      return { name: i.namaInovator || 'Inovator', type: 'innovator', lat, lng };
    });

    const mapMarkers = [
      ...mappedVillages,
      ...mappedInnovators
    ].filter(m => m.lat && m.lng);

    return NextResponse.json(
      {
        dashboard: {
          villages: {
            total: totalVillages,
            verified: verifiedVillages,
          },
          provinces: totalProvinces,
          innovations: {
            total: totalInnovations,
            verified: verifiedInnovations,
          },
          innovators: {
            total: totalInnovators,
            verified: verifiedInnovators,
          },
          users: {
            total: totalUsers,
          },
          pieChart: {
            villages: villageChartData,
            innovators: innovatorChartData,
            innovations: innovationChartData,
          },
          pertumbuhanDesa,
          mapMarkers
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching ministry dashboard:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
