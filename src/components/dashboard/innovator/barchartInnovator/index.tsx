import {
  Box,
  Text,
  Flex,
  Image,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useAuthToken } from "Hooks/useAuthToken";

import YearRangeFilter from "./dateFilter";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const BarChartInovasi = () => {
  const { token, isLoaded: authLoaded } = useAuthToken();

  const [showFilter, setShowFilter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const [yearRange, setYearRange] = useState<[number, number]>([2010, currentYear]);
  const [dataByYear, setDataByYear] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  const [formattedData, setFormattedData] = useState<
    { namaDesa: string; namaInovasi: string; namaInovator: string; year: number }[]
  >([]);

  const [profilInovator, setProfilInovator] = useState<{
    namaInovator: string;
    kategoriInovator: string;
    tahunDibentuk: string | number;
    targetPengguna: string;
    produk: string;
    modelBisnis: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!authLoaded) return;
      setLoading(true);
      setError(null);
      try {
        if (!token) {
          setError("User not authenticated.");
          setDataByYear({});
          setLoading(false);
          return;
        }

        const response = await fetch('/api/innovator/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to fetch dashboard data");
        }
        const data = await response.json();

        setProfilInovator({
          namaInovator: data.innovator?.namaInovator || "-",
          kategoriInovator: data.innovator?.kategori || "-",
          tahunDibentuk: data.innovator?.tahunDibentuk || "-",
          targetPengguna: data.innovator?.targetPengguna || "-",
          modelBisnis: data.innovator?.modelBisnis || "-",
          produk: (data.top3Innovations || []).map((i: any) => i.name).join(", ") || "-",
        });

        const claimsData = data.pertumbuhanDesa || [];
        
        // Filter based on selected yearRange
        const filteredData = claimsData.filter((item: any) => item.year >= yearRange[0] && item.year <= yearRange[1]);
        setFormattedData(filteredData);
        
        const yearCount: Record<number, number> = {};
        filteredData.forEach((item: any) => {
          yearCount[item.year] = (yearCount[item.year] || 0) + 1;
        });
        
        setDataByYear(yearCount);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error:", err);
        setDataByYear({});
        setFormattedData([]);
      }
      setLoading(false);
    };

    fetchData();
  }, [yearRange, authLoaded, token]);

  const isEmpty = formattedData.length === 0;

  // export excel
  const exportToExcel = (
    data: { namaDesa: string; namaInovasi: string; namaInovator: string; year: number }[]
  ) => {
    const wsData = [
      ["No", "Nama Desa", "Nama Inovasi", "Nama Inovator", "Tahun"],
      ...data.map((d, i) => [i + 1, d.namaDesa, d.namaInovasi, d.namaInovator, d.year]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Perkembangan Inovasi");
    XLSX.writeFile(workbook, "data-perkembangan-inovasi.xlsx");
  };

  // export PDF
  const exportToPDF = (
    data: { namaDesa: string; namaInovasi: string; namaInovator: string; year: number }[],
    profilInovator: any
  ) => {
    const doc = new jsPDF();
    const downloadDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const inovatorProfile = formattedData[0];

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
    doc.text(`: ${profilInovator.kategoriInovator || "-"}`, valueX, y);
    y += lineHeight;

    doc.text("Tahun Dibentuk", labelX, y);
    doc.text(`: ${profilInovator.tahunDibentuk || "-"}`, valueX, y);
    y += lineHeight;

    doc.text("Target Pengguna", labelX, y);
    doc.text(`: ${profilInovator.targetPengguna || "-"}`, valueX, y);
    y += lineHeight;

    doc.text("Model Bisnis", labelX, y);
    doc.text(`: ${profilInovator.modelBisnis || "-"}`, valueX, y);
    y += lineHeight;

    doc.text("Produk", labelX, y);
    doc.text(`: ${profilInovator.produk || "-"}`, valueX, y);
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
        "No",
        "Nama Desa",
        "Nama Inovasi",
        "Nama Inovator",
        "Tahun"
      ]],
      body: data.map((d, i) => [
        i + 1,
        d.namaDesa,
        d.namaInovasi,
        d.namaInovator,
        d.year
      ]),
      headStyles: {
        fillColor: [0, 128, 0],
        textColor: 255,
        fontStyle: 'bold',
      },
    });

    doc.save("data-perkembangan-inovasi.pdf");
  };

  const chartData = Object.keys(dataByYear)
    .sort((a, b) => Number(a) - Number(b))
    .map((year) => ({
      name: year,
      value: dataByYear[Number(year)],
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <Box bg="white" p={2} border="1px solid #ccc">
          <Text fontWeight="bold">{label}</Text>
          <Text>Jumlah Desa: {payload[0].value}</Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mt="24px" mx="15px">
        <Text fontSize="m" fontWeight="bold" color="gray.800">
          Pertumbuhan Desa Dampingan {profilInovator?.namaInovator || "Inovator"}
        </Text>
        <Flex gap={2}>
          <Image
            src="/icons/icon-filter.svg"
            alt="Filter"
            boxSize="16px"
            cursor="pointer"
            onClick={() => setShowFilter(true)}
          />
          <Menu>
            <MenuButton>
              <Image src="/icons/icon-download.svg" alt="Download" boxSize="16px" cursor="pointer" marginRight={2} />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => { if (profilInovator) exportToPDF(formattedData, profilInovator); }}>
                Download PDF
              </MenuItem>
              <MenuItem onClick={() => exportToExcel(formattedData)}>
                Download Excel
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      <Box
        bg="#D1EDE1"
        borderRadius="lg"
        pt="5px"
        pb="1px"
        mx="15px"
        boxShadow="lg"
        border="2px solid"
        borderColor="gray.200"
        mt={3}
        height="200px"
      >
        {loading ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner size="lg" />
          </Flex>
        ) : isEmpty ? (
          <Flex justify="center" align="center" h="100%">
            <Text fontSize="sm" textAlign="center">
              Belum ada data untuk rentang tahun ini
            </Text>
          </Flex>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={25} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
              <XAxis
                dataKey="name"
                label={{ value: "Tahun", position: "insideBottom", fontSize: 10, dy: 10 }}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                label={{ value: "Jumlah Desa", angle: -90, position: "insideLeft", fontSize: 10, dx: 5, dy: 30 }}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="value" fill="#4C73C7" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>

      <YearRangeFilter
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={(from, to) => setYearRange([from, to])}
        initialFrom={yearRange[0]}
        initialTo={yearRange[1]}
      />
    </Box>
  );
};

export default BarChartInovasi;