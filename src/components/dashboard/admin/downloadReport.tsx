import React, { useEffect, useState } from "react";
import {
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { DownloadIcon } from "@chakra-ui/icons";
import * as XLSX from "xlsx";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { getAuth } from "firebase/auth";

// Type Definitions
interface Village {
  desaId: string;
  namaDesa: string;
  jumlahInovasi?: number;
  kecamatan?: string;
  kabupatenKota?: string;
  provinsi?: string;
  kontak?: {
    whatsapp?: string;
    instagram?: string;
    website?: string;
  };
}

interface Innovator {
  namaInovator: string;
  kategori: string;
  jumlahInovasi: number;
}

interface Innovation {
  id?: string;
  namaInovasi: string;
  kategori: string;
  jumlahKlaim: number;
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const DownloadReport: React.FC = () => {
  const [villagesData, setVillagesData] = useState<Village[]>([]);
  const [innovatorsData, setInnovatorsData] = useState<Innovator[]>([]);
  const [innovationsData, setInnovationsData] = useState<Innovation[]>([]);
  const [desaPalingBanyakKlaimData, setDesaPalingBanyakKlaimData] = useState<{
    namaDesa: string;
    count: number;
  } | null>(null);
  const [desaPalingSedikitKlaimData, setDesaPalingSedikitKlaimData] = useState<{
    namaDesa: string;
    count: number;
  } | null>(null);
  const desaPalingBanyakKlaimText = desaPalingBanyakKlaimData
    ? desaPalingBanyakKlaimData.namaDesa
    : "-";
  const desaPalingSedikitKlaimText = desaPalingSedikitKlaimData
    ? desaPalingSedikitKlaimData.namaDesa
    : "-";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch All Data concurrently
        const [villageRes, innovatorRes, innovationRes, claimRes] = await Promise.all([
          fetch("/api/villages", { headers }),
          fetch("/api/innovator", { headers }),
          fetch("/api/innovations", { headers }),
          fetch("/api/villages/claim?status=Terverifikasi", { headers })
        ]);

        const villageDataRaw = await villageRes.json();
        const innovatorDataRaw = await innovatorRes.json();
        const innovationDataRaw = await innovationRes.json();
        const claimDataRaw = await claimRes.json();

        // 1. Fetch Villages
        const villageData = (villageDataRaw.villages || []).map((raw: any) => {
            const lokasi = raw.lokasi || {};
            return {
              desaId: raw._id || raw.id,
              ...raw,
              namaDesa: toTitleCase(lokasi?.desaKelurahan?.label ?? raw.namaDesa ?? "-"),
              kecamatan: toTitleCase(lokasi?.kecamatan?.label ?? raw.kecamatan ?? "-"),
              kabupatenKota: toTitleCase(lokasi?.kabupatenKota?.label ?? raw.kabupatenKota ?? "-"),
              provinsi: toTitleCase(lokasi?.provinsi?.label ?? raw.provinsi ?? "-"),
            } as Village;
          })
          .filter((data: Village) => data.namaDesa && data.namaDesa.trim() !== "");
        setVillagesData(villageData);

        // 2. Fetch Innovators
        const innovatorData = (innovatorDataRaw.data || []) as Innovator[];
        setInnovatorsData(innovatorData);

        // 3. Fetch Innovations
        const innovationData = (innovationDataRaw.innovations || []) as Innovation[];

        // 4. Fetch Claim Innovations
        const claimData = (claimDataRaw.claims || []) as {
          inovasiId: string;
          desaId: string;
          status: string;
          namaDesa?: string;
        }[];

        // === (A) Hitung klaim per Inovasi (berapa desa yang klaim inovasi itu) ===
        const inovasiClaimCountMap = new Map<string, number>();
        claimData.forEach((c) => {
          if (c.inovasiId) {
            inovasiClaimCountMap.set(
              c.inovasiId,
              (inovasiClaimCountMap.get(c.inovasiId) ?? 0) + 1
            );
          }
        });

        // Merge klaim count ke innovationData
        const innovationsWithClaims = innovationData.map((i) => ({
          ...i,
          jumlahKlaim: inovasiClaimCountMap.get(i.id!) ?? 0,
        }));
        setInnovationsData(innovationsWithClaims);

        // Hitung klaim per desaId dan simpan namaDesa dari claim
        const desaClaimCountMap = new Map<
          string,
          { count: number; namaDesa: string }
        >();
        claimData.forEach((c) => {
          if (c.desaId) {
            const existing = desaClaimCountMap.get(c.desaId);
            desaClaimCountMap.set(c.desaId, {
              count: (existing?.count ?? 0) + 1,
              namaDesa: c.namaDesa ?? "-", // langsung pakai namaDesa di claim
            });
          }
        });

        // Urutkan untuk cari paling banyak dan paling sedikit klaim
        const sortedDesaClaims = Array.from(desaClaimCountMap.entries()).sort(
          (a, b) => b[1].count - a[1].count
        );

        const desaPalingBanyakKlaim = sortedDesaClaims[0]?.[1] ?? null;
        const desaPalingSedikitKlaim =
          sortedDesaClaims[sortedDesaClaims.length - 1]?.[1] ?? null;

        setDesaPalingBanyakKlaimData(desaPalingBanyakKlaim);
        setDesaPalingSedikitKlaimData(desaPalingSedikitKlaim);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Warna header untuk autotable
  const headerStyles = {
    fillColor: [52, 115, 87], // #347357
    textColor: 255,
    fontStyle: "bold",
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    const totalVillage = villagesData.length;
    const totalInnovators = innovatorsData.length;
    const totalInnovation = innovationsData.length;

    const desaPalingBanyak = [...villagesData]
      .filter((v) => typeof v.jumlahInovasi === "number")
      .sort((a, b) => (b.jumlahInovasi ?? 0) - (a.jumlahInovasi ?? 0))[0];
    const desaPalingSedikit = [...villagesData]
      .filter((v) => typeof v.jumlahInovasi === "number")
      .sort((a, b) => (a.jumlahInovasi ?? 0) - (b.jumlahInovasi ?? 0))[0];

    const desaPalingBanyakKlaim = desaPalingBanyak
      ? `${desaPalingBanyak.namaDesa}, Kec. ${
          desaPalingBanyak.kecamatan ?? "-"
        }, Kab. ${desaPalingBanyak.kabupatenKota ?? "-"}, Prov. ${
          desaPalingBanyak.provinsi ?? "-"
        }`
      : "-";

    const desaPalingSedikitKlaim = desaPalingSedikit
      ? `${desaPalingSedikit.namaDesa}, Kec. ${
          desaPalingSedikit.kecamatan ?? "-"
        }, Kab. ${desaPalingSedikit.kabupatenKota ?? "-"}, Prov. ${
          desaPalingSedikit.provinsi ?? "-"
        }`
      : "-";

    // === Page 1: Summary ===
    doc.setFillColor(34, 102, 69);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, "F");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Report Admin", 15, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("KMS Desa Digital Indonesia", 15, 22);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Diunduh pada: ${new Date().toLocaleDateString("id-ID")}`,
      193,
      15,
      { align: "right" }
    );
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("Ringkasan Data:", 15, 42);

    autoTable(doc, {
      startY: 46,
      head: [["Inovator", "Inovasi", "Desa Digital"]],
      body: [[totalInnovators, totalInnovation, totalVillage]],
      styles: { fontSize: 11 },
      headStyles: headerStyles,
    });

    const sortedInnovators = [...innovatorsData]
      .filter((i) => typeof i.jumlahInovasi === "number")
      .sort((a, b) => {
        if ((a.jumlahInovasi ?? 0) !== (b.jumlahInovasi ?? 0)) {
          return (a.jumlahInovasi ?? 0) - (b.jumlahInovasi ?? 0);
        }
        return (a.namaInovator ?? "").localeCompare(b.namaInovator ?? "");
      });

    const inovatorTersedikit = sortedInnovators[0];
    const inovatorTerbanyak = sortedInnovators[sortedInnovators.length - 1];

    const sortedInnovations = [...innovationsData].sort((a, b) => {
      if ((a.jumlahKlaim ?? 0) !== (b.jumlahKlaim ?? 0)) {
        return (a.jumlahKlaim ?? 0) - (b.jumlahKlaim ?? 0);
      }
      return (a.namaInovasi ?? "").localeCompare(b.namaInovasi ?? "");
    });

    const inovasiTersedikit = sortedInnovations[0];
    const inovasiTerbanyak = sortedInnovations[sortedInnovations.length - 1];

    doc.setFontSize(10);
    const yStart = 70;
    const dataText = [
      `Inovator paling banyak inovasi : ${inovatorTerbanyak?.namaInovator ?? "-"}`,
      `Inovasi paling banyak diklaim : ${inovasiTerbanyak?.namaInovasi ?? "-"}`,
      `Desa paling banyak klaim : ${desaPalingBanyakKlaimText}`,
      ``,
      `Inovator paling sedikit inovasi : ${inovatorTersedikit?.namaInovator ?? "-"}`,
      `Inovasi paling sedikit diklaim : ${inovasiTersedikit?.namaInovasi ?? "-"}`,
      `Desa paling sedikit klaim : ${desaPalingSedikitKlaimText}`,
    ];

    dataText.forEach((text, i) => {
      doc.text(text, 15, yStart + i * 8);
    });

    // === Page 2: Village Data ===
    doc.addPage();
    doc.setFillColor(34, 102, 69);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, "F");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Report Admin", 15, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("KMS Desa Digital Indonesia", 15, 22);
    doc.setFontSize(8);
    doc.text(
      `Diunduh pada: ${new Date().toLocaleDateString("id-ID")}`,
      193,
      15,
      { align: "right" }
    );
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("Data Desa:", 15, 42);

    autoTable(doc, {
      startY: 46,
      head: [["No", "Desa", "Kecamatan", "Kabupaten", "Provinsi"]],
      body: [...villagesData]
        .sort((a, b) => a.namaDesa.localeCompare(b.namaDesa))
        .map((v, i) => [
          i + 1,
          toTitleCase(v.namaDesa || "-"),
          toTitleCase(v.kecamatan || "-"),
          toTitleCase(v.kabupatenKota || "-"),
          toTitleCase(v.provinsi || "-"),
        ]),

      styles: { fontSize: 9 },
      headStyles: headerStyles,
    });

    // === Page 3: Innovator Data ===
    doc.addPage();
    doc.setFillColor(34, 102, 69);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, "F");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Report Admin", 15, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("KMS Desa Digital Indonesia", 15, 22);
    doc.setFontSize(8);
    doc.text(
      `Diunduh pada: ${new Date().toLocaleDateString("id-ID")}`,
      193,
      15,
      { align: "right" }
    );
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("Data Inovator:", 15, 42);

    autoTable(doc, {
      startY: 46,
      head: [["No", "Nama Inovator", "Kategori", "Jumlah Inovasi"]],
      body: [...innovatorsData]
        .sort((a, b) =>
          (a.namaInovator || "").localeCompare(b.namaInovator || "")
        )
        .map((i, idx) => [
          idx + 1,
          i.namaInovator || "-",
          i.kategori || "-",
          i.jumlahInovasi ?? 0,
        ]),
      styles: { fontSize: 9 },
      headStyles: headerStyles,
    });

    // === Page 4: Innovation Data ===
    doc.addPage();
    doc.setFillColor(34, 102, 69);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, "F");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Report Admin", 15, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("KMS Desa Digital Indonesia", 15, 22);
    doc.setFontSize(8);
    doc.text(
      `Diunduh pada: ${new Date().toLocaleDateString("id-ID")}`,
      193,
      15,
      { align: "right" }
    );
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("Data Inovasi:", 15, 42);

    autoTable(doc, {
      startY: 46,
      head: [["No", "Nama Inovasi", "Kategori", "Jumlah Desa Klaim"]],
      body: [...innovationsData]
        .sort((a, b) =>
          (a.namaInovasi || "").localeCompare(b.namaInovasi || "")
        )
        .map((i, idx) => [
          idx + 1,
          i.namaInovasi || "-",
          i.kategori || "-",
          i.jumlahKlaim ?? 0,
        ]),
      styles: { fontSize: 9 },
      headStyles: headerStyles,
    });

    doc.save("Report Dashboard Admin.pdf");
  };

