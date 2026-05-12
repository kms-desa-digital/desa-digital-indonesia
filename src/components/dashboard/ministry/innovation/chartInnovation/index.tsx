import React, { useEffect, useState } from "react";
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
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { getInnovation } from "Services/innovationServices";
import YearRangeFilter from "./dateFilter";
import filterIcon from "@public/icons/icon-filter.svg";
import downloadIcon from "@public/icons/icon-download.svg";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type BarValue = {
  id: number;
  value: number;
  color: string;
};

type ChartGroup = {
  category: string;
  values: BarValue[];
};

const getYAxisLabels = (max: number, step: number): number[] => {
  const roundedMax = Math.ceil(max / step) * step;
  const labels: number[] = [];
  for (let i = roundedMax; i >= 0; i -= step) {
    labels.push(i);
  }
  return labels;
};

const truncateLabel = (label: string, maxLength = 5): string => {
  return label.length > maxLength ? label.slice(0, maxLength) + "..." : label;
};

const innovationCategories = [
  "Pertanian Cerdas",
  "Sistem Informasi",
  "Pemasaran Agri-Food dan E-Commerce",
  "E-Government",
  "E-Tourism",
  "Layanan Keuangan",
  "Layanan Sosial",
  "Pengembangan Masyarakat dan Ekonomi",
  "UMKM",
  "Pengelolaan Sumber Daya",
];

const colors = [
  "#244E3B",
  "#347357",
  "#009670ff",
  "#3a5da8ff",
  "#5772a0ff",
  "#73922aff",
  "#bd7517ff",
  "#F26419",
  "#B33F62",
  "#690d5dff",
];

// --- import statements tetap sama seperti sebelumnya ---

