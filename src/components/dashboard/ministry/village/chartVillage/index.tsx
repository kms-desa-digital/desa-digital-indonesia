import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Flex,
  Image,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import filterIcon from "@public/icons/icon-filter.svg";
import downloadIcon from "@public/icons/icon-download.svg";

import { getVillages } from "Services/villageServices";
import YearRangeFilter from "./dateFilter";

import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const categories = ["Mandiri", "Maju", "Berkembang", "Tertinggal", "Sangat Tertinggal"];
const colors = ["#244E3B", "#337e5bff", "#347357", "#009670ff", "#3a5da8ff", "#5772a0ff",];

const ChartVillage = () => {
  const [barData, setBarData] = useState<any[]>([]);
  const [desaDetails, setDesaDetails] = useState<any[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const [fromYear, setFromYear] = useState(currentYear - 5);
  const [toYear, setToYear] = useState(currentYear);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const responseData = await getVillages();
        const villages = (responseData as any).villages || [];

        // Buat array [tahun]: {Maju: x, Mandiri: x, dst} untuk visualisasi data stacked bar chart
        const yearlyData: Record<number, any> = {};
        const desaData: any[] = [];

        const getYearFromObjectId = (idStr: string) => {
          if (idStr && idStr.length === 24) {
            try {
              const timestamp = parseInt(idStr.substring(0, 8), 16) * 1000;
              if (!isNaN(timestamp)) {
                return new Date(timestamp).getFullYear();
              }
            } catch (e) {}
          }
          return 2026;
        };

        villages.forEach((data: any) => {
          let yearRaw = data.tahunData?.toString()?.trim() || data.tahun?.toString()?.trim();
          if (!yearRaw || yearRaw === "-" || yearRaw.toUpperCase() === "ND") {
            if (data.createdAt) {
              yearRaw = new Date(data.createdAt).getFullYear().toString();
            } else {
              const idVal = data._id || data.id;
              if (idVal) {
                yearRaw = getYearFromObjectId(idVal.toString()).toString();
              } else {
                yearRaw = "2026";
              }
            }
          }

          let category = data.kategori || data.kategoriDesa;
          if (!category || !categories.includes(category)) {
            const idmVal = parseFloat(String(data.idm || '0').replace(',', '.'));
            if (!isNaN(idmVal) && idmVal > 0) {
              if (idmVal > 0.815) category = "Mandiri";
              else if (idmVal > 0.707) category = "Maju";
              else if (idmVal > 0.599) category = "Berkembang";
              else if (idmVal > 0.491) category = "Tertinggal";
              else category = "Sangat Tertinggal";
            }
          }

          if (!yearRaw || yearRaw === "-" || yearRaw.toUpperCase() === "ND") return;
          const yearNum = parseInt(yearRaw);
          if (isNaN(yearNum)) return;

          if (yearNum < fromYear || yearNum > toYear) return;
          if (!categories.includes(category)) return;

          if (!yearlyData[yearNum]) {
            yearlyData[yearNum] = { year: yearNum };
            categories.forEach((c) => {
              yearlyData[yearNum][c] = 0;
            });
          }

          yearlyData[yearNum][category] += 1;
          desaData.push(data);
        });

        const formatted = Object.values(yearlyData).sort((a: any, b: any) => a.year - b.year);
        setBarData(formatted);
        setDesaDetails(desaData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [fromYear, toYear]);

  const handleFilterApply = (from: number, to: number) => {
    setFromYear(from);
    setToYear(to);
    setLoading(false);
  };

  const isEmpty = barData.length === 0;

  const exportToXLSX = () => {
    const worksheet = XLSX.utils.json_to_sheet(barData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Data_${fromYear}-${toYear}`);
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `perkembangan_desa_digital_${fromYear}_${toYear}.xlsx`);
  };

  const exportToPDF = (data: any[], from: number, to: number) => {
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
    doc.text("Diambil dari: Grafik Perkembangan Desa Digital", 14, 22);
    doc.text(`Diunduh pada: ${downloadDate}`, 190, 22, { align: "right" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    let y = 42;
    const labelX = 14;

    const grouped: Record<string, any[]> = data.reduce((acc, curr) => {
      const key = curr.kategori || "Tidak Diketahui";
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {});

    for (const [kategori, entries] of Object.entries(grouped)) {
      const sortedEntries = entries.sort((a, b) => a.tahunData - b.tahunData);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Data Perkembangan Desa Digital ${from}–${to} Kategori: ${kategori}`,
        labelX,
        y
      );
      y += 6;

      const capitalizeWords = (str: string) =>
        str?.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()) ||
        "-";

      autoTable(doc, {
        startY: y,
        head: [["No", "Nama Desa", "Kecamatan", "Kabupaten", "Provinsi", "IDM", "Tahun Data"]],
        body: sortedEntries.map((item, i) => [
          i + 1,
          capitalizeWords(item.lokasi?.desaKelurahan?.label),
          capitalizeWords(item.lokasi?.kecamatan?.label),
          capitalizeWords(item.lokasi?.kabupatenKota?.label),
          capitalizeWords(item.lokasi?.provinsi?.label),
          item.idm,
          item.tahunData,
        ]),
        headStyles: {
          fillColor: [0, 128, 0],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 10 },
        margin: { top: 10 },
      } as any);

      y = (doc as any).lastAutoTable.finalY + 15;
    }

    doc.save(`perkembangan_desa_digital_${from}_${to}.pdf`);
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
      <Flex justify="space-between" align="center">
        <Text fontSize="m" fontWeight="bold" whiteSpace="pre-line">
          Pertumbuhan Desa Digital {"\n"} Tahun {fromYear} – {toYear}
        </Text>
        <Flex justify="flex-end" align="center">
          <Image src={filterIcon.src} alt="Filter" boxSize="16px" cursor="pointer" ml={2} onClick={onOpen} />
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Download"
              icon={<Image src={downloadIcon.src} alt="Download" boxSize="16px" />}
              variant="ghost"
              _hover={{ bg: 'gray.100' }}
            />
            <MenuList>
              <MenuItem onClick={() => exportToPDF(desaDetails, fromYear, toYear)}>
                Download PDF
              </MenuItem>
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
        height="250px"
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
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={barData}
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
                label={{ value: "Jumlah Desa", angle: -90, position: "insideLeft", fontSize: 10, dx: 10, dy: 30 }}
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
              {categories.map((cat, i) => (
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

export default ChartVillage;