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
import { getAuth } from "firebase/auth";
import YearRangeFilter from "./dateFilter";
import filterIcon from "@public/icons/icon-filter.svg";
import downloadIcon from "@public/icons/icon-download.svg";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const BarChartInovasi = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [yearRange, setYearRange] = useState<[number, number]>([2015, 2025]);
  const [dataByYear, setDataByYear] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [detailedData, setDetailedData] = useState<
    { namaDesa: string; namaInovasi: string; namaInovator: string; year: number }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setDataByYear({});
          setLoading(false);
          return;
        }

        const token = await currentUser.getIdToken();
        const response = await fetch('/api/ministry/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        // Karena endpoint API tidak mereturn data berdasarkan tahun, kita kembalikan kosong.
        setDataByYear({});
        setDetailedData([]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [yearRange]);

  const isEmpty = detailedData.length === 0;

  // Konversi ke format Recharts
  const chartData = Object.keys(dataByYear)
    .map((year) => ({
      name: year,
      value: dataByYear[Number(year)],
    }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  const exportToExcel = (data: any[]) => {
    const wsData = [
      ["Nama Desa", "Nama Inovasi", "Nama Inovator", "Tahun"],
      ...data.map((item) => [item.namaDesa, item.namaInovasi, item.namaInovator, item.year]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Perkembangan Desa Digital");
    XLSX.writeFile(workbook, "data-perkembangan-desa-digital.xlsx");
  };

  const exportToPDF = (data: any[]) => {
    const doc = new jsPDF;
    const downloadDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Green header background
    doc.setFillColor(0, 128, 0);
    doc.rect(0, 0, 1000, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    doc.setFontSize(15);
    doc.text("Dokumen Laporan Kementerian", 14, 13);
    doc.text("KMS Inovasi Desa Digital", 190, 13, { align: "right" });

    doc.setFontSize(12);
    doc.text("Diambil dari: Grafik Perkembangan Desa Digital", 14, 22);
    doc.text(`Diunduh pada: ${downloadDate}`, 190, 22, { align: "right" });

    // Reset text styles for table content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");

    // Add section title
    let y = 42;
    const labelX = 14;
    doc.setFont("helvetica", "bold");
    doc.text(`Data Perkembangan Desa Digital`, labelX, y);
    y += 6;

    // Sort data by year
    const sortedData = [...data].sort((a, b) => a.year - b.year);

    autoTable(doc, {
      startY: y,
      head: [[
        "No",
        "Nama Desa",
        "Nama Inovasi",
        "Nama Inovator",
        "Tahun Pendataan",
      ]],
      body: sortedData.map((item, index) => [
        index + 1,
        item.namaDesa,
        item.namaInovasi,
        item.namaInovator,
        item.year,
      ]),
      headStyles: {
        fillColor: [0, 128, 0],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
      },
      styles: {
        fontSize: 12,
      },
    } as any);

    doc.save("data-perkembangan-desa-digital.pdf");
  };

  return (
    <Box p={4} maxW="100%" mx="auto">
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontSize="m" fontWeight="bold" color="gray.800">
          Pertumbuhan Desa Digital
        </Text>
        <Flex align="center" gap={2}>
          <Image
            onClick={() => setShowFilter(true)}
            src={filterIcon}
            alt="Filter"
            boxSize="16px"
            cursor="pointer"
          />
          <Menu>
            <MenuButton as={Box} cursor="pointer" marginRight={2}>
              <Image src={downloadIcon} alt="Download" boxSize="16px" />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => exportToPDF(detailedData)}>Download PDF</MenuItem>
              <MenuItem onClick={() => exportToExcel(detailedData)}>Download Excel</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      <Box bg="#D1EDE1" borderRadius="xl" p={2} boxShadow="md">
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
            <BarChart data={chartData} margin={{ top: 20, right: 40, left: 1, bottom: 15 }}>
              <XAxis
                dataKey="name"
                label={{ value: "Tahun", position: "insideBottom", dy: 10, fontSize: 10 }}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                label={{
                  value: "Jumlah Desa", angle: -90,
                  position: "insideLeft", fontSize: 10, dx: 5, dy: 30,
                }}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                formatter={(value: any) => [`${value} desa`, "Jumlah"]}
              />
              <Bar dataKey="value" fill="#4C73C7" barSize={25} />
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