const ChartInnovation = () => {
  const currentYear = new Date().getFullYear();
  const [fromYear, setFromYear] = useState(currentYear - 5);
  const [toYear, setToYear] = useState(currentYear);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inovasiDetails, setInovasiDetails] = useState<any[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const responseData = await getInnovation();
        const innovationsData = responseData.innovations || [];
        const dataPerYear: Record<number, Record<string, number>> = {};
        const allData: any[] = [];

        innovationsData.forEach((data: any) => {
          const year = data.tahunDibuat;
          const kategori = data.kategori;

          if (!year || !kategori) return;
          if (year < fromYear || year > toYear) return;

          if (!dataPerYear[year]) {
            dataPerYear[year] = {};
            innovationCategories.forEach((cat) => {
              dataPerYear[year][cat] = 0;
            });
          }
          if (innovationCategories.includes(kategori)) {
            dataPerYear[year][kategori] += 1;
          }

          allData.push(data);
        });

        const formatted = Object.entries(dataPerYear)
          .map(([year, counts]) => ({ year: +year, ...counts }))
          .sort((a, b) => a.year - b.year);

        setChartData(formatted);
        setInovasiDetails(allData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fromYear, toYear]);

  const isEmpty = chartData.length === 0;

  const handleFilterApply = (from: number, to: number) => {
    setFromYear(from);
    setToYear(to);
  };

  // --- Export to PDF per range tahun ---
  const exportToPDF = () => {
    const doc = new jsPDF();
    const downloadDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc.setFillColor(0, 128, 0);
    doc.rect(0, 0, 1000, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Dokumen Laporan Kementerian", 14, 13);
    doc.text("KMS Inovasi Desa Digital", 190, 13, { align: "right" });

    doc.setFontSize(12);
    doc.text("Diambil dari: Grafik Jumlah Inovasi per Kategori", 14, 22);
    doc.text(`Diunduh pada: ${downloadDate}`, 190, 22, { align: "right" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    let y = 42;
    const labelX = 14;

    // Loop per tahun
    for (const yearData of chartData) {
      doc.text(`Data Inovasi Tahun ${yearData.year}`, labelX, y);
      y += 6;

      const body: any[] = [];
      innovationCategories.forEach((cat) => {
        const filtered = inovasiDetails.filter(
          (item) => item.kategori === cat && Number(item.tahunDibuat) === Number(yearData.year)
        );
        filtered.forEach((item: any, idx: number) => {
          body.push([
            idx + 1,
            item.namaInovasi || "-",
            item.namaInnovator || "-",
            item.tahunDibuat || "-",
          ]);
        });
      });

      if (body.length === 0) {
        body.push(["-", "-", "-", "-"]);
      }

      autoTable(doc, {
        startY: y,
        head: [["No", "Nama Inovasi", "Nama Inovator", "Tahun Dibuat"]],
        body: body,
        headStyles: { fillColor: [0, 128, 0], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 70 }, 2: { cellWidth: 60 }, 3: { cellWidth: 30 } },
        margin: { top: 10 },
      } as any);

      y = (doc as any).lastAutoTable.finalY + 15;
    }

    doc.save(`inovasi_per_kategori_${fromYear}-${toYear}.pdf`);
  };

  // --- Export to Excel per range tahun ---
  const exportToXLSX = () => {
    const worksheetData: any[] = [];
    chartData.forEach((yearData) => {
      const row: any = { Tahun: yearData.year };
      innovationCategories.forEach((cat) => {
        row[cat] = yearData[cat] || 0;
      });
      worksheetData.push(row);
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inovasi");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `inovasi_desa_${fromYear}-${toYear}.xlsx`);
  };

  // Custom tooltip, hanya ambil kategori yang sedang di-hover
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && activeKey) {
      const item = payload.find((p: any) => p.dataKey === activeKey);
      if (!item) return null;

      return (
        <Box
          p={2}
          bg="white"
          borderRadius="md"
          boxShadow="md"
          fontSize="11px"
          border="1px solid #E2E8F0"
        >
          <Text fontWeight="semibold" color="gray.700">
            Tahun {label}
          </Text>
          <Flex align="center" mt={1}>
            <Box
              w="10px"
              h="10px"
              borderRadius="full"
              bg={item.color}
              mr={2}
            />
            <Text color="gray.600">
              {item.name}: <b>{item.value}</b>
            </Text>
          </Flex>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontSize="m" fontWeight="bold" whiteSpace="pre-line">
          Pertumbuhan Inovasi Tahun {"\n"} {fromYear} – {toYear}
        </Text>
        <Flex justify="flex-end" align="center">
          <Image
            src={filterIcon}
            alt="Filter"
            boxSize="16px"
            cursor="pointer"
            ml={2}
            onClick={onOpen}
          />
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Download"
              icon={<Image src={downloadIcon} alt="Download" boxSize="16px" />}
              variant="ghost"
              _hover={{ bg: 'gray.100' }}
            />
            <MenuList>
              <MenuItem onClick={exportToPDF}>Download PDF</MenuItem>
              <MenuItem onClick={exportToXLSX}>Download Excel</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      <Box
        bg="#D1EDE1"
        borderRadius="lg"
        pt="5px"
        pb="1px"
        boxShadow="lg"
        border="2px solid"
        borderColor="gray.200"
        mt={3}
        height="350px"
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
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 40, left: 1, bottom: 15 }}
              barSize={25}
            >
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="year"
                label={{ value: "Tahun", position: "insideBottom", fontSize: 10, dy: 5 }}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                label={{
                  value: "Jumlah Inovasi",
                  angle: -90, position: "insideLeft", fontSize: 10, dx: 10, dy: 30
                }}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "transparent" }}
              />
              <Legend
                verticalAlign="top"
                align="center"
                iconType="circle"
                iconSize={10}
                wrapperStyle={{
                  fontSize: 12,
                  color: "#000",
                  paddingBottom: "20px",
                  marginTop: "-10px",
                  marginLeft: "20px",
                }}
              />
              {innovationCategories.map((cat, i) => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  stackId="a"
                  fill={colors[i]}
                  radius={[4, 4, 0, 0]}
                  onMouseOver={() => setActiveKey(cat)}
                  onMouseOut={() => setActiveKey(null)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>

      <YearRangeFilter
        isOpen={isOpen}
        onClose={onClose}
        onApply={handleFilterApply}
        initialFrom={fromYear}
        initialTo={toYear}
      />
    </Box>
  );
};

export default ChartInnovation;