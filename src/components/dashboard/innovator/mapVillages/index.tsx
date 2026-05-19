import { useEffect, useState } from "react";
import {
  Flex,
  Box,
  Text,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
} from "@chakra-ui/react";
import { useAuthToken } from "Hooks/useAuthToken";

import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
} from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

const getCustomIcon = () => {
    return L.divIcon({
        html: `<div style="display: flex; justify-content: center; align-items: center; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.35));">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#2e7d32">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
        </div>`,
        className: 'custom-leaflet-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

import geoData from "@public/indonesia-province-simple.json";
import ProvinceFilter from "./mapFilter";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  headerTextStyle,
  MapContainerWrapper,
  StyledMapBox,
  StyledLegendOnMap,
} from "./_mapVillagesStyle";

interface DesaPin {
  desaId: string;
  namaDesa: string;
  lat: number;
  lng: number;
  provinsi: string;
  rawProvinsi?: string;
  kabupatenKota?: string;
  kecamatan?: string;
  inovasiId: string;
  inovasiList: string[];
}

interface FilterValues {
  provinsi: string;
  kabupatenKota: string;
  kecamatan: string;
  namaDesa: string;
}

const cleanName = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, "");
};

const getColorByTotal = (total: number): string => {
  if (total === 0) return "#c8e6c9";
  if (total <= 3) return "#81c784";
  if (total <= 5) return "#66bb6a";
  if (total <= 10) return "#43a047";
  return "#2e7d32";
};

const provinceStyle = (totals: Record<string, number>) => (feature: any) => {
  const rawName = feature?.properties?.Propinsi || "unknown";
  const name = cleanName(rawName);
  const total = totals[name] ?? 0;
  return {
    fillColor: getColorByTotal(total),
    weight: 1,
    color: "white",
    fillOpacity: 0.8,
  };
};

const onEachFeature = (totals: Record<string, number>) => (
  feature: any,
  layer: L.Layer
) => {
  const rawName = feature?.properties?.Propinsi || "Unknown";
  const name = cleanName(rawName);
  const total = totals[name] ?? 0;
  layer.bindPopup(`${rawName}: ${total} desa dampingan`);
  console.log("rawName:", rawName, "cleaned:", name, "total:", total, "totals:", totals);
};

const Legend = () => {
  return (
    <Box
      mt={4}
      width="80%"
      mx="auto"
      textAlign="center"
      fontSize="sm"
      userSelect="none"
    >
      <Box
        height="10px"
        borderRadius="10px"
        background="linear-gradient(to right, #c8e6c9, #2e7d32)"
        border="1px solid #ccc"
      />
      <Box
        mt={1}
        display="flex"
        justifyContent="space-between"
        px={1}
        color="gray.700"
        fontWeight="medium"
      >
        <Box mb="10px">0</Box>
        <Box mb="10px">5</Box>
        <Box mb="10px">10+</Box>
      </Box>
    </Box>
  );
};

