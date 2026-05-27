import React, { useState, useEffect } from 'react';
import {
  Box, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Flex, Button, Image, Menu, MenuButton, MenuList, MenuItem, IconButton
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { getAuth } from "firebase/auth";
import { getInnovators } from "Services/innovatorServices";
import { getInnovation } from "Services/innovationServices";
import { getClaims } from "Services/villageServices";


import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  titleStyle,
  tableHeaderStyle,
  tableCellStyle,
  tableContainerStyle,
  paginationContainerStyle,
  paginationButtonStyle,
  paginationActiveButtonStyle,
} from './_detailInnovationsVillageStyle';

interface Implementation {
  inovasiId: string;
  namaInovasi: string;
  namaDesa: string;
  tahunKlaim: string;
}

interface InnovationDetail {
  namaInovasi: string;
  namaDesa: string;
  tanggalKlaim: string;
}

interface DetailInnovationsProps {
  villageId: string;
  namaDesa: string;
  onBack: () => void;
}

const DetailInnovations: React.FC<DetailInnovationsProps> = ({
  villageId,
  namaDesa,
  onBack,
}) => {
  const [implementationData, setImplementationData] = useState<Implementation[]>([]);
  const [loading, setLoading] = useState(true);
  const [innovations, setInnovations] = useState<InnovationDetail[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const auth = getAuth();
  const [userName, setUserName] = useState<string | null>(null);

  const [inovatorProfile, setInovatorProfile] = useState({
    namaInovator: "-",
    kategoriInovator: "-",
    tahunDibentuk: "-",
    targetPengguna: "-",
    produk: "-",
    modelBisnis: "-",
  });

  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      setUserName(user.displayName || user.email || "User");
    } else {
      setUserName(null);
    }

    if (!user) {
      setImplementationData([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch innovator profile via MongoDB API
        const innovatorsRes = await getInnovators();
        const allInnovators = (innovatorsRes as any).data || [];
        const myProfile = allInnovators.find((i: any) => i.id === user.uid);

        if (!myProfile) {
          setImplementationData([]);
          setLoading(false);
          return;
        }

        const inovatorId = myProfile._id || myProfile.id;

        // Fetch innovations by this innovator via MongoDB API
        const innovationRes = await getInnovation();
        const allInnovations = innovationRes.innovations || [];
        const myInnovations = allInnovations.filter(
          (i: any) => i.innovatorId === inovatorId
        );

        if (myInnovations.length === 0) {
          setImplementationData([]);
          setLoading(false);
          return;
        }

        const inovasiIds = myInnovations.map((i: any) => i._id || i.id);

        const produkInovator = myInnovations
          .map((i: any) => i.namaInovasi)
          .filter(Boolean)
          .join(", ");

        setInovatorProfile({
          namaInovator: myProfile?.namaInovator || "-",
          kategoriInovator: myProfile?.kategori || "-",
          tahunDibentuk: myProfile?.tahunDibentuk || "-",
          targetPengguna: myProfile?.targetPengguna || "-",
          modelBisnis: myProfile?.modelBisnis || "-",
          produk: produkInovator,
        });

        // Fetch claims filtered by desaId (villageId) via MongoDB API
        const claimsRes = await getClaims(villageId);
        const allClaims = (claimsRes as any).claims || [];

        // Filter hanya klaim yang inovasinya milik inovator ini
        const matchingClaims = allClaims.filter(
          (c: any) => inovasiIds.includes(c.inovasiId)
        );

        const innovationsData: InnovationDetail[] = matchingClaims.map((claim: any) => {
          const tahunKlaim = claim.createdAt
            ? new Date(claim.createdAt).getFullYear().toString()
            : "Tidak tersedia";

          return {
            namaDesa: claim.namaDesa || "Tidak tersedia",
            namaInovasi: claim.namaInovasi || "Tidak tersedia",
            tanggalKlaim: tahunKlaim,
          };
        });

        setInnovations(
          innovationsData.sort((a, b) => a.namaInovasi.localeCompare(b.namaInovasi))
        );

        setImplementationData(
          innovationsData.map((item) => ({
            inovasiId: "",
            namaInovasi: item.namaInovasi,
            namaDesa: item.namaDesa,
            tahunKlaim: item.tanggalKlaim,
          }))
        );

      } catch (error) {
        console.error("Error fetching villages or inovator data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [villageId]);

  const totalPages = Math.ceil(innovations.length / itemsPerPage);
  const currentData = innovations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const downloadDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Assuming `userName` is defined and `implementationData` is the list of innovations
    const userProfile = {
      nama: userName || "-",
    };

    // Header with green background
    doc.setFillColor(0, 128, 0);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    doc.setFontSize(15);
    doc.text("Dokumen Laporan Inovator", 14, 13);
    doc.text(inovatorProfile.namaInovator, 190, 13, { align: "right" });

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
    y += 10;

    doc.text("Produk", labelX, y);
    doc.text(`: ${inovatorProfile.produk || "-"}`, valueX, y);
    y += lineHeight;

    // Table title
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text(`Data Inovasi ${inovatorProfile.namaInovator}`, 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["No", "Nama Desa", "Nama Inovasi", "Tahun Klaim"]],
      body: implementationData.map((item, idx) => [
        idx + 1,
        item.namaInovasi,
        item.namaDesa,
        item.tahunKlaim,
      ]),
      headStyles: {
        fillColor: [0, 128, 0],
        textColor: 255,
        fontStyle: 'bold',
      },
    });

    doc.save("daftar-desa-inovasi.pdf");
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      implementationData.map((item, idx) => ({
        "No": idx + 1,
        "Nama Inovasi": item.namaInovasi,
        "Nama Desa": item.namaDesa,
        "Tahun Klaim": item.tahunKlaim,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inovasi");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "daftar-desa-inovasi.xlsx");
  };

  return (
    <Box p={4} maxW="100%" mx="auto">
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Text sx={titleStyle}>
            {namaDesa ? `Daftar Inovasi ${namaDesa}` : "Daftar Inovasi"}
          </Text>
          {!villageId && (
            <Text fontSize="12" color="gray.500" mt={1} fontStyle="italic">
              Pilih baris pada tabel Daftar Desa untuk melihat data
            </Text>
          )}
        </Box>

        {villageId && (
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Download options"
              icon={<Image src="/icons/icon-download.svg" alt="Download" boxSize="16px" />}
              variant="ghost"
            />
            <MenuList>
              <MenuItem onClick={exportToPDF}>Download PDF</MenuItem>
              <MenuItem onClick={exportToExcel}>Download Excel</MenuItem>
            </MenuList>
          </Menu>
        )}
      </Flex>

      {villageId && (
        <>
          {loading ? (
            <Text p={2}>Loading data...</Text>
          ) : (
            <>
              <TableContainer sx={tableContainerStyle}>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th sx={tableHeaderStyle} width="20%">No</Th>
                      <Th sx={tableHeaderStyle} width="40%">Nama Inovasi</Th>
                      <Th sx={tableHeaderStyle}>Tahun Klaim</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {currentData.map((item, index) => (
                      <Tr key={index}>
                        <Td sx={tableCellStyle}>{(currentPage - 1) * itemsPerPage + index + 1}</Td>
                        <Td sx={tableCellStyle}>{item.namaInovasi}</Td>
                        <Td sx={tableCellStyle}>{item.tanggalKlaim}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Flex sx={paginationContainerStyle}>
                  <Button
                    onClick={() => goToPage(Math.max(1, currentPage - 1))}
                    isDisabled={currentPage === 1}
                    {...paginationButtonStyle}
                    leftIcon={<ChevronLeftIcon />}
                    mr={2}
                  >
                    Sebelumnya
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      onClick={() => goToPage(page)}
                      {...(page === currentPage ? paginationActiveButtonStyle : paginationButtonStyle)}
                      mx={1}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                    isDisabled={currentPage === totalPages}
                    {...paginationButtonStyle}
                    rightIcon={<ChevronRightIcon />}
                    ml={2}
                  >
                    Berikutnya
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