import {
  Box,
  Text,
  Flex,
  Image,
  Spinner,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Select,
} from "@chakra-ui/react";

import { useEffect, useState, useRef } from "react";
import { getInnovators } from "Services/innovatorServices";

import {
  chartContainerStyle,
  chartWrapperStyle,
  barGroupStyle,
  barStyle,
  labelStyle,
  xAxisStyle,
  yAxisStyle,
  legendContainerStyle,
  legendItemStyle,
  legendDotStyle,
  titleStyle,
  yAxisLabelStyle,
  yAxisWrapperStyle,
  chartBarContainerStyle,
  barAndLineWrapperStyle,
} from "./_chartInnovatorStyle";

import CategoryFilter from "./categoryFilter";
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

const truncateLabel = (label: string, maxLength = 3): string =>
  label.length > maxLength ? label.slice(0, maxLength) + "..." : label;

const ChartInnovator = () => {
  const [chartData, setChartData] = useState<ChartGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxValue, setMaxValue] = useState(10);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [kategoriList, setKategoriList] = useState<string[]>(["Semua"]);
  const [selectedKategori, setSelectedKategori] = useState<string[]>([]);
  const [allInnovatorsCache, setAllInnovatorsCache] = useState<any[]>([]);

  const chartBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const responseData = await getInnovators();
        const innovators = (responseData as any).data || [];
        setAllInnovatorsCache(innovators);

        const categoryMap: Record<string, { count: number }> = {};
        const allKategori: Set<string> = new Set();

        innovators.forEach((data: any) => {
          if (!data.kategori) return;

          const kategori = data.kategori;
          allKategori.add(kategori);

          if (!categoryMap[kategori]) {
            categoryMap[kategori] = { count: 0 };
          }
          categoryMap[kategori].count += 1;
        });

        const filteredCategoryMap =
          selectedKategori.length === 0 || selectedKategori.includes("Semua")
            ? categoryMap
            : Object.fromEntries(
              Object.entries(categoryMap).filter(([kategori]) =>
                selectedKategori.includes(kategori)
              )
            );

        const formattedData: ChartGroup[] = Object.entries(filteredCategoryMap)
          .map(([category, { count }]) => ({
            category,
            values: [{ id: 1, value: count, color: "#568A73" }],
          }))
          .sort((a, b) => b.values[0].value - a.values[0].value);

        const maxCount = Math.max(...formattedData.map((g) => g.values[0].value), 10);

        setChartData(formattedData);
        setMaxValue(maxCount);
        setKategoriList(["Semua", ...Array.from(allKategori)]);
      } catch (error) {
        console.error("Error fetching innovator chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedKategori]);

  const isEmpty = chartData.length === 0 || chartData.every((group) => group.values[0].value === 0);

  const exportToPDF = async (selectedYear: number) => {
    let allData = allInnovatorsCache;
    if (allData.length === 0) {
      try {
        const responseData = await getInnovators();
        allData = (responseData as any).data || [];
      } catch (error) {
        console.error("Error fetching data for PDF export:", error);
        return;
      }
    }

    const doc = new jsPDF({ orientation: "landscape" });
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
    doc.text("KMS Inovasi Desa Digital", 280, 13, { align: "right" });

    doc.setFontSize(12);
    doc.text("Diambil dari: Grafik Jumlah Inovator per Kategori", 14, 22);
    doc.text(`Diunduh pada: ${downloadDate}`, 280, 22, { align: "right" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    let y = 42;
    const labelX = 14;

    const grouped = allData.reduce((acc: Record<string, any[]>, item: any) => {
      const kategori = item.kategori || "Tidak Diketahui";
      if (!acc[kategori]) acc[kategori] = [];
      acc[kategori].push(item);
      return acc;
    }, {});

    for (const [kategori, entries] of Object.entries(grouped)) {
      doc.text(`Data Inovator Kategori: ${kategori}`, labelX, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [
          [
            "No",
            "Nama Inovator",
            "Kategori Inovator",
            "Jumlah Inovasi",
            "Jumlah Desa Dampingan",
            "Target Pengguna",
            "Model Bisnis",
          ],
        ],
        body: (entries as any[]).map((item: any, i: number) => [
          i + 1,
          item.namaInovator || "-",
          item.kategori || "-",
          item.jumlahInovasi ?? 0,
          item.jumlahDesaDampingan ?? 0,
          item.targetPengguna || "-",
          item.modelBisnis || "-",
        ]),
        headStyles: {
          fillColor: [0, 128, 0],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 45 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 },
          5: { cellWidth: 50 },
          6: { cellWidth: 80 },
        },
        margin: { top: 10 },
      } as any);

      y = (doc as any).lastAutoTable.finalY + 15;
    }

    doc.save(`inovator_per_kategori.pdf`);
  };

  const exportToExcel = async (selectedYear: number) => {
    let allData = allInnovatorsCache;
    if (allData.length === 0) {
      try {
        const responseData = await getInnovators();
        allData = (responseData as any).data || [];
      } catch (error) {
        console.error("Error fetching data for Excel export:", error);
        return;
      }
    }

    const grouped = allData.reduce((acc: Record<string, any[]>, item: any) => {
      const kategori = item.kategori || "Tidak Diketahui";
      if (!acc[kategori]) acc[kategori] = [];
      acc[kategori].push(item);
      return acc;
    }, {});

    const worksheetData: any[] = [];

    for (const [kategori, entries] of Object.entries(grouped)) {
      worksheetData.push({ Kategori: `Data Inovator Kategori: ${kategori}` });
      worksheetData.push({
        No: "No",
        NamaInovator: "Nama Inovator",
        KategoriInovator: "Kategori Inovator",
        JumlahInovasi: "Jumlah Inovasi",
        JumlahDesaDampingan: "Jumlah Desa Dampingan",
        TargetPengguna: "Target Pengguna",
        ModelBisnis: "Model Bisnis",
      });

      (entries as any[]).forEach((item: any, i: number) => {
        worksheetData.push({
          No: i + 1,
          NamaInovator: item.namaInovator || "-",
          KategoriInovator: item.kategori || "-",
          JumlahInovasi: item.jumlahInovasi ?? 0,
          JumlahDesaDampingan: item.jumlahDesaDampingan ?? 0,
          TargetPengguna: item.targetPengguna || "-",
          ModelBisnis: item.modelBisnis || "-",
        });
      });

      worksheetData.push({});
    }

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, { skipHeader: true });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inovator");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, `daftar_inovator_per_kategori.xlsx`);
  };

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={2}>
        <Text {...titleStyle}>Jumlah Inovator per Kategori</Text>
        <Flex justify="flex-end" align="center">
          <Image
            src={filterIcon}
            alt="Filter"
            boxSize="16px"
            cursor="pointer"
            ml={2}
            onClick={() => setIsFilterOpen(true)}
          />
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Download Options"
              icon={<Image src={downloadIcon} alt="Download" boxSize="16px" />}
              variant="ghost"
              ml={2}
            />
            <MenuList fontSize="sm">
              <MenuItem onClick={() => exportToPDF(selectedYear)}>Download PDF</MenuItem>
              <MenuItem onClick={() => exportToExcel(selectedYear)}>Download Excel</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="lg" />
        </Flex>
      ) : (
        <Box {...chartContainerStyle}>
          <Flex {...legendContainerStyle} mb={2}>
            <Flex {...legendItemStyle}>
              <Box {...legendDotStyle} bg="#568A73" />
              <Text>Jumlah Inovator</Text>
            </Flex>
          </Flex>

          {isEmpty ? (
            <Text textAlign="center" mt={10} fontWeight="medium" fontSize="15">
              Belum ada data.
            </Text>
          ) : (
            <Box {...chartWrapperStyle}>
              <Flex {...yAxisWrapperStyle}>
                {Array.from({ length: Math.ceil(maxValue / 5) + 1 }, (_, i) => maxValue - i * 5).map(
                  (label, idx) => (
                    <Text key={idx} {...yAxisLabelStyle}>
                      {label >= 0 ? label : 0}
                    </Text>
                  )
                )}
              </Flex>

              <Flex {...chartBarContainerStyle} ref={chartBarRef} position="relative">
                <Box {...yAxisStyle} />
                <Flex {...barAndLineWrapperStyle}>
                  {chartData.map((group, i) => {
                    const barValue = group.values.find((v) => v.id === 1);
                    return (
                      <Box key={i} {...barGroupStyle} position="relative">
                        {barValue && (
                          <Tooltip
                            label={`${group.category}: ${barValue.value} inovator`}
                            placement="top"
                            openDelay={300}
                            hasArrow
                          >
                            <Box
                              {...barStyle}
                              height={`${(barValue.value / maxValue) * 100}%`}
                              bg={barValue.color}
                              cursor="pointer"
                            />
                          </Tooltip>
                        )}
                        <Text {...labelStyle}>{truncateLabel(group.category)}</Text>
                      </Box>
                    );
                  })}
                  <Box {...xAxisStyle} />
                </Flex>
              </Flex>
            </Box>
          )}
        </Box>
      )}

      <CategoryFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(kategoriArray) => setSelectedKategori(kategoriArray)}
        kategoriList={kategoriList}
        defaultKategori={selectedKategori}
      />
    </Box>
  );
};

export default ChartInnovator;