const MapVillages = () => {
  const { token, isLoaded: authLoaded } = useAuthToken();
  const [desaPins, setDesaPins] = useState<DesaPin[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [exportData, setExportData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>({
    provinsi: "",
    kabupatenKota: "",
    kecamatan: "",
    namaDesa: "",
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchDesaPins = async () => {
      if (!authLoaded) return;
      if (!token) {
        setError("User not authenticated.");
        return;
      }

      try {
        const response = await fetch('/api/innovator/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to fetch dashboard data");
        }
        const data = await response.json();

        const mapVillages = data.mapVillages || [];

        const pinResults: DesaPin[] = mapVillages.map((v: any, index: number) => ({
          desaId: `desa-${index}`,
          namaDesa: v.name || "Desa",
          lat: parseFloat(v.lat),
          lng: parseFloat(v.lng),
          provinsi: cleanName(v.provinsi || "Unknown"),
          rawProvinsi: v.provinsi || "Unknown",
          kabupatenKota: v.kabupatenKota || "",
          kecamatan: v.kecamatan || "",
          inovasiId: "-",
          inovasiList: v.inovasiList || [],
        }));

        const exportTemp: any[] = mapVillages.map((v: any) => ({
          namaDesa: v.name || "-",
          namaInovasi: v.namaInovasi || "-",
          kategoriInovasi: v.kategoriInovasi || "-",
          namaInovator: data.innovator?.namaInovator || "-",
          desaKelurahan: v.desaKelurahan || v.name || "-",
          kecamatan: v.kecamatan || "-",
          kabupatenKota: v.kabupatenKota || "-",
          provinsi: v.provinsi || "-",
          tanggalKlaim: "-",
          kategoriInovator: data.innovator?.kategori || "-",
          tahunDibentuk: data.innovator?.tahunDibentuk || "-",
          targetPengguna: data.innovator?.targetPengguna || "-",
          modelBisnis: data.innovator?.modelBisnis || "-",
          produk: data.innovator?.produk || "-",
        }));

        setExportData(exportTemp);
        setDesaPins(pinResults);

        // Calculate counts of villages per province for GeoJSON mapping
        const provinceTotals: Record<string, number> = {};
        mapVillages.forEach((v: any) => {
          const provName = cleanName(v.provinsi || "");
          if (provName) {
            provinceTotals[provName] = (provinceTotals[provName] || 0) + 1;
          }
        });
        setTotals(provinceTotals);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setError(message);
        console.error("Error fetching map villages:", error);
      }
    };

    fetchDesaPins();
  }, [authLoaded, token]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const downloadDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const inovatorProfile = exportData[0];

    // Header with green background
    doc.setFillColor(0, 128, 0);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    doc.setFontSize(15);
    doc.text("Dokumen Laporan Inovator", 14, 13);
    doc.text(inovatorProfile.namaInovator || "-", 190, 13, { align: "right" });

    doc.setFontSize(12);
    doc.text("KMS Inovasi Desa Digital", 14, 22);
    doc.text(`Diunduh pada: ${downloadDate}`, 190, 22, { align: "right" });

    // Reset styles for content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    // Inovator profile section
    const profileStartY = 42;
    let y = profileStartY;

    const labelX = 14;
    const valueX = 50;
    const lineHeight = 8;

    doc.text("Profil Inovator", 14, y);
    y += lineHeight;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    doc.text("Nama", labelX, y);
    doc.text(`: ${inovatorProfile.namaInovator || "-"}`, valueX, y);
    y += lineHeight;

    doc.text("Kategori", labelX, y);
    doc.text(`: ${inovatorProfile.kategoriInovator || "-"}`, valueX, y);
    y += lineHeight;

    doc.text("Tahun Dibentuk", labelX, y);
    doc.text(`: ${inovatorProfile.tahunDibentuk || "-"}`, valueX, y);
    y += lineHeight;

    doc.text("Target Pengguna", labelX, y);
    doc.text(`: ${inovatorProfile.targetPengguna || "-"}`, valueX, y);
    y += lineHeight;

    doc.text("Model Bisnis", labelX, y);
    doc.text(`: ${inovatorProfile.modelBisnis || "-"}`, valueX, y);
    y += lineHeight;

    doc.text("Produk", labelX, y);
    doc.text(`: ${inovatorProfile.produk || "-"}`, valueX, y);
    y += 10;

    // Table starts after profile
    y += 5;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Data Sebaran Inovasi ${inovatorProfile.namaInovator || "-"}`, 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [[
        "No.",
        "Nama Desa",
        "Nama Inovasi",
        "Kategori Inovasi",
        "Kecamatan",
        "Kabupaten",
        "Provinsi",
        "Tahun Klaim",
      ]],
      body: exportData.map((row, idx) => [
        idx + 1,
        row.desaKelurahan,
        row.namaInovasi,
        row.kategoriInovasi,
        row.kecamatan,
        row.kabupatenKota,
        row.provinsi,
        row.tanggalKlaim,
      ]),
      headStyles: {
        fillColor: [0, 128, 0],
        textColor: 255,
        fontStyle: 'bold',
      },
    });

    doc.save("data_sebaran_inovasi.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Sebaran Inovasi");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, "data_sebaran_inovasi.xlsx");
  };

  const inovatorProfile = exportData.length > 0 ? exportData[0] : null;
  console.log("GeoJSON render totals:", totals);

  return (
    <Box p={4} maxW="100%" mx="auto">
      <Flex justify="space-between" align="center" mb={2} mt={2}>
        <Text {...headerTextStyle}>Peta Sebaran Inovasi {inovatorProfile?.namaInovator || "Inovator"}</Text>
        <Flex gap={2} align="center">
          <Image
            src="/icons/icon-filter.svg"
            alt="Filter"
            boxSize="16px"
            cursor="pointer"
            onClick={onOpen}
          />
          <Menu>
            <MenuButton>
              <Image
                src="/icons/icon-download.svg"
                alt="Download"
                boxSize="16px"
                cursor="pointer"
                marginRight={2}
              />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleDownloadPDF}>Download PDF</MenuItem>
              <MenuItem onClick={handleDownloadExcel}>Download Excel</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      <MapContainerWrapper>
        <StyledMapBox>
          <MapContainer center={[2, 120]} zoom={3}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {Object.keys(totals).length > 0 && (
              <GeoJSON
                data={geoData as any}
                style={provinceStyle(totals)}
                onEachFeature={onEachFeature(totals)}
              />
            )}
            {desaPins
              .filter((d) => {
                const matchProv = !filters.provinsi || (d.rawProvinsi || d.provinsi) === filters.provinsi;
                const matchKab = !filters.kabupatenKota || d.kabupatenKota === filters.kabupatenKota;
                const matchKec = !filters.kecamatan || d.kecamatan === filters.kecamatan;
                const matchDesa = !filters.namaDesa || d.namaDesa === filters.namaDesa;
                return matchProv && matchKab && matchKec && matchDesa;
              })
              .map((desa) => (
                <Marker key={desa.desaId} position={[desa.lat, desa.lng]} icon={getCustomIcon()}>
                  <Popup>
                    <strong>{desa.namaDesa}</strong>
                    <br />
                    Inovasi: {desa.inovasiList.join(", ")}
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </StyledMapBox>
        <Legend />
      </MapContainerWrapper>

      <ProvinceFilter
        isOpen={isOpen}
        onClose={onClose}
        onApply={(newFilters) => setFilters(newFilters)}
        allPins={desaPins}
        currentFilters={filters}
      />
    </Box>
  );
};

export default MapVillages;