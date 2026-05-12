import { useEffect, useState } from "react";
import {
  Text,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Image,
  Button,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  titleStyle,
  tableHeaderStyle,
  tableCellStyle,
  tableContainerStyle,
  paginationContainerStyle,
  paginationButtonStyle,
  paginationActiveButtonStyle,
  paginationEllipsisStyle,
} from "./_detailInnovatorsStyle";

import downloadIcon from "@public/icons/icon-download.svg";

import { getInnovators } from "Services/innovatorServices";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface InnovatorData {
  id: string;
  namaInovator: string;
  jumlahInovasi: number;
  jumlahDesaDampingan: number;
}

interface DetailInnovatorsProps {
  kategoriInovator: string | null;
  onSelectInovator: (namaInovator: string) => void;
}

const DetailInnovators = ({ kategoriInovator, onSelectInovator }: DetailInnovatorsProps) => {
  const [data, setData] = useState<InnovatorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const currentData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchData = async () => {
    setLoading(true);

    try {
      const filters = kategoriInovator ? { kategori: kategoriInovator } : {};
      const responseData = await getInnovators(filters);
      const innovators = (responseData as any).data || [];

      const results: InnovatorData[] = innovators.map((d: any, index: number) => ({
        id: d._id || d.id || `innovator-${index}`,
        namaInovator: d.namaInovator || "-",
        jumlahInovasi: d.jumlahInovasi || 0,
        jumlahDesaDampingan: d.jumlahDesaDampingan || 0,
      }));

      results.sort((a, b) => {
        if (b.jumlahDesaDampingan !== a.jumlahDesaDampingan) {
          return b.jumlahDesaDampingan - a.jumlahDesaDampingan; // jumlah desa descending
        }
        if (b.jumlahInovasi !== a.jumlahInovasi) {
          return b.jumlahInovasi - a.jumlahInovasi; // jumlah inovasi descending
        }
        return a.namaInovator.localeCompare(b.namaInovator); // nama inovator ascending
      });

      setData(results);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching profilInovator data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kategoriInovator]);

  const goToPage = (page: number) => setCurrentPage(page);

  const handleDownloadPDF = () => {
    if (!data.length) return;

    const doc = new jsPDF();
    const downloadDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Green header
    doc.setFillColor(0, 128, 0);
    doc.rect(0, 0, 1000, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Dokumen Laporan Kementerian", 14, 13);
    doc.text("KMS Inovasi Desa Digital", 190, 13, { align: "right" });

    doc.setFontSize(12);
    doc.text("Diambil dari: Daftar Inovator Berdasarkan Kategori", 14, 22);
    doc.text(`Diunduh pada: ${downloadDate}`, 190, 22, { align: "right" });

    // Reset text styles
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    let y = 42;
    const title = kategoriInovator
      ? `Daftar Inovator Kategori: ${kategoriInovator}`
      : "Daftar Inovator";
    doc.text(title, 14, y);
    y += 6;

    const exportData = data.map((item, index) => [
      index + 1,
      item.namaInovator,
      item.jumlahInovasi,
      item.jumlahDesaDampingan,
    ]);

    autoTable(doc, {
      startY: y,
      head: [["No", "Nama Inovator", "Jumlah Inovasi", "Jumlah Desa Dampingan"]],
      body: exportData,
      headStyles: {
        fillColor: [0, 128, 0],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 11,
      },
      columnStyles: {
        0: { cellWidth: 15 },  // No
        1: { cellWidth: 60 },  // Nama Inovator
        2: { cellWidth: 40 },  // Jumlah Inovasi
        3: { cellWidth: 60 },  // Jumlah Desa Dampingan
      },
    } as any);

    doc.save(`Daftar_Inovator_${kategoriInovator || "semua"}.pdf`);
  };

  const handleDownloadXLSX = () => {
    if (!data.length) return;

    const worksheetData = data.map((item, index) => ({
      No: index + 1,
      "Nama Inovator": item.namaInovator,
      "Jumlah Inovasi": item.jumlahInovasi,
      "Jumlah Desa Dampingan": item.jumlahDesaDampingan,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inovator");

    const filename = `Inovator_${kategoriInovator || "semua"}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(dataBlob, filename);
  };

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      const left = Math.max(currentPage - 1, 1);
      const right = Math.min(currentPage + 1, totalPages);
      const showLeftDots = left > 2;
      const showRightDots = right < totalPages - 1;

      if (!showLeftDots && showRightDots) {
        for (let i = 1; i <= 3; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (showLeftDots && !showRightDots) {
        pageNumbers.push(1, "...");
        for (let i = totalPages - 2; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1, "...");
        for (let i = left; i <= right; i++) pageNumbers.push(i);
        pageNumbers.push("...", totalPages);
      }
    }

    return pageNumbers;
  };

  return (
    <Box p={4} maxW="100%" mx="auto">
      <Flex justify="space-between" align="center" mb={2}>
        <Text {...titleStyle}>Daftar Inovator {kategoriInovator || ''}</Text>
        {kategoriInovator && (
          <Menu>
            <MenuButton as={Button} variant="ghost" size="sm" px={2} py={1}>
              <Image src={downloadIcon.src} alt="Download" boxSize="16px" />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleDownloadPDF}>Download PDF</MenuItem>
              <MenuItem onClick={handleDownloadXLSX}>Download Excel</MenuItem>
            </MenuList>
          </Menu>
        )}
      </Flex>

      {!kategoriInovator ? (
        <Text fontSize="12" color="gray.500" mt={1} fontStyle="italic">
          Pilih kategori pada diagram Kategori Inovator untuk melihat data
        </Text>
      ) : loading ? (
        <Text p={4}>Loading data...</Text>
      ) : data.length === 0 ? (
        <Text p={4}>No data found for this category.</Text>
      ) : (
        <>
          <TableContainer {...tableContainerStyle}>
            <Table variant="simple" size="sm" sx={{ tableLayout: "fixed" }}>
              <Thead>
                <Tr>
                  <Th sx={tableHeaderStyle} width="7%">No</Th>
                  <Th sx={tableHeaderStyle} width="35%">Nama Inovator</Th>
                  <Th sx={tableHeaderStyle}>Jumlah Inovasi</Th>
                  <Th sx={tableHeaderStyle}>Jumlah Desa Dampingan</Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentData.map((item, index) => (
                  <Tr
                    key={item.id}
                    onClick={() => onSelectInovator(item.namaInovator)}
                    _hover={{ backgroundColor: "gray.100", cursor: "pointer" }}
                  >
                    <Td sx={tableCellStyle}>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </Td>
                    <Td sx={tableCellStyle}>{item.namaInovator}</Td>
                    <Td sx={tableCellStyle}>{item.jumlahInovasi}</Td>
                    <Td sx={tableCellStyle}>{item.jumlahDesaDampingan}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Flex sx={paginationContainerStyle}>
              <Button
                aria-label="Previous page"
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                isDisabled={currentPage === 1}
                {...paginationButtonStyle}
              >
                <ChevronLeftIcon />
              </Button>

              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <Box key={`ellipsis-${index}`} sx={paginationEllipsisStyle}>
                    ...
                  </Box>
                ) : (
                  <Button
                    key={`page-${page}`}
                    onClick={() => goToPage(Number(page))}
                    {...paginationButtonStyle}
                    {...(page === currentPage ? paginationActiveButtonStyle : {})}
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                aria-label="Next page"
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                isDisabled={currentPage === totalPages}
                {...paginationButtonStyle}
              >
                <ChevronRightIcon />
              </Button>
            </Flex>
          )}
        </>
      )}
    </Box>
  );
};

export default DetailInnovators;