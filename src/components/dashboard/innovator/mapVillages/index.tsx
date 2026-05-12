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
  inovasiId: string;
  inovasiList: string[];
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
  const auth = getAuth();
  const [desaPins, setDesaPins] = useState<DesaPin[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [exportData, setExportData] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchDesaPins = async () => {
      const currentUID = auth.currentUser?.uid;
      if (!currentUID) return;

      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/innovator/dashboard', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const data = await response.json();

        const mapVillages = data.mapVillages || [];

        const pinResults: DesaPin[] = mapVillages.map((v: any, index: number) => ({
          desaId: `desa-${index}`,
          namaDesa: v.name || "Desa",
          lat: parseFloat(v.lat),
          lng: parseFloat(v.lng),
          provinsi: "Unknown",
          inovasiId: "-",
          inovasiList: [], // Data spesifik list inovasi tidak tersedia di respon mapVillages
        }));

        const exportTemp: any[] = mapVillages.map((v: any) => ({
          namaDesa: v.name || "-",
          namaInovasi: "-",
          kategoriInovasi: "-",
          namaInovator: data.innovator?.namaInovator || "-",
          desaKelurahan: v.name || "-",
          kecamatan: "-",
          kabupatenKota: "-",
          provinsi: "-",
          tanggalKlaim: "-",
          kategoriInovator: "-",
          tahunDibentuk: "-",
          targetPengguna: "-",
          modelBisnis: "-",
          produk: "-",
        }));

        setExportData(exportTemp);
        setDesaPins(pinResults);
        setTotals({}); // GeoJSON tidak diwarnai karena info provinsi tidak ada di response baru
      } catch (error) {
        console.error("Error fetching map villages:", error);
      }
    };

    fetchDesaPins();
  }, [auth.currentUser]);

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
            src={filterIcon}
            alt="Filter"
            boxSize="16px"
            cursor="pointer"
            onClick={onOpen}
          />
          <Menu>
            <MenuButton>
              <Image
                src={downloadIcon}
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
              .filter(d => !selectedProvince || d.provinsi === cleanName(selectedProvince))
              .map((desa) => (
                <Marker key={desa.desaId} position={[desa.lat, desa.lng]}>
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
        onApply={(province) => setSelectedProvince(province)}
        provinces={[...new Set(exportData.map((item) => item.provinsi))].sort()}
      />
    </Box>
  );
};

export default MapVillages;