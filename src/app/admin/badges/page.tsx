"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Stack,
  Text,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  TagLabel,
  Progress,
  IconButton,
  Image,
  Button,
  Grid,
  GridItem,
  Collapse,
} from "@chakra-ui/react";
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import TopBar from "Components/topBar";
import Container from "Components/container";
import { getBadgesAdminSummary, getBadgesAdminUsers } from "@/features/digital-nudge/services";
import { BADGE_STYLES } from "@/features/digital-nudge/constants";
import { Badge } from "@/features/digital-nudge/types";

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

interface UserItem {
  id: string;
  name: string;
  role: "village" | "innovator";
  activeBadge: string | null;
  badges: Badge[];
}

export default function AdminBadgesPage() {
  const router = useRouter();

  // Summary State
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Users Monitoring State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Expanded Rows State
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

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

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await getBadgesAdminUsers({ search, role, page, limit: 10 });
      setUsers(res.users || []);
      setTotalPages(res.totalPages || 1);
      setTotalUsers(res.total || 0);
    } catch (err) {
      console.error("Error loading user badges:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchUsers();
    // Reset expanded rows when page or search parameters change
    setExpandedRows({});
  }, [search, role, page]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <Container page>
      <TopBar title="Monitoring Gelar & Badge" onBack={() => router.push("/admin")} />
      
      <Box px="16px" pb={12} pt={4}>
        <Tabs variant="soft-rounded" colorScheme="green" defaultIndex={0}>
          <TabList bg="gray.100" p={1} borderRadius="full" mb={6}>
            <Tab flex={1} borderRadius="full" fontWeight="bold" fontSize="13px" _selected={{ bg: "#347357", color: "white" }}>
              Ringkasan Gelar
            </Tab>
            <Tab flex={1} borderRadius="full" fontWeight="bold" fontSize="13px" _selected={{ bg: "#347357", color: "white" }}>
              Monitoring Pengguna
            </Tab>
          </TabList>

          <TabPanels>
            {/* TAB 1: SUMMARY STATS */}
            <TabPanel p={0}>
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
                          <Flex key={def.id} p={4} bg="white" borderRadius="16px" borderWidth="1px" borderColor="gray.100" shadow="xs" align="center">
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
                          <Flex key={def.id} p={4} bg="white" borderRadius="16px" borderWidth="1px" borderColor="gray.100" shadow="xs" align="center">
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
            </TabPanel>

            {/* TAB 2: USERS MONITORING */}
            <TabPanel p={0}>
              <Stack spacing={4}>
                {/* Search and Filters */}
                <Flex gap={3} flexWrap="wrap">
                  <InputGroup flex={2} minW="200px">
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Cari desa atau inovator..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      bg="white"
                      borderRadius="12px"
                      fontSize="13px"
                      borderColor="gray.200"
                    />
                  </InputGroup>
                  <Select
                    flex={1}
                    minW="120px"
                    bg="white"
                    borderRadius="12px"
                    fontSize="13px"
                    borderColor="gray.200"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">Semua Peran</option>
                    <option value="village">Desa</option>
                    <option value="innovator">Inovator</option>
                  </Select>
                </Flex>

                {usersLoading ? (
                  <Flex minH="250px" align="center" justify="center">
                    <Spinner color="#347357" size="lg" />
                  </Flex>
                ) : users.length === 0 ? (
                  <Flex minH="200px" direction="column" align="center" justify="center" bg="gray.50" borderRadius="16px">
                    <Text fontSize="13px" color="gray.500" fontWeight="bold">Tidak ada data pengguna ditemukan.</Text>
                  </Flex>
                ) : (
                  <Stack spacing={4}>
                    <Box bg="white" shadow="xs" borderRadius="16px" border="1px solid" borderColor="gray.100" overflow="hidden">
                      <Table variant="simple" size="sm">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th py={3.5} fontSize="11px" color="gray.500">Nama</Th>
                            <Th py={3.5} fontSize="11px" color="gray.500">Peran</Th>
                            <Th py={3.5} fontSize="11px" color="gray.500">Gelar Aktif</Th>
                            <Th py={3.5} fontSize="11px" color="gray.500" textAlign="center">Progress</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {users.map((user) => {
                            const isExpanded = !!expandedRows[user.id];
                            const activeStyle = user.activeBadge ? BADGE_STYLES[user.activeBadge] : null;

                            return (
                              <React.Fragment key={user.id}>
                                <Tr 
                                  cursor="pointer" 
                                  onClick={() => toggleRow(user.id)}
                                  _hover={{ bg: "gray.50" }}
                                  transition="background 0.2s"
                                >
                                  <Td py={3}>
                                    <Text fontSize="13px" fontWeight="700" color="#1F2937">{user.name}</Text>
                                  </Td>
                                  <Td py={3}>
                                    <Tag
                                      size="sm"
                                      variant="solid"
                                      bg={user.role === "village" ? "green.500" : "blue.500"}
                                      borderRadius="full"
                                    >
                                      <TagLabel fontSize="10px" fontWeight="bold" textTransform="uppercase">
                                        {user.role === "village" ? "Desa" : "Inovator"}
                                      </TagLabel>
                                    </Tag>
                                  </Td>
                                  <Td py={3}>
                                    {activeStyle ? (
                                      <Tag size="md" variant="subtle" bg={activeStyle.bg} color={activeStyle.color} fontWeight="bold" borderRadius="full">
                                        <Image src={activeStyle.icon} alt={activeStyle.name} boxSize="12px" mr={1.5} />
                                        <TagLabel fontSize="10px">{activeStyle.name}</TagLabel>
                                      </Tag>
                                    ) : (
                                      <Text fontSize="11px" color="gray.400" fontStyle="italic">Tidak Ada</Text>
                                    )}
                                  </Td>
                                  <Td py={3} textAlign="center">
                                    <IconButton
                                      size="xs"
                                      variant="ghost"
                                      aria-label="Expand Row"
                                      icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRow(user.id);
                                      }}
                                    />
                                  </Td>
                                </Tr>

                                {/* Collapsible detail row */}
                                <Tr>
                                  <Td colSpan={4} p={0} bg="gray.50/50" borderBottom={isExpanded ? "1px solid" : "none"} borderColor="gray.100">
                                    <Collapse in={isExpanded} animateOpacity>
                                      <Box p={5} borderLeft="4px solid" borderColor="#347357">
                                        <Text fontSize="12px" fontWeight="800" color="#347357" mb={4} textTransform="uppercase">
                                          Pencapaian Gelar & Progress
                                        </Text>
                                        <Stack spacing={4}>
                                          {user.badges.map((badge) => {
                                            const unlocked = badge.isUnlocked;
                                            const style = BADGE_STYLES[badge.id] || {};
                                            return (
                                              <Box key={badge.id} p={3.5} bg="white" borderRadius="12px" borderWidth="1px" borderColor="gray.100" shadow="xs">
                                                <Flex justify="between" align="center" mb={2}>
                                                  <Flex align="center" gap={2.5}>
                                                    <Box p={1.5} bg={unlocked ? "green.50" : "gray.100"} borderRadius="8px">
                                                      <Image src={badge.icon} alt={badge.name} boxSize="22px" />
                                                    </Box>
                                                    <Stack spacing={0}>
                                                      <Text fontSize="12px" fontWeight="700" color={unlocked ? "gray.850" : "gray.400"}>
                                                        {badge.name}
                                                      </Text>
                                                      <Text fontSize="10px" color="gray.400" lineHeight="1.2">
                                                        {badge.description}
                                                      </Text>
                                                    </Stack>
                                                  </Flex>
                                                  <Box ml="auto">
                                                    {unlocked ? (
                                                      <Tag size="sm" colorScheme="green" borderRadius="full" fontWeight="bold">
                                                        <TagLabel fontSize="9px">Tercapai</TagLabel>
                                                      </Tag>
                                                    ) : (
                                                      <Text fontSize="10px" fontWeight="bold" color="gray.500">
                                                        {badge.progress} / {badge.target}
                                                      </Text>
                                                    )}
                                                  </Box>
                                                </Flex>
                                                
                                                {!unlocked && (
                                                  <Progress
                                                    value={(badge.progress / badge.target) * 100}
                                                    size="xs"
                                                    colorScheme="yellow"
                                                    borderRadius="full"
                                                    bg="gray.100"
                                                  />
                                                )}
                                              </Box>
                                            );
                                          })}
                                        </Stack>
                                      </Box>
                                    </Collapse>
                                  </Td>
                                </Tr>
                              </React.Fragment>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </Box>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Flex justify="space-between" align="center" mt={2} px="4px">
                        <Text fontSize="11px" color="gray.500">
                          Menampilkan {users.length} dari {totalUsers} pengguna
                        </Text>
                        <Flex gap={2}>
                          <Button
                            size="xs"
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            bg="white"
                            borderWidth="1px"
                            fontWeight="bold"
                          >
                            Sebelumnya
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages}
                            bg="white"
                            borderWidth="1px"
                            fontWeight="bold"
                          >
                            Berikutnya
                          </Button>
                        </Flex>
                      </Flex>
                    )}
                  </Stack>
                )}
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
}
