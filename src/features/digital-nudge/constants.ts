export const BADGE_STYLES: Record<
  string,
  { name: string; icon: string; bg: string; border: string; color: string }
> = {
  // Village Badges
  penggerak_inovasi: {
    name: "Penggerak Inovasi",
    icon: "/icons/digital_nudge/PenggerakInovasi.svg",
    bg: "#FFF7ED",
    border: "#F97316",
    color: "#C2410C"
  },
  penggiat_digital: {
    name: "Penggiat Digital",
    icon: "/icons/digital_nudge/PenggiatDigital.svg",
    bg: "#EFF6FF",
    border: "#3B82F6",
    color: "#1D4ED8"
  },
  adopter_spesialis: {
    name: "Adopter Spesialis",
    icon: "/icons/digital_nudge/Adopter_Spesialis.svg",
    bg: "#FDF2F8",
    border: "#EC4899",
    color: "#BE185D"
  },
  adopter_giat: {
    name: "Adopter Giat",
    icon: "/icons/digital_nudge/Adopter_Giat.svg",
    bg: "#FEF9C3",
    border: "#EAB308",
    color: "#A16207"
  },
  sahabat_inovator: {
    name: "Sahabat Inovator",
    icon: "/icons/digital_nudge/Sahabat_Inovator.svg",
    bg: "#F5F3FF",
    border: "#8B5CF6",
    color: "#6D28D9"
  },
  // Innovator Badges
  terus_berkembang: {
    name: "Terus Berkembang",
    icon: "/icons/digital_nudge/TerusBerkembang.svg",
    bg: "#EFF6FF",
    border: "#3B82F6",
    color: "#1D4ED8"
  },
  si_inovatif: {
    name: "Si Inovatif",
    icon: "/icons/digital_nudge/SiInovatif.svg",
    bg: "#FFF7ED",
    border: "#F97316",
    color: "#C2410C"
  },
  kolaborator_handal: {
    name: "Kolaborator Handal",
    icon: "/icons/digital_nudge/KolaboratorHandal.svg",
    bg: "#F5F3FF",
    border: "#8B5CF6",
    color: "#6D28D9"
  },
  sahabat_desa: {
    name: "Sahabat Desa",
    icon: "/icons/digital_nudge/SahabatDesa.svg",
    bg: "#FDF2F8",
    border: "#EC4899",
    color: "#BE185D"
  },
  pemimpin_pasar: {
    name: "Pemimpin Pasar",
    icon: "/icons/digital_nudge/PemimpinPasar.svg",
    bg: "#FEF9C3",
    border: "#EAB308",
    color: "#A16207"
  }
};

export const VILLAGE_BADGES_INFO = [
  { id: "penggerak_inovasi", name: "Penggerak Inovasi", desc: "Diperoleh dengan menerapkan 3 inovasi digital", target: 3 },
  { id: "penggiat_digital", name: "Penggiat Digital", desc: "Diperoleh dengan menerapkan 7 inovasi digital", target: 7 },
  { id: "adopter_spesialis", name: "Adopter Spesialis", desc: "Diperoleh dengan menerapkan 5 inovasi dari kategori yang sama", target: 5 },
  { id: "adopter_giat", name: "Adopter Giat", desc: "Diperoleh dengan menerapkan 4 inovasi digital selama 6 bulan berturut-turut", target: 4 },
  { id: "sahabat_inovator", name: "Sahabat Inovator", desc: "Diperoleh dengan menerapkan beberapa inovasi digital dari 10 inovator berbeda", target: 10 },
];

export const INNOVATOR_BADGES_INFO = [
  { id: "terus_berkembang", name: "Terus Berkembang", desc: "Diperoleh dengan menambahkan 5 inovasi digital", target: 5 },
  { id: "si_inovatif", name: "Si Inovatif", desc: "Diperoleh dengan menambahkan 10 inovasi digital", target: 10 },
  { id: "kolaborator_handal", name: "Kolaborator Handal", desc: "Diperoleh dengan memiliki 15 desa dampingan", target: 15 },
  { id: "sahabat_desa", name: "Sahabat Desa", desc: "Diperoleh dengan memiliki 30 desa dampingan", target: 30 },
  { id: "pemimpin_pasar", name: "Pemimpin Pasar", desc: "Diperoleh dengan memiliki 100 desa dampingan", target: 100 },
];

