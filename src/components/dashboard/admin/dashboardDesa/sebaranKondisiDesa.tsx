import {
  Box,
  Flex,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Icon
} from "@chakra-ui/react";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import * as XLSX from "xlsx";

const SebaranKondisiDesa: React.FC = () => {
  interface DesaData {
    no: number;
    namaDesa: string;
    kondisiJalan: string;
    jaringanInternet: string;
    ketersediaanListrik: string;
    geografis: string;
    sosialBudaya: string;
    sumberDayaAlam: string;
    perkembanganTeknologi: string;
    kemampuanTeknologi: string;
  }

  const ITEMS_PER_PAGE = 5;
  const [desaData, setDesaData] = useState<DesaData[]>([]);
  const [filteredDesaData, setFilteredDesaData] = useState<DesaData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchDesaData();
  }, []);

  const limitWords = (text?: string) =>
    (text || "").split(" ").slice(0, 6).join(" ");

  const fetchDesaData = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const headers: Record<string, string> = {};
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch("/api/villages", { headers });
      const dataRaw = await response.json();
      const villages = dataRaw.villages || [];

      const desaList: DesaData[] = [];
      let i = 1;

      villages.forEach((data: any) => {
        desaList.push({
          no: i++,
          namaDesa: limitWords(data.namaDesa?.label || data.namaDesa),
          kondisiJalan: limitWords(data.kondisijalan),
          jaringanInternet: limitWords(data.jaringan),
          ketersediaanListrik: limitWords(data.listrik),
          geografis: limitWords(data.geografisDesa),
          sosialBudaya: limitWords(data.sosialBudaya),
          sumberDayaAlam: limitWords(data.sumberDaya),
          perkembanganTeknologi: limitWords(data.teknologi),
          kemampuanTeknologi: limitWords(data.kemampuan),
        });
      });

      setDesaData(desaList);
      setFilteredDesaData(desaList);
    } catch (error) {
      console.error("❌ Error fetching desa data:", error);
    }
  };

  // ✅ Fungsi download tetap ada, tidak muncul di UI
  const handleDownloadExcel = () => {
    const data = filteredDesaData.map((item) => ({
      No: item.no,
      "Nama Desa": item.namaDesa,
      "Kondisi Jalan Desa": item.kondisiJalan,
      "Jaringan Internet Desa": item.jaringanInternet,
      "Ketersediaan Listrik Desa": item.ketersediaanListrik,
      "Karakteristik Geografis Desa": item.geografis,
      "Kondisi Sosial dan Budaya": item.sosialBudaya,
      "Potensi Sumber Daya Alam": item.sumberDayaAlam,
      "Perkembangan Teknologi Digital": item.perkembanganTeknologi,
      "Kemampuan Penggunaan Teknologi": item.kemampuanTeknologi,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sebaran Kondisi Desa");
    XLSX.writeFile(workbook, "sebaran_kondisi_desa.xlsx");
  };

  const totalPages = Math.ceil(filteredDesaData.length / ITEMS_PER_PAGE);
  const currentData = filteredDesaData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <Box>
      <Flex justify="space-between" align="center" mt="24px" mx="15px">
        <Text fontSize="sm" fontWeight="bold" color="gray.800">
          Sebaran Kondisi Desa
        </Text>
      </Flex>

      <Box bg="white" borderRadius="xl" pt={0} pb={3} mx="15px" boxShadow="md" mt={4}>
        <TableContainer borderRadius="md">
          <Table size="sm">
            <Thead bg="#C6D8D0">
              <Tr>
                <Th p={3} fontSize="8px" textAlign="center">No</Th>
                <Th fontSize="8px" textAlign="center">Nama Desa</Th>
                <Th fontSize="8px" textAlign="center">Kondisi Jalan Desa</Th>
                <Th fontSize="8px" textAlign="center">Jaringan Internet Desa</Th>
                <Th fontSize="8px" textAlign="center">Ketersediaan Listrik Desa</Th>
                <Th fontSize="8px" textAlign="center">Karakteristik Geografis Desa</Th>
                <Th fontSize="8px" textAlign="center">Kondisi Sosial dan Budaya</Th>
                <Th fontSize="8px" textAlign="center">Potensi Sumber Daya Alam</Th>
                <Th fontSize="8px" textAlign="center">Perkembangan Teknologi Digital</Th>
                <Th fontSize="8px" textAlign="center">Kemampuan Penggunaan Teknologi</Th>
              </Tr>
            </Thead>
            <Tbody>
              {currentData.map((row) => (
                <Tr key={row.no}>
                  <Td fontSize="8px" textAlign="center" fontWeight="bold">{row.no}</Td>
                  <Td fontSize="8px" textAlign="center">{row.namaDesa}</Td>
                  <Td fontSize="8px" textAlign="center">{row.kondisiJalan}</Td>
                  <Td fontSize="8px" textAlign="center">{row.jaringanInternet}</Td>
                  <Td fontSize="8px" textAlign="center">{row.ketersediaanListrik}</Td>
                  <Td fontSize="8px" textAlign="center">{row.geografis}</Td>
                  <Td fontSize="8px" textAlign="center">{row.sosialBudaya}</Td>
                  <Td fontSize="8px" textAlign="center">{row.sumberDayaAlam}</Td>
                  <Td fontSize="8px" textAlign="center">{row.perkembanganTeknologi}</Td>
                  <Td fontSize="8px" textAlign="center">{row.kemampuanTeknologi}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <Flex justify="center" mt={3} gap={2}>
          {(() => {
            const pagesPerBlock = 5;
            const currentBlock = Math.floor((currentPage - 1) / pagesPerBlock);
            const startPage = currentBlock * pagesPerBlock + 1;
            const endPage = Math.min(startPage + pagesPerBlock - 1, totalPages);

            return (
              <>
                {startPage > 1 && (
                  <Button
                    size="xs"
                    onClick={() => setCurrentPage(startPage - 1)}
                    variant="ghost"
                    p={1}
                  >
                    <Icon as={ChevronLeftIcon} />
                  </Button>
                )}
                {[...Array(endPage - startPage + 1)].map((_, index) => {
                  const page = startPage + index;
                  return (
                    <Button
                      key={page}
                      size="xs"
                      borderRadius="full"
                      bg={currentPage === page ? "gray.800" : "white"}
                      color={currentPage === page ? "white" : "gray.800"}
                      onClick={() => setCurrentPage(page)}
                      _hover={{ bg: "gray.300" }}
                    >
                      {page}
                    </Button>
                  );
                })}
                {endPage < totalPages && (
                  <Button
                    size="xs"
                    onClick={() => setCurrentPage(endPage + 1)}
                    variant="ghost"
                    p={1}
                  >
                    <Icon as={ChevronRightIcon} />
                  </Button>
                )}
              </>
            );
          })()}
        </Flex>
      </Box>
    </Box>
  );
};

export default SebaranKondisiDesa;
