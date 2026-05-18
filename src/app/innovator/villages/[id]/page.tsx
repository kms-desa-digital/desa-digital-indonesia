"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Box, Flex, Text, Image, Spinner, Stack } from "@chakra-ui/react";
import { ChevronRightIcon, ChevronLeftIcon } from "@chakra-ui/icons";
import { getInnovatorById, getAssistedVillages } from "Services/innovatorServices";

type VillageData = {
    id: string;
    namaDesa: string;
    logo?: string;
    provinsi?: string;
    kabupaten?: string;
    kecamatan?: string;
    desa?: string;
};

const InnovatorAssistedVillages = () => {
    const t = useTranslations("Innovator");
    const tInnovation = useTranslations("Innovation");
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [innovatorName, setInnovatorName] = useState<string>("");
    const [villages, setVillages] = useState<VillageData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Innovator for title context
                const innovatorRes: any = await getInnovatorById(id);
                const innovatorData = innovatorRes?.innovator || innovatorRes?.data;
                if (innovatorData?.namaInovator) {
                    setInnovatorName(innovatorData.namaInovator);
                }

                // Fetch Villages
                const villageRes: any = await getAssistedVillages(id);
                setVillages(villageRes?.villages || villageRes?.data || []);
            } catch (err) {
                console.error("Error fetching villages data:", err);
                setError("Gagal memuat daftar desa dampingan.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    return (
        <Box width="100%" maxWidth="360px" mx="auto" minHeight="100vh" backgroundColor="#f9fafb" pb={8}>
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
                    {t("companionVillages")}
                </Text>
            </Flex>

            {/* Title */}
            <Box px={5} pt={6} pb={2}>
                <Text fontSize="16px" fontWeight="700" color="#1F2937">
                    {t("allCompanionVillages")}
                </Text>
                {innovatorName && (
                    <Text fontSize="14px" color="#6B7280" mt={1}>
                        {t("byInnovator", { name: innovatorName })}
                    </Text>
                )}
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
                ) : villages.length > 0 ? (
                    <Stack spacing={4}>
                        {villages.map((village) => (
                            <Box
                                key={village.id}
                                borderWidth="1px"
                                borderRadius="xl"
                                p={4}
                                backgroundColor="white"
                                borderColor="gray.200"
                                cursor="pointer"
                                shadow="sm"
                                _hover={{ shadow: 'md', borderColor: '#347357' }}
                                onClick={() => router.push(`/village/detail/${village.id}`)}
                            >
                                <Flex alignItems="center">
                                    <Image
                                        src={village.logo || "/images/default-logo.svg"} // Fallback image jika tidak ada logo
                                        alt={`${village.namaDesa} Logo`}
                                        boxSize="40px"
                                        borderRadius="full"
                                        objectFit="cover"
                                        mr={4}
                                        border="1px solid #E5E7EB"
                                    />
                                    <Box flex="1">
                                        <Text fontSize="13px" fontWeight="700" color="#1F2937" noOfLines={1}>
                                            {village.namaDesa}
                                        </Text>
                                        {(village.kecamatan || village.kabupaten) && (
                                            <Text fontSize="11px" color="#6B7280" mt={0.5} noOfLines={1}>
                                                {village.kecamatan && `Kec. ${village.kecamatan}${village.kabupaten ? ', ' : ''}`}
                                                {village.kabupaten && `${village.kabupaten}`}
                                            </Text>
                                        )}
                                    </Box>
                                    <ChevronRightIcon color="#9CA3AF" boxSize={5} ml="auto" />
                                </Flex>

                                {/* Perubahan: Menambahkan Inovasi Diterapkan Tags */}
                                <Box borderTop="1px" borderColor="gray.100" pt={3} mt={3}>
                                    <Text fontSize="10px" fontWeight="400" mb={1.5} color="#9CA3AF">
                                        {tInnovation("appliedInnovations")}
                                    </Text>
                                    <Flex direction="row" gap={1.5} flexWrap="wrap">
                                        {(village as any).inovasiDiterapkan && (village as any).inovasiDiterapkan.length > 0 ? (
                                            (village as any).inovasiDiterapkan.map((inovasi: any, index: number) => (
                                                <Box
                                                    key={index}
                                                    px={2}
                                                    py={0.5}
                                                    fontSize="9px"
                                                    fontWeight="600"
                                                    borderRadius="full"
                                                    backgroundColor="#F3F4F6"
                                                    color="#4B5563"
                                                >
                                                    {inovasi}
                                                </Box>
                                            ))
                                        ) : (
                                            <Text fontSize="9px" color="#D1D5DB">Data inovasi tidak tersedia</Text>
                                        )}
                                    </Flex>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                ) : (
                    <Text textAlign="center" mt={10} color="#9CA3AF" fontSize="14px">
                        {t("noCompanionVillages")}
                    </Text>
                )}
            </Box>
        </Box>
    );
};

export default InnovatorAssistedVillages;
