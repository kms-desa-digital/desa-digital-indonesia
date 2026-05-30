import { Db, ObjectId } from 'mongodb';

export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress: number;
  target: number;
}

export const VILLAGE_BADGES_DEF = [
  {
    id: 'penggerak_inovasi',
    name: 'Penggerak Inovasi',
    description: 'Diperoleh dengan menerapkan 3 inovasi digital',
    icon: '/icons/digital_nudge/PenggerakInovasi.svg',
    target: 3,
  },
  {
    id: 'penggiat_digital',
    name: 'Penggiat Digital',
    description: 'Diperoleh dengan menerapkan 7 inovasi digital',
    icon: '/icons/digital_nudge/PenggiatDigital.svg',
    target: 7,
  },
  {
    id: 'adopter_spesialis',
    name: 'Adopter Spesialis',
    description: 'Diperoleh dengan menerapkan 5 inovasi dari kategori yang sama',
    icon: '/icons/digital_nudge/Adopter_Spesialis.svg',
    target: 5,
  },
  {
    id: 'adopter_giat',
    name: 'Adopter Giat',
    description: 'Diperoleh dengan menerapkan 4 inovasi digital selama 6 bulan berturut-turut',
    icon: '/icons/digital_nudge/Adopter_Giat.svg',
    target: 6,
  },
  {
    id: 'sahabat_inovator',
    name: 'Sahabat Inovator',
    description: 'Diperoleh dengan menerapkan beberapa inovasi digital dari 10 inovator berbeda',
    icon: '/icons/digital_nudge/Sahabat_Inovator.svg',
    target: 10,
  },
];

export const INNOVATOR_BADGES_DEF = [
  {
    id: 'terus_berkembang',
    name: 'Terus Berkembang',
    description: 'Diperoleh dengan menambahkan 5 inovasi digital',
    icon: '/icons/digital_nudge/TerusBerkembang.svg',
    target: 5,
  },
  {
    id: 'si_inovatif',
    name: 'Si Inovatif',
    description: 'Diperoleh dengan menambahkan 10 inovasi digital',
    icon: '/icons/digital_nudge/SiInovatif.svg',
    target: 10,
  },
  {
    id: 'kolaborator_handal',
    name: 'Kolaborator Handal',
    description: 'Diperoleh dengan memiliki 15 desa dampingan',
    icon: '/icons/digital_nudge/KolaboratorHandal.svg',
    target: 15,
  },
  {
    id: 'sahabat_desa',
    name: 'Sahabat Desa',
    description: 'Diperoleh dengan memiliki 30 desa dampingan',
    icon: '/icons/digital_nudge/SahabatDesa.svg',
    target: 30,
  },
  {
    id: 'pemimpin_pasar',
    name: 'Pemimpin Pasar',
    description: 'Diperoleh dengan memiliki 100 desa dampingan',
    icon: '/icons/digital_nudge/PemimpinPasar.svg',
    target: 100,
  },
];

// Helper to calculate longest consecutive months sequence
export function getConsecutiveMonths(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const yearMonths = dates.map(d => {
    const date = new Date(d);
    return date.getFullYear() * 12 + date.getMonth();
  });
  const uniqueMonths = [...new Set(yearMonths)].sort((a, b) => a - b);
  
  let maxStreak = 0;
  let currentStreak = 0;
  let lastMonth = -999;
  for (const m of uniqueMonths) {
    if (m === lastMonth + 1) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    lastMonth = m;
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
  }
  return maxStreak;
}

