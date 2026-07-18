"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Stack,
  Text,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  TagLabel,
  Image,
  Button,
  Grid,
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import TopBar from "Components/topBar";
import Container from "Components/container";
import { getBadgesAdminSummary, getBadgesAdminUsers } from "@/features/digital-nudge/services";
import { BADGE_STYLES } from "@/features/digital-nudge/constants";

// Constant arrays for badge descriptions and definitions
const VILLAGE_BADGES_INFO = [
  { id: "penggerak_inovasi", name: "Penggerak Inovasi", desc: "Diperoleh dengan menerapkan 3 inovasi digital", target: 3 },
  { id: "penggiat_digital", name: "Penggiat Digital", desc: "Diperoleh dengan menerapkan 7 inovasi digital", target: 7 },
  { id: "adopter_spesialis", name: "Adopter Spesialis", desc: "Diperoleh dengan menerapkan 5 inovasi dari kategori yang sama", target: 5 },
  { id: "adopter_giat", name: "Adopter Giat", desc: "Diperoleh dengan menerapkan 4 inovasi digital selama 6 bulan berturut-turut", target: 4 },
  { id: "sahabat_inovator", name: "Sahabat Inovator", desc: "Diperoleh dengan menerapkan beberapa inovasi digital dari 10 inovator berbeda", target: 10 },
];

const INNOVATOR_BADGES_INFO = [
  { id: "terus_berkembang", name: "Terus Berkembang", desc: "Diperoleh dengan menambahkan 5 inovasi digital", target: 5 },
  { id: "si_inovatif", name: "Si Inovatif", desc: "Diperoleh dengan menambahkan 10 inovasi digital", target: 10 },
  { id: "kolaborator_handal", name: "Kolaborator Handal", desc: "Diperoleh dengan memiliki 15 desa dampingan", target: 15 },
  { id: "sahabat_desa", name: "Sahabat Desa", desc: "Diperoleh dengan memiliki 30 desa dampingan", target: 30 },
  { id: "pemimpin_pasar", name: "Pemimpin Pasar", desc: "Diperoleh dengan memiliki 100 desa dampingan", target: 100 },
];

