import { useState, useEffect } from "react";
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
  Button,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import {
  titleStyle,
  tableHeaderStyle,
  tableCellStyle,
  tableContainerStyle
} from "./_detailInnovationsInnovatorStyle";
import downloadIcon from "@public/icons/icon-download.svg";

import { getInnovation } from "Services/innovationServices";
import { getAuth } from "firebase/auth";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Pagination from "@/components/common/Pagination";

// Data type
interface Implementation {
  namaInovasi: string;
  inovator: string;
  namaDesa: string;
  tahun: number;
}

interface DetailInnovationsProps {
  filterInnovator: string;
  onSelectVillage: (namaInovasi: string) => void;
}

const DetailInnovations = ({ filterInnovator, onSelectVillage }: DetailInnovationsProps) => {
  const [implementationData, setImplementationData] = useState<Implementation[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredData = implementationData;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  useEffect(() => {
    const fetchData = async () => {
      if (!filterInnovator) return;
      setLoading(true);

      try {
        // Fetch innovations by innovator name
        const innovationRes = await getInnovation();
        const allInnovations = innovationRes.innovations || [];
        const innovations = allInnovations.filter(
          (i: any) => i.namaInnovator === filterInnovator || i.namaInovator === filterInnovator
        );

        // Fetch claims
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const headers: Record<string, string> = {};
        if (currentUser) {
          const token = await currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        }

        const claimRes = await fetch("/api/villages/claim", { headers });
        const claimDataRaw = await claimRes.json();
        const allClaims = claimDataRaw.claims || [];

        const allData: Implementation[] = [];

        for (const innovation of innovations) {
          const matchingClaims = allClaims.filter(
            (c: any) => c.namaInovasi === innovation.namaInovasi
          );

          matchingClaims.forEach((claim: any) => {
            const desa = (claim.namaDesa || "").replace(/^Desa\s*/i, "");
            const tahun = claim.createdAt ? new Date(claim.createdAt).getFullYear() : 0;

            allData.push({
              namaInovasi: innovation.namaInovasi,
              inovator: filterInnovator,
              namaDesa: desa,
              tahun,
            });
          });
        }

        allData.sort((a, b) => {
          if (b.tahun !== a.tahun) return b.tahun - a.tahun; // tahun klaim desc

          const namaInovasiCompare = a.namaInovasi.localeCompare(b.namaInovasi); // nama inovasi asc
          if (namaInovasiCompare !== 0) return namaInovasiCompare;

          return a.namaDesa.localeCompare(b.namaDesa); // nama desa asc
        });

        setImplementationData(allData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterInnovator]);

  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const downloadXLSX = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Inovasi");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `data_inovasi_${filterInnovator}.xlsx`);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
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
    doc.text("Diambil dari: Daftar Desa Digital per Inovator", 14, 22);
    doc.text(`Diunduh pada: ${downloadDate}`, 190, 22, { align: "right" });

    // Reset styles
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    let y = 42;
    doc.text(`Daftar Desa Digital dari Inovator: ${filterInnovator || ""}`, 14, y);
    y += 6;

    // Prepare table data
    const tableColumn = ["No", "Nama Inovasi", "Nama Inovator", "Nama Desa", "Tahun"];
    const tableRows = filteredData.map((item, index) => [
      index + 1,
      item.namaInovasi,
      item.inovator,
      item.namaDesa,
      item.tahun.toString(),
    ]);

    autoTable(doc, {
      startY: y,
      head: [tableColumn],
      body: tableRows,
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
        1: { cellWidth: 45 },  // Nama Inovasi
        2: { cellWidth: 50 },  // Nama Inovator
        3: { cellWidth: 45 },  // Nama Desa
        4: { cellWidth: 25 },  // Tahun
      },
    } as any);

    doc.save(`Detail_Desa_Digital_${filterInnovator || "data"}.pdf`);
  };

  return (
    <Box p={4} maxW="100%" mx="auto">
      <Flex justify="space-between" align="center" mb={2}>
        <Text {...titleStyle}>
          Daftar Desa Digital {filterInnovator}
        </Text>
        {filterInnovator && (
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
              <MenuItem onClick={downloadPDF}>Download PDF</MenuItem>
              <MenuItem onClick={downloadXLSX}>Download Excel</MenuItem>
            </MenuList>
          </Menu>
        )}
      </Flex>

      {!filterInnovator ? (
        <Text fontSize="12" color="gray.500" mt={1} fontStyle="italic">
          Pilih baris pada tabel Daftar Inovator untuk melihat data
        </Text>
      ) : loading ? (
        <Text p={4}>Loading data...</Text>
      ) : filteredData.length === 0 ? (
        <Text p={4}>Tidak ada data untuk inovator: {filterInnovator}</Text>
      ) : (
        <>
          <TableContainer {...tableContainerStyle}>
            <Table variant="simple" size="sm" sx={{ tableLayout: "fixed" }}>
              <Thead>
                <Tr>
                  <Th sx={tableHeaderStyle} width="10%">No</Th>
                  <Th sx={tableHeaderStyle}>Nama Inovasi</Th>
                  <Th sx={tableHeaderStyle}>Nama Desa</Th>
                  <Th sx={tableHeaderStyle}>Tahun Klaim</Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentData.map((item, index) => (
                  <Tr
                    key={index}
                    cursor="pointer"
                    onClick={() => onSelectVillage(item.namaInovasi)}
                    _hover={{ bg: "gray.100" }}
                  >
                    <Td sx={tableCellStyle}>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </Td>
                    <Td sx={tableCellStyle}>{item.namaInovasi}</Td>
                    <Td sx={tableCellStyle}>{item.namaDesa}</Td>
                    <Td sx={tableCellStyle}>{item.tahun}</Td>
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
    </Box>
  );
};

export default DetailInnovations;