const handleDownloadExcel = async () => {
  const workbook = XLSX.utils.book_new();

  // === 1️⃣ Hitung total desa digital ===
  // Sama seperti di PDF
  const totalDigitalVillages = villagesData.length;

  // === 2️⃣ Innovator terbanyak/tersedikit inovasi ===
  const sortedInnovators = [...innovatorsData].sort((a, b) => {
    if ((a.jumlahInovasi ?? 0) !== (b.jumlahInovasi ?? 0)) {
      return (a.jumlahInovasi ?? 0) - (b.jumlahInovasi ?? 0);
    }
    return (a.namaInovator ?? "").localeCompare(b.namaInovator ?? "");
  });

  const inovatorTersedikit = sortedInnovators[0];
  const inovatorTerbanyak = sortedInnovators[sortedInnovators.length - 1];

  // === 3️⃣ Inovasi paling banyak dan paling sedikit diklaim ===
  const sortedInnovations = [...innovationsData].sort((a, b) => {
    if ((a.jumlahKlaim ?? 0) !== (b.jumlahKlaim ?? 0)) {
      return (a.jumlahKlaim ?? 0) - (b.jumlahKlaim ?? 0);
    }
    return (a.namaInovasi ?? "").localeCompare(b.namaInovasi ?? "");
  });

  const inovasiTersedikitKlaim = sortedInnovations[0];
  const inovasiTerbanyakKlaim = sortedInnovations[sortedInnovations.length - 1];

  // === 4️⃣ Desa paling banyak dan sedikit klaim ===
  // Ambil klaim inovasi terverifikasi dari Firestore
  const auth = getAuth();
  const currentUser = auth.currentUser;
  let claimData: any[] = [];
  if (currentUser) {
    const token = await currentUser.getIdToken();
    const claimRes = await fetch("/api/villages/claim?status=Terverifikasi", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const claimDataRaw = await claimRes.json();
    claimData = claimDataRaw.claims || [];
  }

  const desaClaimCountMap = new Map<string, { count: number; namaDesa: string }>();
  claimData.forEach((c) => {
    if (c.desaId) {
      const existing = desaClaimCountMap.get(c.desaId);
      desaClaimCountMap.set(c.desaId, {
        count: (existing?.count ?? 0) + 1,
        namaDesa: c.namaDesa ?? "-",
      });
    }
  });

  const sortedDesaKlaim = [...desaClaimCountMap.entries()].sort(
    (a, b) => b[1].count - a[1].count
  );

  const desaPalingBanyakKlaim = sortedDesaKlaim[0]?.[1]?.namaDesa ?? "-";
  const desaPalingSedikitKlaim = sortedDesaKlaim.at(-1)?.[1]?.namaDesa ?? "-";

  // === 5️⃣ Data summary persis seperti PDF ===
  const summaryInfo = [
    ["Total Inovator", innovatorsData.length],
    ["Total Inovasi", innovationsData.length],
    ["Total Desa Digital", totalDigitalVillages],
    [],
    ["Inovator paling banyak inovasi", inovatorTerbanyak?.namaInovator ?? "-"],
    ["Inovasi paling banyak diklaim", inovasiTerbanyakKlaim?.namaInovasi ?? "-"],
    ["Desa paling banyak klaim", desaPalingBanyakKlaim],
    [],
    ["Inovator paling sedikit inovasi", inovatorTersedikit?.namaInovator ?? "-"],    
    ["Inovasi paling sedikit diklaim", inovasiTersedikitKlaim?.namaInovasi ?? "-"],
    ["Desa paling sedikit klaim", desaPalingSedikitKlaim],
  ];

  // === 6️⃣ Fungsi untuk membersihkan fields ===
  const cleanFieldsInnovators = <T extends Record<string, any>>(data: T[]) =>
    data.map(({ logo, catatanAdmin, header, id, desaId, createdAt, editedAt, ...rest }) => rest);

  const cleanFieldsInnovations = <T extends Record<string, any>>(data: T[]) =>
    data.map(({ id, manfaat, innovatorId, images, desaId, hargaMinimal, hargaMaksimal, modelBisnis, 
      infrastruktur, createdAt, editedAt, ...rest }) => rest);

  const cleanFieldsVillages = <T extends Record<string, any>>(data: T[]) =>
  data.map(({ 
    id, catatanAdmin, header, infrastrukturDesa, kesiapanDigital, kesiapanTeknologi, logo, 
    pemantapanPelayanan, status, userId, desaId, createdAt, editedAt, inovasiId, inovasiDiTerapkan, 
    jumlahInovasiDiterapkan, ...rest 
  }) => {
    // Buang lokasi dan potensiDesa dari rest
    const { lokasi, potensiDesa, kecamatan, kabupatenKota, provinsi, ...otherFields } = rest;

    const lokasiObj = (lokasi ?? {}) as {
      desaKelurahan?: { label?: string; value?: string };
      kecamatan?: { label?: string; value?: string };
      kabupatenKota?: { label?: string; value?: string };
      provinsi?: { label?: string; value?: string };
    };

    return {
      ...otherFields,
      namadesa: toTitleCase(lokasiObj?.desaKelurahan?.label ?? "-"),
      kecamatan: toTitleCase(lokasiObj?.kecamatan?.label ?? "-"),
      kabupatenKota: toTitleCase(lokasiObj?.kabupatenKota?.label ?? "-"),
      provinsi: toTitleCase(lokasiObj?.provinsi?.label ?? "-"),
      potensiDesa: Array.isArray(potensiDesa)
        ? potensiDesa.join(", ")
        : potensiDesa ?? "-",
    };
  });

  // === 7️⃣ Tambahkan sheet ke workbook ===
  const generalSheet = XLSX.utils.aoa_to_sheet(summaryInfo);
  XLSX.utils.book_append_sheet(workbook, generalSheet, "Ringkasan Data");

  const innovatorSheet = XLSX.utils.json_to_sheet(cleanFieldsInnovators(innovatorsData));
  XLSX.utils.book_append_sheet(workbook, innovatorSheet, "Daftar Inovator");

  const innovationSheet = XLSX.utils.json_to_sheet(cleanFieldsInnovations(innovationsData));
  XLSX.utils.book_append_sheet(workbook, innovationSheet, "Daftar Inovasi");

  const villageSheet = XLSX.utils.json_to_sheet(cleanFieldsVillages(villagesData));
  XLSX.utils.book_append_sheet(workbook, villageSheet, "Daftar Desa");

  // === 8️⃣ Simpan file ===
  XLSX.writeFile(workbook, "Report Dashboard Admin.xlsx");
};

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={IconButton}
        aria-label="Download Report"
        icon={<DownloadIcon boxSize={5} color="white" />}
        variant="ghost"
        height="40px"
        padding={1}
        _hover={{ bg: "whiteAlpha.300" }}
        _active={{ bg: "whiteAlpha.400" }}
      />
      <MenuList>
        <MenuItem onClick={handleDownloadPDF}>Download as PDF</MenuItem>
        <MenuItem onClick={handleDownloadExcel}>Download as Excel</MenuItem>
      </MenuList>
    </Menu>
  );
};

export default DownloadReport;