export async function evaluateVillageBadges(db: Db, villageId: string) {
  // Find village to get activeBadge
  let village = null;
  try {
    if (ObjectId.isValid(villageId)) {
      village = await db.collection('villages').findOne({ _id: new ObjectId(villageId) });
    }
  } catch (e) {}

  if (!village) {
    village = await db.collection('villages').findOne({
      $or: [{ userId: villageId }, { _id: villageId as any }]
    });
  }

  const activeBadge = village?.activeBadge || null;
  const possibleIds = [villageId];
  if (village) {
    possibleIds.push(village._id.toString());
    if (village.userId) possibleIds.push(village.userId);
  }
  const uniqueIds = [...new Set(possibleIds)];

  // Get direct verified innovations
  const directInnovations = await db.collection('innovations')
    .find({ desaId: { $in: uniqueIds }, status: 'Terverifikasi' })
    .toArray();

  // Get verified claims
  const verifiedClaims = await db.collection('claimInnovations')
    .find({ desaId: { $in: uniqueIds }, status: 'Terverifikasi' })
    .toArray();

  // Merge unique applied innovations
  const appliedInnovations: any[] = [];
  const existingIds = new Set<string>();

  for (const item of directInnovations) {
    const id = item._id.toString();
    existingIds.add(id);
    appliedInnovations.push({
      id,
      kategori: item.kategori || 'Inovasi Digital',
      innovatorId: item.innovatorId || '',
      namaInnovator: item.namaInnovator || '',
      createdAt: item.createdAt || item.updatedAt || new Date(),
    });
  }

  for (const item of verifiedClaims) {
    const inovasiIdStr = item.inovasiId ? item.inovasiId.toString() : null;
    if (!inovasiIdStr || !existingIds.has(inovasiIdStr)) {
      appliedInnovations.push({
        id: item._id.toString(),
        kategori: item.kategori || 'Inovasi Manual',
        innovatorId: item.innovatorId || '',
        namaInnovator: item.namaInnovator || item.namaInovator || '',
        createdAt: item.createdAt || item.updatedAt || new Date(),
      });
    }
  }

  const totalApplied = appliedInnovations.length;

  // 1. Penggerak Inovasi (Target 3)
  const isPenggerakUnlocked = totalApplied >= 3;
  const progressPenggerak = Math.min(totalApplied, 3);

  // 2. Penggiat Digital (Target 7)
  const isPenggiatUnlocked = totalApplied >= 7;
  const progressPenggiat = Math.min(totalApplied, 7);

  // 3. Adopter Spesialis (Target 5, kategori yang sama)
  const categoryCounts: Record<string, number> = {};
  for (const item of appliedInnovations) {
    const cat = item.kategori || 'Inovasi Digital';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const maxCategoryCount = Object.values(categoryCounts).reduce((max, val) => Math.max(max, val), 0);
  const isAdopterSpesialisUnlocked = maxCategoryCount >= 5;
  const progressAdopterSpesialis = Math.min(maxCategoryCount, 5);

  // 4. Adopter Giat (Target 4 inovasi selama 6 bulan berturut-turut)
  const applicationDates = appliedInnovations.map(item => new Date(item.createdAt));
  const consecutiveMonths = getConsecutiveMonths(applicationDates);
  const progressAdopterGiat = Math.min(consecutiveMonths, 6);
  const isAdopterGiatUnlocked = totalApplied >= 4 && consecutiveMonths >= 6;

  // 5. Sahabat Inovator (Target 10 inovator berbeda)
  const uniqueInnovators = new Set<string>();
  for (const item of appliedInnovations) {
    const ident = item.innovatorId || item.namaInnovator;
    if (ident) {
      uniqueInnovators.add(ident.toString());
    }
  }
  const totalInnovators = uniqueInnovators.size;
  const isSahabatInovatorUnlocked = totalInnovators >= 10;
  const progressSahabatInovator = Math.min(totalInnovators, 10);

  const badgesList: BadgeInfo[] = [
    {
      id: 'penggerak_inovasi',
      name: 'Penggerak Inovasi',
      description: VILLAGE_BADGES_DEF[0].description,
      icon: VILLAGE_BADGES_DEF[0].icon,
      isUnlocked: isPenggerakUnlocked,
      progress: progressPenggerak,
      target: 3,
    },
    {
      id: 'penggiat_digital',
      name: 'Penggiat Digital',
      description: VILLAGE_BADGES_DEF[1].description,
      icon: VILLAGE_BADGES_DEF[1].icon,
      isUnlocked: isPenggiatUnlocked,
      progress: progressPenggiat,
      target: 7,
    },
    {
      id: 'adopter_spesialis',
      name: 'Adopter Spesialis',
      description: VILLAGE_BADGES_DEF[2].description,
      icon: VILLAGE_BADGES_DEF[2].icon,
      isUnlocked: isAdopterSpesialisUnlocked,
      progress: progressAdopterSpesialis,
      target: 5,
    },
    {
      id: 'adopter_giat',
      name: 'Adopter Giat',
      description: VILLAGE_BADGES_DEF[3].description,
      icon: VILLAGE_BADGES_DEF[3].icon,
      isUnlocked: isAdopterGiatUnlocked,
      progress: progressAdopterGiat,
      target: 6,
    },
    {
      id: 'sahabat_inovator',
      name: 'Sahabat Inovator',
      description: VILLAGE_BADGES_DEF[4].description,
      icon: VILLAGE_BADGES_DEF[4].icon,
      isUnlocked: isSahabatInovatorUnlocked,
      progress: progressSahabatInovator,
      target: 10,
    },
  ];

  return {
    activeBadge,
    badges: badgesList,
  };
}

export async function evaluateInnovatorBadges(db: Db, innovatorId: string) {
  // Find innovator
  let innovator = null;
  try {
    if (ObjectId.isValid(innovatorId)) {
      innovator = await db.collection('innovators').findOne({ _id: new ObjectId(innovatorId) });
    }
  } catch (e) {}

  if (!innovator) {
    innovator = await db.collection('innovators').findOne({
      $or: [{ userId: innovatorId }, { _id: innovatorId as any }]
    });
  }

  const activeBadge = innovator?.activeBadge || null;
  const targetIds = [innovatorId];
  if (innovator) {
    targetIds.push(innovator._id.toString());
    if (innovator.userId) targetIds.push(innovator.userId);
  }
  const uniqueTargetIds = [...new Set(targetIds)];

  // Get all verified innovations owned by this innovator
  const innovations = await db.collection('innovations')
    .find({
      innovatorId: { $in: uniqueTargetIds },
      status: 'Terverifikasi'
    })
    .toArray();

  const totalInnovations = innovations.length;

  // Calculate unique applied villages
  const uniqueDesas = new Set<string>();
  for (const item of innovations) {
    if (Array.isArray(item.desaId)) {
      for (const dId of item.desaId) {
        if (dId) uniqueDesas.add(dId.toString());
      }
    }
  }
  const totalDesas = uniqueDesas.size;

  // 1. Terus Berkembang (Target 5)
  const isTerusBerkembangUnlocked = totalInnovations >= 5;
  const progressTerusBerkembang = Math.min(totalInnovations, 5);

  // 2. Si Inovatif (Target 10)
  const isSiInovatifUnlocked = totalInnovations >= 10;
  const progressSiInovatif = Math.min(totalInnovations, 10);

  // 3. Kolaborator Handal (Target 15)
  const isKolaboratorHandalUnlocked = totalDesas >= 15;
  const progressKolaboratorHandal = Math.min(totalDesas, 15);

  // 4. Sahabat Desa (Target 30)
  const isSahabatDesaUnlocked = totalDesas >= 30;
  const progressSahabatDesa = Math.min(totalDesas, 30);

  // 5. Pemimpin Pasar (Target 100)
  const isPemimpinPasarUnlocked = totalDesas >= 100;
  const progressPemimpinPasar = Math.min(totalDesas, 100);

  const badgesList: BadgeInfo[] = [
    {
      id: 'terus_berkembang',
      name: 'Terus Berkembang',
      description: INNOVATOR_BADGES_DEF[0].description,
      icon: INNOVATOR_BADGES_DEF[0].icon,
      isUnlocked: isTerusBerkembangUnlocked,
      progress: progressTerusBerkembang,
      target: 5,
    },
    {
      id: 'si_inovatif',
      name: 'Si Inovatif',
      description: INNOVATOR_BADGES_DEF[1].description,
      icon: INNOVATOR_BADGES_DEF[1].icon,
      isUnlocked: isSiInovatifUnlocked,
      progress: progressSiInovatif,
      target: 10,
    },
    {
      id: 'kolaborator_handal',
      name: 'Kolaborator Handal',
      description: INNOVATOR_BADGES_DEF[2].description,
      icon: INNOVATOR_BADGES_DEF[2].icon,
      isUnlocked: isKolaboratorHandalUnlocked,
      progress: progressKolaboratorHandal,
      target: 15,
    },
    {
      id: 'sahabat_desa',
      name: 'Sahabat Desa',
      description: INNOVATOR_BADGES_DEF[3].description,
      icon: INNOVATOR_BADGES_DEF[3].icon,
      isUnlocked: isSahabatDesaUnlocked,
      progress: progressSahabatDesa,
      target: 30,
    },
    {
      id: 'pemimpin_pasar',
      name: 'Pemimpin Pasar',
      description: INNOVATOR_BADGES_DEF[4].description,
      icon: INNOVATOR_BADGES_DEF[4].icon,
      isUnlocked: isPemimpinPasarUnlocked,
      progress: progressPemimpinPasar,
      target: 100,
    },
  ];

  return {
    activeBadge,
    badges: badgesList,
  };
}
