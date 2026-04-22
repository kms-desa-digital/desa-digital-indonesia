"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Flex, Text, Image, Spinner, Stack, Input, InputGroup, InputLeftElement } from "@chakra-ui/react";
import { ChevronRightIcon, ChevronLeftIcon, SearchIcon } from "@chakra-ui/icons";
import { getAppliedVillages, getInnovationById } from "Services/innovationServices";

type VillageData = {
    id: string;
    namaDesa: string;
    logo?: string;
    provinsi?: string;
    kabupaten?: string;
    kecamatan?: string;
    desa?: string;
};

const InovasiDesaYangMenerapkan = () => {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [innovationName, setInnovationName] = useState<string>("");
    const [villages, setVillages] = useState<VillageData[]>([]);
    const [filteredVillages, setFilteredVillages] = useState<VillageData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Innovation for title context
                const innovationRes: any = await getInnovationById(id);
                const innovationData = innovationRes?.innovation || innovationRes?.data;
                if (innovationData?.namaInovasi) {
                    setInnovationName(innovationData.namaInovasi);
                }

                // Fetch Villages
                const villageRes: any = await getAppliedVillages(id);
                const fetchedVillages = villageRes?.villages || villageRes?.data || [];
                setVillages(fetchedVillages);
                setFilteredVillages(fetchedVillages);
            } catch (err) {
                console.error("Error fetching villages data:", err);
                setError("Gagal memuat daftar desa yang menerapkan.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredVillages(villages);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredVillages(
                villages.filter((v) =>
                    v.namaDesa.toLowerCase().includes(lower) ||
                    (v.kabupaten || "").toLowerCase().includes(lower)
                )
            );
        }
    }, [searchTerm, villages]);

    return (
        <Box width="100%" maxWidth="480px" mx="auto" minHeight="100vh" backgroundColor="#f9fafb" pb={8}>
            {/* Header */}
            <Flex
                alignItems="center"
                justifyContent="center"
                position="relative"
                padding="16px"
                backgroundColor="#347357"
                color="white"
            >
                <ChevronLeftIcon
                    boxSize={6}
                    position="absolute"
                    left="16px"
                    cursor="pointer"
                    onClick={() => router.back()}
                />
                <Text fontSize="16px" fontWeight="bold">
                    Desa yang Menerapkan
                </Text>
            </Flex>

            {/* Title & Search */}
            <Box px={5} pt={6} pb={2}>
                <Text fontSize="16px" fontWeight="700" color="#1F2937">
                    Desa yang Menerapkan Inovasi
                </Text>
                {innovationName && (
                    <Text fontSize="14px" color="#347357" fontWeight="600" mt={1}>
                        Inovasi: {innovationName}
                    </Text>
                )}

                <InputGroup mt={4}>
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                        placeholder="Cari desa..."
                        size="md"
                        borderRadius="xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg="white"
                        boxShadow="sm"
                        border="1px solid"
                        borderColor="gray.200"
                    />
                </InputGroup>
            </Box>

            {/* List Content */}
            <Box px={5} mt={4}>
                {loading ? (
                    <Flex justify="center" mt={10}>
                        <Spinner color="#347357" size="xl" />
                    </Flex>
                ) : error ? (
                    <Text textAlign="center" mt={10} color="red.500">
                        {error}
                    </Text>
                ) : filteredVillages.length > 0 ? (
                    <Stack spacing={4}>
                        {filteredVillages.map((village) => (
                            <Box
                                key={village.id}
                                borderWidth="1px"
                                borderRadius="xl"
                                p={3}
                                backgroundColor="white"
                                borderColor="gray.200"
                                cursor="pointer"
                                shadow="sm"
                                _hover={{ shadow: 'md', borderColor: '#347357' }}
                                onClick={() => router.push(`/village/detail/${village.id}`)}
                            >
                                <Flex alignItems="center">
                                    <Image
                                        src={village.logo || "/images/default-logo.svg"}
                                        alt={`${village.namaDesa} Logo`}
                                        boxSize="48px"
                                        borderRadius="full"
                                        objectFit="cover"
                                        mr={4}
                                        border="1px solid #E5E7EB"
                                    />
                                    <Box flex="1">
                                        <Text fontSize="14px" fontWeight="600" color="#1F2937" noOfLines={1}>
                                            {village.namaDesa}
                                        </Text>
                                        {(village.kecamatan || village.kabupaten) && (
                                            <Text fontSize="12px" color="#6B7280" mt={1} noOfLines={1}>
                                                {village.kecamatan && `Kec. ${village.kecamatan}${village.kabupaten ? ', ' : ''}`}
                                                {village.kabupaten && `${village.kabupaten}`}
                                            </Text>
                                        )}
                                    </Box>
                                    <ChevronRightIcon color="#9CA3AF" boxSize={5} ml="auto" />
                                </Flex>
                            </Box>
                        ))}
                    </Stack>
                ) : (
                    <Text textAlign="center" mt={10} color="#9CA3AF" fontSize="14px">
                        {searchTerm ? "Tidak ada desa yang cocok dengan pencarian." : "Belum ada desa yang menerapkan inovasi ini."}
                    </Text>
                )}
            </Box>
        </Box>
    );
};

export default InovasiDesaYangMenerapkan;