export default function AdminBadgesPage() {
  const router = useRouter();

  // Summary State
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Selected Badge State for detail view modal
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalPage, setModalPage] = useState(1);
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [modalUsersLoading, setModalUsersLoading] = useState(false);
  const [modalTotalPages, setModalTotalPages] = useState(1);
  const [modalTotalUsers, setModalTotalUsers] = useState(0);

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const res = await getBadgesAdminSummary();
      setSummaryData(res);
    } catch (err) {
      console.error("Error loading summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (!selectedBadge) {
      setModalUsers([]);
      setModalSearch("");
      setModalPage(1);
      return;
    }

    const fetchModalUsers = async () => {
      try {
        setModalUsersLoading(true);
        const res = await getBadgesAdminUsers({
          badgeId: selectedBadge.id,
          role: selectedBadge.role,
          search: modalSearch,
          page: modalPage,
          limit: 5 // Compact list size inside the modal
        });
        setModalUsers(res.users || []);
        setModalTotalPages(res.totalPages || 1);
        setModalTotalUsers(res.total || 0);
      } catch (err) {
        console.error("Error loading badge achievers:", err);
      } finally {
        setModalUsersLoading(false);
      }
    };

    fetchModalUsers();
  }, [selectedBadge, modalSearch, modalPage]);

  return (
    <Container page>
      <TopBar title="Monitoring Gelar & Badge" onBack={() => router.push("/admin")} />
      
      <Box px="16px" pb={12} pt={4}>
        {summaryLoading ? (
          <Flex minH="250px" align="center" justify="center">
            <Spinner color="#347357" size="lg" />
          </Flex>
        ) : (
          <Stack spacing={8}>
            {/* Summary Overview Cards */}
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem bg="green.50" p={5} borderRadius="16px" border="1px solid" borderColor="green.200" shadow="xs">
                <Text fontSize="12px" fontWeight="700" color="#347357" textTransform="uppercase">Total Desa Terverifikasi</Text>
                <Text fontSize="28px" fontWeight="800" color="#1F2937" mt={1}>{summaryData?.totalVillages || 0}</Text>
              </GridItem>
              <GridItem bg="blue.50" p={5} borderRadius="16px" border="1px solid" borderColor="blue.200" shadow="xs">
                <Text fontSize="12px" fontWeight="700" color="blue.700" textTransform="uppercase">Total Inovator Terverifikasi</Text>
                <Text fontSize="28px" fontWeight="800" color="#1F2937" mt={1}>{summaryData?.totalInnovators || 0}</Text>
              </GridItem>
            </Grid>

            {/* Village Badges Section */}
            <Box>
              <Text fontSize="16px" fontWeight="800" color="#1F2937" mb={4}>Statistik Gelar Desa</Text>
              <Stack spacing={3}>
                {VILLAGE_BADGES_INFO.map((def) => {
                  const style = BADGE_STYLES[def.id] || {};
                  const count = summaryData?.villageBadgeCounts?.[def.id] || 0;
                  return (
                    <Flex
                      key={def.id}
                      p={4}
                      bg="white"
                      borderRadius="16px"
                      borderWidth="1px"
                      borderColor="gray.100"
                      shadow="xs"
                      align="center"
                      cursor="pointer"
                      _hover={{ bg: "gray.50", shadow: "sm" }}
                      transition="all 0.2s"
                      onClick={() => setSelectedBadge({ ...def, role: "village" })}
                    >
                      <Box p={2.5} bg={style.bg} borderRadius="12px" mr={4}>
                        <Image src={style.icon} alt={def.name} boxSize="36px" />
                      </Box>
                      <Stack spacing={0.5} flex={1}>
                        <Text fontSize="14px" fontWeight="700" color="#1F2937">{def.name}</Text>
                        <Text fontSize="11px" color="#6B7280" lineHeight="1.3">{def.desc}</Text>
                      </Stack>
                      <Box textAlign="right" pl={2}>
                        <Tag size="md" variant="subtle" bg={style.bg} color={style.color} fontWeight="bold" borderRadius="full">
                          <TagLabel fontSize="11px">{count} Desa</TagLabel>
                        </Tag>
                      </Box>
                    </Flex>
                  );
                })}
              </Stack>
            </Box>

            {/* Innovator Badges Section */}
            <Box>
              <Text fontSize="16px" fontWeight="800" color="#1F2937" mb={4}>Statistik Gelar Inovator</Text>
              <Stack spacing={3}>
                {INNOVATOR_BADGES_INFO.map((def) => {
                  const style = BADGE_STYLES[def.id] || {};
                  const count = summaryData?.innovatorBadgeCounts?.[def.id] || 0;
                  return (
                    <Flex
                      key={def.id}
                      p={4}
                      bg="white"
                      borderRadius="16px"
                      borderWidth="1px"
                      borderColor="gray.100"
                      shadow="xs"
                      align="center"
                      cursor="pointer"
                      _hover={{ bg: "gray.50", shadow: "sm" }}
                      transition="all 0.2s"
                      onClick={() => setSelectedBadge({ ...def, role: "innovator" })}
                    >
                      <Box p={2.5} bg={style.bg} borderRadius="12px" mr={4}>
                        <Image src={style.icon} alt={def.name} boxSize="36px" />
                      </Box>
                      <Stack spacing={0.5} flex={1}>
                        <Text fontSize="14px" fontWeight="700" color="#1F2937">{def.name}</Text>
                        <Text fontSize="11px" color="#6B7280" lineHeight="1.3">{def.desc}</Text>
                      </Stack>
                      <Box textAlign="right" pl={2}>
                        <Tag size="md" variant="subtle" bg={style.bg} color={style.color} fontWeight="bold" borderRadius="full">
                          <TagLabel fontSize="11px">{count} Inovator</TagLabel>
                        </Tag>
                      </Box>
                    </Flex>
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Badge Achievers Detail Modal */}
      <Modal isOpen={selectedBadge !== null} onClose={() => setSelectedBadge(null)} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="20px" mx="16px" overflow="hidden">
          <ModalHeader bg="green.50" borderBottomWidth="1px" borderColor="green.100" py={4}>
            <Flex align="center" gap={3}>
              {selectedBadge && (
                <>
                  <Box p={2} bg={BADGE_STYLES[selectedBadge.id]?.bg} borderRadius="12px">
                    <Image src={BADGE_STYLES[selectedBadge.id]?.icon} alt={selectedBadge.name} boxSize="28px" />
                  </Box>
                  <Stack spacing={0.5}>
                    <Text fontSize="15px" fontWeight="800" color="#1F2937">
                      Penerima Gelar: {selectedBadge.name}
                    </Text>
                    <Text fontSize="11px" color="gray.500" fontWeight="normal">
                      {selectedBadge.desc}
                    </Text>
                  </Stack>
                </>
              )}
            </Flex>
          </ModalHeader>
          <ModalCloseButton mt={1} />
          <ModalBody p={5}>
            <Stack spacing={4}>
              {/* Search Bar inside Modal */}
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder={`Cari ${selectedBadge?.role === "village" ? "desa" : "inovator"}...`}
                  value={modalSearch}
                  onChange={(e) => {
                    setModalSearch(e.target.value);
                    setModalPage(1);
                  }}
                  bg="gray.50"
                  borderRadius="10px"
                  fontSize="12px"
                  borderColor="gray.200"
                />
              </InputGroup>

              {modalUsersLoading ? (
                <Flex minH="180px" align="center" justify="center">
                  <Spinner color="#347357" size="md" />
                </Flex>
              ) : modalUsers.length === 0 ? (
                <Flex minH="150px" direction="column" align="center" justify="center" bg="gray.50" borderRadius="12px">
                  <Text fontSize="12px" color="gray.500" fontWeight="bold">
                    Tidak ada {selectedBadge?.role === "village" ? "desa" : "inovator"} yang ditemukan.
                  </Text>
                </Flex>
              ) : (
                <Stack spacing={3}>
                  <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="12px" overflow="hidden" shadow="xs">
                    <Table size="sm" variant="simple">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th py={2.5} fontSize="10px" color="gray.500">Nama</Th>
                          <Th py={2.5} fontSize="10px" color="gray.500">Gelar Aktif</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {modalUsers.map((user) => {
                          const activeStyle = user.activeBadge ? BADGE_STYLES[user.activeBadge] : null;
                          return (
                            <Tr key={user.id}>
                              <Td py={2.5}>
                                <Text fontSize="12px" fontWeight="700" color="#1F2937">{user.name}</Text>
                              </Td>
                              <Td py={2.5}>
                                {activeStyle ? (
                                  <Tag size="sm" variant="subtle" bg={activeStyle.bg} color={activeStyle.color} fontWeight="bold" borderRadius="full">
                                    <Image src={activeStyle.icon} alt={activeStyle.name} boxSize="10px" mr={1} />
                                    <TagLabel fontSize="9px">{activeStyle.name}</TagLabel>
                                  </Tag>
                                ) : (
                                  <Text fontSize="10px" color="gray.400" fontStyle="italic">Tidak Ada</Text>
                                )}
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>

                  {/* Modal Pagination */}
                  {modalTotalPages > 1 && (
                    <Flex justify="space-between" align="center" mt={1} px="2px">
                      <Text fontSize="10px" color="gray.500">
                        Menampilkan {modalUsers.length} dari {modalTotalUsers} pengguna
                      </Text>
                      <Flex gap={1.5}>
                        <Button
                          size="xs"
                          onClick={() => setModalPage((p) => Math.max(p - 1, 1))}
                          isDisabled={modalPage === 1}
                          bg="white"
                          borderWidth="1px"
                          fontSize="10px"
                          py={1}
                        >
                          Sebelumnya
                        </Button>
                        <Button
                          size="xs"
                          onClick={() => setModalPage((p) => Math.min(p + 1, modalTotalPages))}
                          isDisabled={modalPage === modalTotalPages}
                          bg="white"
                          borderWidth="1px"
                          fontSize="10px"
                          py={1}
                        >
                          Berikutnya
                        </Button>
                      </Flex>
                    </Flex>
                  )}
                </Stack>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="gray.100" py={3} bg="gray.50">
            <Button size="sm" colorScheme="green" bg="#347357" color="white" onClick={() => setSelectedBadge(null)}>
              Tutup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
