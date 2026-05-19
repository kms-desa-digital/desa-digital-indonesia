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

import { getAuth } from "firebase/auth";

import geoData from "@public/indonesia-province-simple.json";
import filterIcon from "@public/icons/icon-filter.svg";
import downloadIcon from "@public/icons/icon-download.svg";
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
  inovasiId: string | null;
  inovasiList: string[];
}

const cleanName = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, "");
};

const getColorByTotal = (total: number): string => {
  if (total === 0) return "#c8e6c9";
  if (total <= 10) return "#81c784";
  if (total <= 50) return "#66bb6a";
  if (total <= 100) return "#43a047";
  return "#2e7d32";
};

const provinceStyle = (feature: any, totals: Record<string, number>) => {
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

const onEachFeature = (feature: any, layer: L.Layer, totals: Record<string, number>) => {
  const rawName = feature?.properties?.Propinsi || "Unknown";
  const name = cleanName(rawName);
  const total = totals[name] ?? 0;
  layer.bindPopup(`${rawName}: ${total} desa digital`);
};

const Legend = () => (
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
      <Box mb="10px">50</Box>
      <Box mb="10px">100</Box>
    </Box>
  </Box>
);

const MapVillages = () => {
  const [desaPins, setDesaPins] = useState<DesaPin[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [exportData, setExportData] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const auth = getAuth();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        const response = await fetch('/api/ministry/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const data = await response.json();

        const mapMarkers = data.mapMarkers || [];
        const villageMarkers = mapMarkers.filter((m: any) => m.type === 'village');

        const exportTemp: any[] = villageMarkers.map((desa: any) => ({
          namaDesa: desa.name || "-",
          desaKelurahan: desa.name || "-",
          kecamatan: "-",
          kabupatenKota: "-",
          provinsi: "-",
          kategoriDesa: "-",
          idm: "-",
          potensi: "-",
          namaInovasi: "-",
          tanggalPengajuan: "-",
          namaInovator: "-",
          kategoriInovasi: "-",
        }));

        const pinsTemp: DesaPin[] = villageMarkers.map((desa: any, index: number) => ({
          desaId: `desa-${index}`,
          namaDesa: desa.name || "Desa",
          desaKelurahan: "-",
          kecamatan: "-",
          kabupatenKota: "-",
          provinsi: "Unknown",
          lat: parseFloat(desa.lat),
          lng: parseFloat(desa.lng),
          inovasiId: null,
          inovasiList: [],
        }));

        setExportData(exportTemp);
        setDesaPins(pinsTemp);
        setTotals({}); // GeoJSON kosong karena data provinsi tidak direturn API
      } catch (error) {
        console.error("Error fetching map data:", error);
      }
    };

    fetchAllData();
  }, []);

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const downloadDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Header with green background
    doc.setFillColor(0, 128, 0);
    doc.rect(0, 0, 1000, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    doc.setFontSize(15);
    doc.text("Dokumen Laporan Kementerian", 14, 13);
    doc.text("KMS Inovasi Desa Digital", 280, 13, { align: "right" });

    doc.setFontSize(12);
    doc.text("Diambil dari: Peta Sebaran Desa Digital", 14, 22);
    doc.text(`Diunduh pada: ${downloadDate}`, 280, 22, { align: "right" });

    // Reset text styles for content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");

    // Inovator profile section
    let y = 42;
    const labelX = 14;
    const valueX = 50;
    const lineHeight = 8;

    // Title before table
    doc.setFont("helvetica", "bold");
    doc.text(`Data Sebaran Inovasi Desa Digital`, labelX, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [[
        "Nama Desa",
        "Kecamatan",
        "Kabupaten",
        "Provinsi",
        "Kategori Desa",
        "IDM",
        "Potensi Desa",
        "Nama Inovasi",
        "Kategori Inovasi",
        "Nama Inovator",
      ]],
      body: exportData.map((row) => [
        row.desaKelurahan,
        row.kecamatan,
        row.kabupatenKota,
        row.provinsi,
        row.kategoriDesa,
        row.idm,
        row.potensi,
        row.namaInovasi,
        row.kategoriInovasi,
        row.namaInovator,
      ]),
      headStyles: {
        fillColor: [0, 128, 0],
        textColor: 255,
        fontStyle: "bold",
        minCellHeight: 12,
      },
      columnStyles: {
        0: { cellWidth: 25 },  // Desa
        1: { cellWidth: 25 },  // Kecamatan
        2: { cellWidth: 25 },  // Kabupaten
        3: { cellWidth: 25 },  // Provinsi
        4: { cellWidth: 25 },  // Kategori Desa
        5: { cellWidth: 15 },  // IDM
        6: { cellWidth: 35 },  // Potensi Desa
        7: { cellWidth: 30 },  // Nama Inovasi
        8: { cellWidth: 30 },  // Kategori Inovasi
        9: { cellWidth: 30 },  // Nama Inovator
      }
    } as any);

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

  return (
    <Box p={4} maxW="100%" mx="auto">
      <Flex justify="space-between" align="center" mb={3}>
        <Text {...headerTextStyle}>Peta Sebaran Desa Digital</Text>
        <Flex gap={2} align="center">
          <Image
            src={filterIcon.src}
            alt="Filter"
            boxSize="16px"
            cursor="pointer"
            onClick={onOpen}
          />
          <Menu>
            <MenuButton>
              <Image
                src={downloadIcon.src}
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
                style={(feature) => provinceStyle(feature, totals)}
                onEachFeature={(feature, layer) => onEachFeature(feature, layer, totals)}
              />
            )}
            {desaPins
              .filter(
                (desa) =>
                  desa.lat !== undefined &&
                  desa.lng !== undefined &&
                  !isNaN(desa.lat) &&
                  !isNaN(desa.lng) &&
                  (!selectedProvince || cleanName(desa.provinsi) === cleanName(selectedProvince))
              )
              .map((desa) => (
                <Marker key={desa.desaId} position={[desa.lat, desa.lng]} icon={getCustomIcon()}>
                  <Popup>
                    <strong>{desa.namaDesa}</strong>
                    <br />
                    Inovasi: {desa.inovasiList.length > 0 ? desa.inovasiList.join(", ") : "-"}
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
        onApply={(province) => setSelectedProvince(province)}
        provinces={[...new Set(desaPins.map((item) => item.provinsi))].sort()}
      />
    </Box>
  );
};

export default MapVillages;