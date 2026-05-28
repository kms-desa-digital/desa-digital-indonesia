import { useEffect, useState } from 'react';
import { getInnovation } from 'Services/innovationServices';
import {
  Box, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Flex, Button, Image, Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  titleStyle, tableHeaderStyle, tableCellStyle, tableContainerStyle,
  paginationContainerStyle, paginationButtonStyle, paginationActiveButtonStyle,
  paginationEllipsisStyle
} from './_detailInnovationsStyle';
import downloadIcon from '@public/icons/icon-download.svg';

import { jsPDF } from 'jspdf';
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Props {
  selectedCategory: string | null;
  onInnovationSelect?: (namaInovasi: string) => void;
}

interface Innovation {
  namaInovasi: string;
  namaInnovator: string;
  kategori: string;
  jumlahKlaim: number;
}

interface Innovator {
  namaInovator: string;
  jumlahDesaDampingan: number;
}

interface JoinedData {
  namaInovasi: string;
  namaInovator: string;
  jumlahKlaim: number;
  kategori: string;
}

const DetailInnovations = ({ selectedCategory, onInnovationSelect }: Props) => {
  const [data, setData] = useState<JoinedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCategory) {
        setData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const responseData = await getInnovation();
        const inovasiList: Innovation[] = responseData.innovations || [];

        const normalize = (str?: string) => (str || '').replace(/\s+/g, '').toLowerCase();
        const normalizedSelected = normalize(selectedCategory);

        const matchingInovasi = inovasiList.filter(i =>
          normalize(i.kategori) === normalizedSelected
        );

        const joinedData: JoinedData[] = matchingInovasi.map(i => ({
          namaInovasi: i.namaInovasi,
          namaInovator: i.namaInnovator,
          jumlahKlaim: i.jumlahKlaim ?? 0, // jika data kosong, set 0
          kategori: i.kategori,
        }));

        // Sorting berdasarkan jumlahDesaDampingan, lalu namaInovasi
        joinedData.sort((a, b) => {
          if (b.jumlahKlaim !== a.jumlahKlaim) {
            return b.jumlahKlaim - a.jumlahKlaim; // jumlah desa descending
          }
          return a.namaInovasi.localeCompare(b.namaInovasi); // nama inovasi ascending
        });

        setData(joinedData);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error fetching innovations:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const goToPage = (page: number) => setCurrentPage(page);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const left = Math.max(currentPage - 1, 1);
    const right = Math.min(currentPage + 1, totalPages);
    const showLeftDots = left > 2;
    const showRightDots = right < totalPages - 1;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else if (!showLeftDots && showRightDots) {
      pageNumbers.push(1, 2, 3, '...', totalPages);
    } else if (showLeftDots && !showRightDots) {
      pageNumbers.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
    } else {
      pageNumbers.push(1, '...', left, currentPage, right, '...', totalPages);
    }

    return pageNumbers;
  };

  const exportPDF = () => {
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
    doc.text("Diambil dari: Daftar Inovasi Berdasarkan Kategori", 14, 22);
    doc.text(`Diunduh pada: ${downloadDate}`, 190, 22, { align: "right" });

    // Reset text styles
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    let y = 42;
    doc.text(`Daftar Inovasi Berdasarkan Kategori: ${selectedCategory}`, 14, y);
    y += 6;

    const exportData = data.map((item, index) => [
      index + 1,
      item.namaInovasi,
      item.namaInovator,
      item.jumlahKlaim,
    ]);

    autoTable(doc, {
      startY: y,
      head: [["No", "Nama Inovasi", "Nama Inovator", "Jumlah Desa Dampingan"]],
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
        1: { cellWidth: 55 },  // Nama Inovasi
        2: { cellWidth: 55 },  // Nama Inovator
        3: { cellWidth: 50 },  // Jumlah Desa
      },
    } as any);

    doc.save(`Daftar_Inovasi_${selectedCategory || 'all'}.pdf`);
  };

  const exportXLSX = () => {
    if (!data.length) return;
    const headers = ['No', 'Nama Inovasi', 'Nama Inovator', 'Jumlah Desa Dampingan'];
    const exportData = data.map((item, index) => [
      index + 1,
      item.namaInovasi,
      item.namaInovator,
      item.jumlahKlaim,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...exportData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inovasi');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    saveAs(blob, `Daftar_Inovasi_${selectedCategory || 'all'}.xlsx`);
  };

  return (
    <Box p={4}>
      <Flex justify="space-between" mb={2}>
        <Box>
          <Text {...titleStyle}>Daftar Inovasi {selectedCategory || ''}</Text>
          {!selectedCategory && (
            <Text fontSize="12" color="gray.500" mt={1} fontStyle="italic">
              Pilih kategori pada diagram Kategori Inovasi untuk melihat data
            </Text>
          )}
        </Box>
        {selectedCategory && (
          <Menu>
            <MenuButton>
              <Image
                src={downloadIcon}
                alt="Download"
                boxSize="16px"
                cursor="pointer"
                mr={2}
              />
            </MenuButton>
            <MenuList fontSize="sm">
              <MenuItem onClick={exportPDF}>Download PDF</MenuItem>
              <MenuItem onClick={exportXLSX}>Download Excel</MenuItem>
            </MenuList>
          </Menu>
        )}
      </Flex>

      {selectedCategory && (
        <>
          {loading ? (
            <Text p={2}>Loading data...</Text>
          ) : (
            <>
              <TableContainer {...tableContainerStyle}>
                <Table variant="simple" size="sm" sx={{ tableLayout: 'fixed' }}>
                  <Thead>
                    <Tr>
                      <Th sx={tableHeaderStyle} width="10%">No</Th>
                      <Th sx={tableHeaderStyle}>Nama Inovasi</Th>
                      <Th sx={tableHeaderStyle}>Nama Inovator</Th>
                      <Th sx={tableHeaderStyle}>Jumlah Desa</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {currentData.length === 0 ? (
                      <Tr>
                        <Td colSpan={4} textAlign="center" sx={tableCellStyle}>
                          Tidak ada data inovasi untuk kategori ini.
                        </Td>
                      </Tr>
                    ) : (
                      currentData.map((item, i) => (
                        <Tr
                          key={i}
                          cursor="pointer"
                          _hover={{ bg: "gray.100" }}
                          onClick={() => onInnovationSelect && onInnovationSelect(item.namaInovasi)}
                        >
                          <Td sx={tableCellStyle}>{(currentPage - 1) * itemsPerPage + i + 1}</Td>
                          <Td sx={tableCellStyle}>{item.namaInovasi}</Td>
                          <Td sx={tableCellStyle}>{item.namaInovator}</Td>
                          <Td sx={tableCellStyle}>{item.jumlahKlaim}</Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Flex sx={paginationContainerStyle}>
                  <Button onClick={() => goToPage(currentPage - 1)} isDisabled={currentPage === 1} {...paginationButtonStyle}>
                    <ChevronLeftIcon />
                  </Button>

                  {getPageNumbers().map((page, i) =>
                    page === '...' ? (
                      <Box key={`ellipsis-${i}`} {...paginationEllipsisStyle}>...</Box>
                    ) : (
                      <Button
                        key={`page-${page}`}
                        onClick={() => goToPage(Number(page))}
                        {...paginationButtonStyle}
                        {...(currentPage === page ? paginationActiveButtonStyle : {})}
                      >
                        {page}
                      </Button>
                    )
                  )}

                  <Button onClick={() =>
                    goToPage(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                    {...paginationButtonStyle}
                  >
                    <ChevronRightIcon />
                  </Button>
                </Flex>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default DetailInnovations;