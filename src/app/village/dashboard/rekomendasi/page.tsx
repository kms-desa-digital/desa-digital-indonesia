"use client";

import { Box, Flex, Image, Text, VStack, Stack, HStack, Spinner } from "@chakra-ui/react";
import TopBar from "Components/topBar";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getInnovation } from "Services/innovationServices";

const RekomendasiInovasi = () => {
    const router = useRouter();
    const [innovations, setInnovations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getInnovation({ status: "Terverifikasi" })
            .then((res) => {
                const list = res.innovations || [];
                // Urutkan berdasarkan jumlahDesa secara descending (leaderboard)
                const sorted = [...list].sort((a, b) => (b.jumlahDesa || 0) - (a.jumlahDesa || 0));
                setInnovations(sorted);
            })
            .catch((err) => console.error("Error fetching innovations for leaderboard:", err))
            .finally(() => setLoading(false));
    }, []);

    const getImageSrc = (item: any) => {
        if (item.fotoInovasi && item.fotoInovasi.length > 0) {
            return item.fotoInovasi[0];
        }
        if (item.images && item.images.length > 0) {
            return item.images[0];
        }
        return "/images/default-logo.svg";
    };

    if (loading) {
        return (
            <Box minH="100vh">
                <TopBar title="Rekomendasi Inovasi" onBack={() => router.back()} />
                <Flex justify="center" align="center" minH="80vh">
                    <Spinner size="xl" color="green.700" thickness="4px" />
                </Flex>
            </Box>
        );
    }

    const topTen = innovations.slice(0, 10);
    const topThree = topTen.slice(0, 3);
    
    // Susun podium secara dinamis: [2nd, 1st, 3rd] jika ada datanya
    const displayThree: any[] = [];
    if (topThree.length > 1) {
        displayThree.push({ ...topThree[1], rank: 2, displayLabel: "2nd", height: 100 });
    }
    if (topThree.length > 0) {
        displayThree.push({ ...topThree[0], rank: 1, displayLabel: "1st", height: 140 });
    }
    if (topThree.length > 2) {
        displayThree.push({ ...topThree[2], rank: 3, displayLabel: "3rd", height: 70 });
    }

    // Urutkan displayThree agar urutannya [2nd, 1st, 3rd] untuk perataan bar di UI
    displayThree.sort((a, b) => {
        const order: Record<string, number> = { "2nd": 1, "1st": 2, "3rd": 3 };
        return order[a.displayLabel] - order[b.displayLabel];
    });

    const others = topTen.slice(3);

    return (
        <Box>
            <TopBar title="Rekomendasi Inovasi" onBack={() => router.back()} />

            {innovations.length === 0 ? (
                <Flex justify="center" align="center" minH="60vh" direction="column" px={4} mt="80px">
                    <Text fontSize="lg" fontWeight="semibold" color="gray.500" textAlign="center">
                        Belum ada rekomendasi inovasi terverifikasi.
                    </Text>
                </Flex>
            ) : (
                <>
                    {/* Bagian Top 3: susunan bar = 2,1,3 */}
                    <Stack pt="60px" px={4} spacing={6} mt="8">
                        <Flex justify="center" align="flex-end" gap="25px" mb="-25px">
                            {displayThree.map((item) => (
                                <VStack 
                                    key={item.id} 
                                    spacing={2}
                                    cursor="pointer"
                                    onClick={() => router.push(`/innovation/detail/${item.id}`)}
                                    _hover={{ opacity: 0.85, transform: "scale(1.02)" }}
                                    transition="all 0.2s"
                                >
                                    <Image
                                        src={getImageSrc(item)}
                                        boxSize="50px"
                                        borderRadius="full"
                                        objectFit="cover"
                                        border="2px solid"
                                        borderColor="green.600"
                                        fallbackSrc="/images/default-logo.svg"
                                    />
                                    <Text fontSize="xs" fontWeight="semibold" textAlign="center" maxW="80px" isTruncated>
                                        {item.namaInovasi}
                                    </Text>
                                    <Box
                                        w="60px"
                                        h={`${item.height}px`}
                                        bg="green.700"
                                        borderTopRadius="10px"
                                        pt="15px"
                                        display="flex"
                                        alignItems="flex-start"
                                        justifyContent="center"
                                        boxShadow="md"
                                    >
                                        <Text color="white" fontWeight="bold" fontSize="sm">
                                            {item.displayLabel}
                                        </Text>
                                    </Box>
                                </VStack>
                            ))}
                        </Flex>
                    </Stack>

                    {/* Bagian Rank 4–10 */}
                    <Box
                        bg="#D6E3DD"
                        borderTopRadius="3xl"
                        pt={6}
                        pb={10}
                        px={4}
                        w="full"
                        mt="24px"
                        minH="40vh"
                    >
                        <VStack spacing={3}>
                            {others.map((item, idx) => (
                                <HStack
                                    key={item.id}
                                    bg="white"
                                    w="full"
                                    p={3}
                                    boxShadow="sm"
                                    borderColor="gray.200"
                                    borderRadius={10}
                                    align="center"
                                    spacing={3}
                                    cursor="pointer"
                                    onClick={() => router.push(`/innovation/detail/${item.id}`)}
                                    _hover={{ bg: "gray.50", transform: "translateY(-1px)" }}
                                    transition="all 0.2s"
                                >
                                    <Text fontWeight="bold" fontSize="sm" color="gray.600" w="30px" ml={2}>
                                        {String(idx + 4).padStart(2, "0")}
                                    </Text>
                                    <Image
                                        src={getImageSrc(item)}
                                        boxSize="40px"
                                        borderRadius="full"
                                        objectFit="cover"
                                        fallbackSrc="/images/default-logo.svg"
                                    />
                                    <Box flex="1">
                                        <Text fontSize="14px" fontWeight="semibold" isTruncated maxW="200px">
                                            {item.namaInovasi}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                            Inovator: <b>{item.namaInnovator || "Umum"}</b>
                                        </Text>
                                    </Box>
                                    <HStack spacing={1} bg="green.50" px={2} py={1} borderRadius="full">
                                        <Image src="/icons/village-active.svg" w={3} h={3} alt="Village Icon" />
                                        <Text fontSize="10px" fontWeight="bold" color="green.700">
                                            {item.jumlahDesa || 0} Desa
                                        </Text>
                                    </HStack>
                                </HStack>
                            ))}
                        </VStack>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default RekomendasiInovasi;
