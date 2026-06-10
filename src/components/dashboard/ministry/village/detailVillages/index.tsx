import { useEffect, useState } from 'react';
import { getVillages } from 'Services/villageServices';
import {
  Box, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Flex, Button, Image, IconButton, Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Pagination from '@/components/common/Pagination';

import {
  titleStyle,
  tableHeaderStyle,
  tableCellStyle,
  tableContainerStyle
} from './_detailVillagesStyle';

import downloadIcon from '@public/icons/icon-download.svg';

interface Props {
  selectedCategory: string | null;
  onRowClick: (villageName: string) => void;
}

interface Implementation {
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  potensi: string;
  idm: string;
}

const DetailVillages = ({ selectedCategory, onRowClick }: Props) => {
  const [data, setData] = useState<Implementation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCategory) return;

      setLoading(true);
      try {
        const responseData = await getVillages();
        const villages = (responseData as any).villages || [];

        const capitalizeWords = (str: string) =>
          str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());

        const resolveKesiapanDigital = (item: any) => {
          let kategori = item.kesiapanDigital || item.kategori || item.kategoriDesa;
          if (kategori && kategori !== 'ND' && kategori !== '-' && kategori.trim() !== '') {
            return kategori;
          }
          let score = 0;
          const jar = String(item.jaringan || '').toLowerCase();
          if (jar.includes('seluruh') || jar.includes('baik')) score += 3;
          else if (jar.includes('sebagian') || jar.includes('cukup')) score += 2;
          else if (jar.includes('tidak') || jar.includes('belum')) score += 1;

          const lis = String(item.listrik || '').toLowerCase();
          if (lis.includes('seluruh') || lis.includes('tersedia')) score += 3;
          else if (lis.includes('sebagian')) score += 2;
          else if (lis.includes('belum') || lis.includes('tidak')) score += 1;

          const tek = String(item.teknologi || '').toLowerCase();
          if (tek.includes('seluruh') || tek.includes('baik') || tek.includes('berkembang')) score += 3;
          else if (tek.includes('sebagian')) score += 2;
          else if (tek.includes('belum') || tek.includes('tidak')) score += 1;

          const kem = String(item.kemampuan || '').toLowerCase();
          if (kem.includes('sangat') || kem.includes('baik')) score += 3;
          else if (kem.includes('cukup')) score += 2;
          else if (kem.includes('belum') || kem.includes('tidak')) score += 1;

          if (score >= 10) return "Sangat Siap";
          if (score >= 8) return "Siap";
          if (score >= 6) return "Cukup Siap";
          if (score >= 4) return "Kurang Siap";
          return "Belum Siap";
        };

        const list: Implementation[] = villages
          .filter((d: any) => {
            let kategori = resolveKesiapanDigital(d);
            if (!kategori || kategori === 'ND' || kategori === '-') {
              const idmVal = parseFloat(String(d.idm || '0').replace(',', '.'));
              if (!isNaN(idmVal) && idmVal > 0) {
                if (idmVal > 0.815) kategori = "Mandiri";
                else if (idmVal > 0.707) kategori = "Maju";
                else if (idmVal > 0.599) kategori = "Berkembang";
                else if (idmVal > 0.491) kategori = "Tertinggal";
                else kategori = "Sangat Tertinggal";
              }
            }
            return kategori === selectedCategory;
          })
          .map((d: any) => {
            const lokasi = d.lokasi ?? {};

            return {
              desa: capitalizeWords(lokasi.desaKelurahan?.label ?? "-"),
              provinsi: capitalizeWords(lokasi.provinsi?.label ?? "-"),
              kabupaten: capitalizeWords(lokasi.kabupatenKota?.label ?? "-"),
              kecamatan: capitalizeWords(lokasi.kecamatan?.label ?? "-"),
              potensi: d.potensi ?? "-",
              idm: String(d.idm) ?? "-",
            };
          })
          .filter((d: Implementation) => d.desa && d.provinsi && d.idm && d.idm !== 'ND' && d.idm !== '-' && d.idm !== '');

        setData(list);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching village data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const sortedData = [...data].sort((a, b) =>
    parseFloat(b.idm.replace(',', '.')) - parseFloat(a.idm.replace(',', '.'))
  );
  const currentData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // PDF Download
  const downloadPDF = () => {
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
    doc.text("Diambil dari: Daftar Desa Menurut Kategori", 14, 22);
    doc.text(`Diunduh pada: ${downloadDate}`, 190, 22, { align: "right" });

    // Reset text styles
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    let y = 42;
    doc.text(`Daftar Desa Berdasarkan Kategori: ${selectedCategory}`, 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["No", "Nama Desa", "Kecamatan", "Kabupaten", "Provinsi", "Potensi Desa", "IDM"]],
      body: sortedData.map((item, i) => [
        i + 1,
        item.desa,
        item.kecamatan,
        item.kabupaten,
        item.provinsi,
        item.potensi,
        item.idm,
      ]),
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
        1: { cellWidth: 25 },  // Nama Desa
        2: { cellWidth: 25 },  // Kecamatan
        3: { cellWidth: 25 },  // Kabupaten
        4: { cellWidth: 25 },  // Provinsi
        5: { cellWidth: 40 },  // Potensi
        6: { cellWidth: 25 },  // IDM
      },
    } as any);

    doc.save(`Daftar_Desa_${selectedCategory}.pdf`);
  };

  // XLSX Download
  const downloadXLSX = () => {
    const wsData = [
      ['No', 'Nama Desa', 'Provinsi', 'IDM'],
      ...sortedData.map((item, i) => [i + 1, item.desa, item.provinsi, item.idm])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Desa');

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `Daftar_Desa_${selectedCategory}.xlsx`);
  };

  return (
    <Box p={4}>
      <Flex justify="space-between" mb={2}>
        <Box>
          <Text {...titleStyle}>
            Daftar Desa {selectedCategory ? `${selectedCategory}` : ''}
          </Text>
          {!selectedCategory && (
            <Text fontSize="12" color="gray.500" mt={1} fontStyle="italic">
              Pilih kategori pada diagram Kategori Desa untuk melihat data
            </Text>
          )}
        </Box>
        {selectedCategory && (
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Download menu"
              icon={<Image src={downloadIcon.src} alt="Download" boxSize="16px" />}
              variant="ghost"
              _hover={{ bg: 'gray.100' }}
            />
            <MenuList>
              <MenuItem onClick={downloadPDF}>Download PDF</MenuItem>
              <MenuItem onClick={downloadXLSX}>Download XLSX</MenuItem>
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
                      <Th sx={tableHeaderStyle}>Nama Desa</Th>
                      <Th sx={tableHeaderStyle}>Provinsi</Th>
                      <Th sx={tableHeaderStyle}>IDM</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {currentData.map((item, i) => (
                      <Tr
                        key={i}
                        onClick={() => onRowClick(item.desa)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Td sx={tableCellStyle}>{(currentPage - 1) * itemsPerPage + i + 1}</Td>
                        <Td sx={tableCellStyle}>{item.desa}</Td>
                        <Td sx={tableCellStyle}>{item.provinsi}</Td>
                        <Td sx={tableCellStyle}>{item.idm}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default DetailVillages;