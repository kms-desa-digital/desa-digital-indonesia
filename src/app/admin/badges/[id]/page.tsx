"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Card,
  CardBody,
  Heading,
  HStack,
  Badge as ChakraBadge,
} from "@chakra-ui/react";
import { SearchIcon, ChevronRightIcon } from "@chakra-ui/icons";
import TopBar from "Components/topBar";
import Container from "Components/container";
import Pagination from "Components/common/Pagination";
import { getBadgesAdminUsers } from "@/features/digital-nudge/services";
import {
  BADGE_STYLES,
  VILLAGE_BADGES_INFO,
  INNOVATOR_BADGES_INFO,
} from "@/features/digital-nudge/constants";

export default function AdminBadgeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params.id as string;
  const roleQuery = searchParams.get("role");

  // Determine badge config and role
  const isVillage = VILLAGE_BADGES_INFO.some((b) => b.id === id);
  const badgeInfo = isVillage
    ? VILLAGE_BADGES_INFO.find((b) => b.id === id)
    : INNOVATOR_BADGES_INFO.find((b) => b.id === id);
  const role = isVillage ? "village" : "innovator";

  const style = BADGE_STYLES[id] || {};

  // Recipients State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchRecipients = async () => {
      try {
        setLoading(true);
        const res = await getBadgesAdminUsers({
          badgeId: id,
          role: role,
          search: search,
          page: page,
          limit: 10,
        });
        setUsers(res.users || []);
        setTotalPages(res.totalPages || 1);
        setTotalUsers(res.total || 0);
      } catch (err) {
        console.error("Error loading badge recipients:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchRecipients();
    }, 300); // Debounce search request

    return () => clearTimeout(delayDebounceFn);
  }, [id, role, search, page]);

  if (!badgeInfo) {
    return (
      <Container page>
        <TopBar
          title="Gelar Tidak Ditemukan"
          onBack={() => router.push("/admin/badges")}
        />
        <Flex minH="400px" direction="column" align="center" justify="center">
          <Text fontSize="16px" fontWeight="bold" color="red.500">
            Gelar dengan ID "{id}" tidak ditemukan.
          </Text>
          <Button
            mt={4}
            colorScheme="green"
            bg="#347357"
            color="white"
            onClick={() => router.push("/admin/badges")}
          >
            Kembali ke Daftar Gelar
          </Button>
        </Flex>
      </Container>
    );
  }

  return (
    <Container page>
      <TopBar
        title={`Detail Gelar: ${badgeInfo.name}`}
        onBack={() => router.push("/admin/badges")}
      />

      <Box px="16px" pb={12} pt={4}>
        <Stack spacing={6}>
          {/* Premium Card showing Badge Details */}
          <Card
            borderRadius="20px"
            border="1px solid"
            borderColor="gray.100"
            shadow="sm"
            overflow="hidden"
          >
            <CardBody p={8} bg="white">
              <Flex
                direction="column"
                align="center"
                justify="center"
                textAlign="center"
                gap={4}
              >
                <Box
                  p={5}
                  bg={style.bg || "green.50"}
                  borderRadius="full"
                  border="1px solid"
                  borderColor={style.border || "green.200"}
                  shadow="xs"
                >
                  <Image src={style.icon} alt={badgeInfo.name} boxSize="80px" />
                </Box>
                <Stack spacing={2} align="center">
                  <HStack spacing={2} justify="center">
                    <Heading size="md" color="#1F2937">
                      {badgeInfo.name}
                    </Heading>
                    <ChakraBadge
                      colorScheme={role === "village" ? "teal" : "blue"}
                      borderRadius="full"
                      px={2.5}
                      py={0.5}
                      fontSize="10px"
                    >
                      {role === "village" ? "Desa" : "Inovator"}
                    </ChakraBadge>
                  </HStack>
                  <Text fontSize="14px" color="gray.600" maxW="600px">
                    {badgeInfo.desc}
                  </Text>
                  <HStack
                    spacing={4}
                    pt={2}
                    fontSize="12px"
                    color="gray.500"
                    justify="center"
                  >
                    <Text>
                      Total Penerima:{" "}
                      <strong>
                        {totalUsers} {role === "village" ? "Desa" : "Inovator"}
                      </strong>
                    </Text>
                  </HStack>
                </Stack>
              </Flex>
            </CardBody>
          </Card>

          {/* Recipient List Section */}
          <Stack spacing={4}>
            <Flex
              justify="space-between"
              align="center"
              flexWrap="wrap"
              gap={3}
            >
              <Heading size="sm" color="#1F2937">
                Daftar Penerima Gelar ({totalUsers})
              </Heading>

              {/* Search input */}
              <InputGroup size="md" maxW={{ base: "100%", md: "320px" }}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder={`Cari ${role === "village" ? "desa" : "inovator"}...`}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  bg="white"
                  borderRadius="12px"
                  fontSize="13px"
                  borderColor="gray.200"
                  _focus={{
                    borderColor: "#347357",
                    boxShadow: "0 0 0 1px #347357",
                  }}
                />
              </InputGroup>
            </Flex>

            {loading ? (
              <Flex minH="300px" align="center" justify="center">
                <Spinner color="#347357" size="lg" thickness="3px" />
              </Flex>
            ) : users.length === 0 ? (
              <Flex
                minH="250px"
                direction="column"
                align="center"
                justify="center"
                bg="gray.50"
                borderRadius="20px"
                p={8}
                border="1px dashed"
                borderColor="gray.200"
              >
                <Text
                  fontSize="14px"
                  color="gray.500"
                  fontWeight="semibold"
                  textAlign="center"
                >
                  Tidak ada {role === "village" ? "desa" : "inovator"} penerima
                  gelar yang ditemukan.
                </Text>
              </Flex>
            ) : (
              <Stack spacing={4}>
                <Box
                  bg="white"
                  border="1px solid"
                  borderColor="gray.100"
                  borderRadius="16px"
                  overflow="hidden"
                  shadow="xs"
                >
                  <Table variant="simple" size="md">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th fontSize="11px" color="gray.500" py={4}>
                          Nama Penerima
                        </Th>
                        <Th fontSize="11px" color="gray.500" py={4}>
                          Tipe Pengguna
                        </Th>
                        <Th fontSize="11px" color="gray.500" py={4}>
                          Gelar Aktif Saat Ini
                        </Th>
                        <Th
                          fontSize="11px"
                          color="gray.500"
                          py={4}
                          textAlign="right"
                        >
                          Aksi
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {users.map((user) => {
                        const activeStyle = user.activeBadge
                          ? BADGE_STYLES[user.activeBadge]
                          : null;
                        return (
                          <Tr
                            key={user.id}
                            _hover={{ bg: "gray.50" }}
                            transition="background 0.2s"
                          >
                            <Td py={4}>
                              <Text
                                fontSize="14px"
                                fontWeight="700"
                                color="#1F2937"
                              >
                                {user.name}
                              </Text>
                            </Td>
                            <Td py={4}>
                              <Text
                                fontSize="13px"
                                color="gray.600"
                                textTransform="capitalize"
                              >
                                {user.role === "village" ? "Desa" : "Inovator"}
                              </Text>
                            </Td>
                            <Td py={4}>
                              {activeStyle ? (
                                <Tag
                                  size="md"
                                  variant="subtle"
                                  bg={activeStyle.bg}
                                  color={activeStyle.color}
                                  fontWeight="bold"
                                  borderRadius="full"
                                >
                                  <Image
                                    src={activeStyle.icon}
                                    alt={activeStyle.name}
                                    boxSize="14px"
                                    mr={1.5}
                                  />
                                  <TagLabel fontSize="11px">
                                    {activeStyle.name}
                                  </TagLabel>
                                </Tag>
                              ) : (
                                <Text
                                  fontSize="12px"
                                  color="gray.400"
                                  fontStyle="italic"
                                >
                                  Tidak Ada
                                </Text>
                              )}
                            </Td>
                            <Td py={4} textAlign="right">
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="green"
                                borderColor="green.200"
                                color="#347357"
                                borderRadius="8px"
                                _hover={{ bg: "green.50" }}
                                onClick={() => {
                                  if (user.role === "village") {
                                    router.push(`/village/detail/${user.id}`);
                                  } else {
                                    router.push(`/innovator/detail/${user.id}`);
                                  }
                                }}
                              >
                                Lihat Profil
                              </Button>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Flex justify="space-between" align="center" mt={2} px="4px">
                    <Text fontSize="12px" color="gray.500">
                      Menampilkan {(page - 1) * 10 + 1} -{" "}
                      {Math.min(page * 10, totalUsers)} dari {totalUsers}{" "}
                      pengguna
                    </Text>
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={(p) => setPage(p)}
                    />
                  </Flex>
                )}
              </Stack>
            )}
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
