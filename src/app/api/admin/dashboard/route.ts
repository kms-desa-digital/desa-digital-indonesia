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
    const auth = await requireRole(request, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const cacheKey = `cache:admin:dashboard`;
    const cached = await getCachedData<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { status: 200 });
    }

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

    // Gunakan Promise.all untuk mengambil data secara konkuren dan terapkan proyeksi
    const [
      totalUsers,
      totalInnovations,
      totalVillages,
      totalInnovators,
      top5VillagesData,
      top5InnovatorsData,
      top5InnovationsData,
      allVillages,
      allInnovators
    ] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('innovations').countDocuments(),
      db.collection('villages').countDocuments(),
      db.collection('innovators').countDocuments(),
      
      db.collection('villages').find({}, { projection: { namaDesa: 1, jumlahInovasiDiterapkan: 1, latitude: 1, longitude: 1 } })
        .sort({ jumlahInovasiDiterapkan: -1 }).limit(5).toArray(),
        
      db.collection('innovators').find({}, { projection: { namaInovator: 1, jumlahInovasi: 1, latitude: 1, longitude: 1 } })
        .sort({ jumlahInovasi: -1 }).limit(5).toArray(),
        
      db.collection('innovations').find({}, { projection: { namaInovasi: 1, jumlahKlaim: 1, kategori: 1 } })
        .sort({ jumlahKlaim: -1 }).limit(5).toArray(),
        
      db.collection('villages').find({}, { projection: { namaDesa: 1, latitude: 1, longitude: 1, provinsi: 1, lokasi: 1 } }).toArray(),
      
      db.collection('innovators').find({}, { projection: { namaInovator: 1, latitude: 1, longitude: 1, provinsi: 1, lokasi: 1 } }).toArray()
    ]);

    const top5Villages = top5VillagesData.map(v => ({
      name: v.namaDesa || '',
      totalInovasi: v.jumlahInovasiDiterapkan || 0,
      lat: v.latitude || 0,
      lng: v.longitude || 0
    }));

    const top5Innovators = top5InnovatorsData.map(i => ({
      name: i.namaInovator || '',
      totalInovasi: i.jumlahInovasi || 0,
      lat: i.latitude || 0,
      lng: i.longitude || 0
    }));

    const top5Innovations = top5InnovationsData.map(i => ({
      name: i.namaInovasi || '',
      totalKlaim: i.jumlahKlaim || 0,
      kategori: i.kategori || ''
    }));

    // Data map markers
    const mappedVillages = allVillages.map((v, idx) => {
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

    const mappedInnovators = allInnovators.map((i, idx) => {
      const prov = i.provinsi || i.lokasi?.provinsi?.label || 'Unknown';
      let lat = parseFloat(i.latitude);
      let lng = parseFloat(i.longitude);
      if (isNaN(lat) || isNaN(lng) || !lat || !lng) {
        const coords = getCoordsByProvince(prov, idx + 100); // offset index to avoid complete overlap with villages
        lat = coords.lat;
        lng = coords.lng;
      }
      return { name: i.namaInovator || 'Inovator', type: 'innovator', lat, lng };
    });

    const mapMarkers = [
      ...mappedVillages,
      ...mappedInnovators
    ].filter(m => m.lat && m.lng);

    const dashboardData = {
      totalUsers,
      totalInnovations,
      totalVillages,
      totalInnovators,
      top5Villages,
      top5Innovators,
      top5Innovations,
      mapMarkers
    };

    // Simpan ke cache selama 5 menit (300 detik)
    await setCachedData(cacheKey, dashboardData, 300);

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching admin dashboard:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}