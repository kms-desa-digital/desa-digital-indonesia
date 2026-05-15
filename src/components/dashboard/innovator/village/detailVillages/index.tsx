import { useEffect, useState } from "react";
import {
  Text, Box, Flex, Button,
  Table, Thead, Tbody, Tr, Th, Td,
  TableContainer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from "@chakra-ui/react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useAuthToken } from "Hooks/useAuthToken";
import { getInnovation } from "Services/innovationServices";
import { getClaims } from "Services/villageServices";
import {
  titleStyle,
  tableHeaderStyle,
  tableCellStyle,
  tableContainerStyle,
  paginationContainerStyle,
  paginationButtonStyle,
  paginationActiveButtonStyle,
  paginationEllipsisStyle,
} from "./_detailVillagesStyle";
import downloadIcon from "@public/icons/icon-download.svg";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface Implementation {
  villageId: string;
  namaDesa: string;
  namaInovator: string;
  jumlahInovasi: number;
}

interface DetailVillagesProps {
  onSelectVillage: (villageId: string, namaDesa: string) => void;
}

const DetailVillages: React.FC<DetailVillagesProps> = ({ onSelectVillage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [implementationData, setImplementationData] = useState<Implementation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  const [inovatorProfile, setInovatorProfile] = useState({
    namaInovator: "-",
    kategoriInovator: "-",
    tahunDibentuk: "-",
    targetPengguna: "-",
    produk: "-",
    modelBisnis: "-",
  });

  const { token, isLoaded: authLoaded } = useAuthToken();

  useEffect(() => {
    const fetchData = async () => {
      if (!authLoaded) return;
      setLoading(true);

      if (!token) {
        setImplementationData([]);
        setLoading(false);
        setUserName("");
        return;
      }

      try {
        // Dapatkan profil innovator milik user saat ini via dashboard API
        const dashRes = await fetch('/api/innovator/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!dashRes.ok) {
          setImplementationData([]);
          setLoading(false);
          return;
        }

        const dashData = await dashRes.json();
        const myProfile = dashData.innovator;

        if (!myProfile) {
          setImplementationData([]);
          setLoading(false);
          return;
        }

        const inovatorId = myProfile._id?.toString();
        setUserName(myProfile.namaInovator || "");

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

        // Build inovasiMap: id -> { namaInovasi, inovatorId }
        const inovasiMap = new Map<string, { namaInovasi: string; inovatorId: string }>();
        myInnovations.forEach((inov: any) => {
          const id = inov._id || inov.id;
          inovasiMap.set(id, {
            namaInovasi: inov.namaInovasi,
            inovatorId: inov.innovatorId,
          });
        });

        const inovasiIds = Array.from(inovasiMap.keys());

        const produkInovator = myInnovations
          .map((i: any) => i.namaInovasi)
          .filter(Boolean)
          .join(", ");

        setInovatorProfile({
          namaInovator: myProfile.namaInovator || "-",
          kategoriInovator: myProfile.kategori || "-",
          tahunDibentuk: myProfile.tahunDibentuk || "-",
          targetPengguna: myProfile.targetPengguna || "-",
          modelBisnis: myProfile.modelBisnis || "-",
          produk: produkInovator || "-",
        });

        // Fetch all claims via MongoDB API and filter by inovasiIds
        const claimsRes = await getClaims();
        const allClaims = (claimsRes as any).claims || [];
        const relevantClaims = allClaims.filter(
          (claim: any) => claim.inovasiId && inovasiIds.includes(claim.inovasiId)
        );

        // Aggregate: count unique innovations per desaId
        const desaMap = new Map<
          string,
          { desaId: string; namaDesa: string; inovasiIdSet: Set<string> }
        >();

        for (const claim of relevantClaims) {
          const desaId = claim.desaId;
          const namaDesa = claim.namaDesa;
          const inovasiId = claim.inovasiId;

          if (!desaMap.has(desaId)) {
            desaMap.set(desaId, {
              desaId,
              namaDesa,
              inovasiIdSet: new Set<string>(),
            });
          }
          desaMap.get(desaId)!.inovasiIdSet.add(inovasiId);
        }

        const result: Implementation[] = Array.from(desaMap.values()).map((data) => ({
          namaDesa: data.namaDesa,
          namaInovator: myProfile.namaInovator || "-",
          jumlahInovasi: data.inovasiIdSet.size,
          villageId: data.desaId || "",
        }));

        setImplementationData(
          result.sort((a, b) => {
            if (b.jumlahInovasi === a.jumlahInovasi) {
              return a.namaDesa.localeCompare(b.namaDesa);
            }
            return b.jumlahInovasi - a.jumlahInovasi;
          })
        );

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoaded, token]);

  const totalPages = Math.ceil(implementationData.length / itemsPerPage);
  const currentData = implementationData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      const leftSiblingIndex = Math.max(currentPage - 1, 1);
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

      if (!shouldShowLeftDots && shouldShowRightDots) {
        for (let i = 1; i <= 3; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (shouldShowLeftDots && !shouldShowRightDots) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 2; i <= totalPages; i++) pageNumbers.push(i);
      } else if (shouldShowLeftDots && shouldShowRightDots) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  const exportToPDF = () => {
    if (implementationData.length === 0) {
      alert("No data to export");
      return;
    }

    const doc = new jsPDF();

    const downloadDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

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
      head: [["No", "Nama Desa", "Nama Inovator", "Jumlah Inovasi"]],
      body: implementationData.map((item, idx) => [
        idx + 1,
        item.namaDesa,
        item.namaInovator,
        item.jumlahInovasi,
      ]),
      headStyles: {
        fillColor: [0, 128, 0],
        textColor: 255,
        fontStyle: 'bold',
      },
    });

    doc.save("daftar-desa.pdf");
  };

  const exportToExcel = () => {
    if (implementationData.length === 0) {
      alert("No data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      implementationData.map((item, idx) => ({
        "No": idx + 1,
        "Nama Desa": item.namaDesa,
        "Nama Inovator": item.namaInovator,
        "Jumlah Inovasi": item.jumlahInovasi,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inovasi");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "daftar-desa.xlsx");
  };

  return (
    <Box p={4} maxW="100%" mx="auto">
      <Flex justify="space-between" align="center" mb={2}>
        <Text {...titleStyle}>
          Daftar Desa Dampingan {inovatorProfile?.namaInovator || "Inovator"}
        </Text>
        <Flex justify="flex-end" align="center">
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Download options"
              icon={(
                <Image
                  src={downloadIcon}
                  alt="Download"
                  width={16}
                  height={16}
                  style={{ width: '16px', height: '16px' }}
                />
              )}
              variant="ghost"
            />
            <MenuList>
              <MenuItem onClick={exportToPDF}>Download PDF</MenuItem>
              <MenuItem onClick={exportToExcel}>Download Excel</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {loading ? (
        <Text>Loading data...</Text>
      ) : (
        <>
          <TableContainer {...tableContainerStyle}>
            <Table variant="simple" size="sm" sx={{ tableLayout: "fixed" }}>
              <Thead>
                <Tr>
                  <Th sx={tableHeaderStyle} width="20%">No</Th>
                  <Th sx={tableHeaderStyle} width="50%">Nama Desa</Th>
                  <Th sx={tableHeaderStyle}>Jumlah Inovasi</Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentData.map((item, index) => (
                  <Tr
                    key={item.villageId}
                    cursor="pointer"
                    _hover={{ bg: "gray.100" }}
                    onClick={() => onSelectVillage(item.villageId, item.namaDesa)}
                  >
                    <Td sx={tableCellStyle}>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </Td>
                    <Td sx={tableCellStyle}>{item.namaDesa}</Td>
                    <Td sx={tableCellStyle}>{item.jumlahInovasi}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Flex sx={paginationContainerStyle} mt={2}>
              <Button
                sx={paginationButtonStyle}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                leftIcon={<ChevronLeftIcon />}
              >
                Prev
              </Button>
              {getPageNumbers().map((page, idx) =>
                typeof page === "number" ? (
                  <Button
                    key={idx}
                    sx={page === currentPage ? paginationActiveButtonStyle : paginationButtonStyle}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </Button>
                ) : (
                  <Text key={idx} sx={paginationEllipsisStyle}>
                    {page}
                  </Text>
                )
              )}
              <Button
                sx={paginationButtonStyle}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                rightIcon={<ChevronRightIcon />}
              >
                Next
              </Button>
            </Flex>
          )}
        </>
      )}
    </Box>
  );
};

export default DetailVillages;