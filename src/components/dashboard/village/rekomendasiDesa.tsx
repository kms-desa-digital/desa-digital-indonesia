import {
    Box,
    Flex,
    Text,
    Button,
    useDisclosure,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerBody,
    DrawerCloseButton,
    Image,
    DrawerFooter,
    DrawerHeader,
    Spinner,
} from "@chakra-ui/react";
import { FaSeedling } from "react-icons/fa6";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { paths } from "Consts/path";
import { getInnovation } from "Services/innovationServices";
import { getAuth } from "firebase/auth";
import api from "Services/api";
import { getVillageInnovations } from "Services/villageServices";

const Rekomendasi = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const router = useRouter();

    const [topInnovation, setTopInnovation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendation = async () => {
            const fetchLeaderboardFallback = () => {
                getInnovation({ status: "Terverifikasi" })
                    .then((res) => {
                        const list = res.innovations || [];
                        const sorted = [...list].sort((a, b) => (b.jumlahDesa || 0) - (a.jumlahDesa || 0));
                        if (sorted.length > 0) {
                            setTopInnovation(sorted[0]);
                        }
                    })
                    .catch((err) => console.error("Error fetching top innovation (leaderboard fallback):", err))
                    .finally(() => setLoading(false));
            };

            try {
                const auth = getAuth();
                const currentUser = auth.currentUser;

                if (currentUser) {
                    const resInv: any = await getVillageInnovations(currentUser.uid);
                    const claimedInnovations = resInv.innovations || resInv.data || [];
                    
                    if (claimedInnovations.length > 0) {
                        const latestInnovation = claimedInnovations[0];
                        const innovationId = latestInnovation.id || latestInnovation._id;
                        
                        if (innovationId) {
                            try {
                                const recRes = await api.post("/recommendations", {
                                    innovation_id: innovationId,
                                    top_n: 1
                                });
                                const recList = recRes.data?.data || recRes.data || [];
                                if (recList.length > 0) {
                                    const recItem = recList[0];
                                    setTopInnovation({
                                        id: recItem.id,
                                        namaInovasi: recItem.inovasi || recItem.namaInovasi,
                                        deskripsi: recItem.deskripsi,
                                        kategori: recItem.kategori,
                                        namaInnovator: recItem.namaInnovator || "Umum",
                                        fotoInovasi: recItem.images || recItem.fotoInovasi || [],
                                        images: recItem.images || recItem.fotoInovasi || []
                                    });
                                    setLoading(false);
                                    return;
                                }
                            } catch (apiErr) {
                                console.error("Failed to fetch recommendation similarity, falling back:", apiErr);
                            }
                        }
                    }
                }
                fetchLeaderboardFallback();
            } catch (err) {
                console.error("Error in village recommendation check:", err);
                fetchLeaderboardFallback();
            }
        };

        fetchRecommendation();
    }, []);

    const getImageSrc = (item: any) => {
        if (!item) return "/images/default-logo.svg";
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
            <Flex justify="center" align="center" py={8} w="100%">
                <Spinner size="md" color="green.700" />
            </Flex>
        );
    }

    if (!topInnovation) {
        return null; // Sembunyikan jika tidak ada rekomendasi sama sekali
    }

    return (
        <>
            {/* Card Rekomendasi */}
            <Box
                mt={4}
                p={6}
                mx="15px"
                bg="white"
                backgroundImage="url('/images/background-recommendation.png')"
                backgroundSize="cover"
                backgroundPosition="center"
                boxShadow="md"
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.200"
                position="relative"
                overflow="hidden"
            >
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                    Inovasi digital terbaik untuk desamu
                </Text>
                <Flex alignItems="center" mb={1}>
                    <Box borderRadius="full" p={1} mr={2}>
                        <FaSeedling color="green" size="30px" />
                    </Box>
                    <Box>
                        <Text fontSize="md" fontWeight="bold" color="green.700">
                            {topInnovation.namaInovasi}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                            Inovator: {topInnovation.namaInnovator || "Umum"}
                        </Text>
                    </Box>
                </Flex>
                <Flex justifyContent="space-between" alignItems="center" mt={3}>
                    <Text fontSize="10px" color="gray.500">
                        Cek rekomendasi inovasi digital lainnya untuk desamu disini
                    </Text>
                    <Button
                        colorScheme="green"
                        size="xs"
                        fontSize="10px"
                        p={1}
                        borderRadius="4"
                        minW="auto"
                        h="22px"
                        w="180px"
                        onClick={onOpen}
                        boxShadow="md"
                        _hover={{ bg: "#16432D" }}
                    >
                        Lihat Rekomendasi
                    </Button>
                </Flex>
            </Box>

            {/* Drawer Rekomendasi */}
            <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
                <DrawerOverlay />
                <DrawerContent
                    sx={{
                        borderTopRadius: "3xl",
                        width: "360px",
                        h: "550px",
                        my: "auto",
                        mx: "auto",
                    }}
                >
                    <DrawerHeader
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Text fontSize="18px" fontWeight="bold" mt="4px" ml="4px">
                            Rekomendasi Inovasi
                        </Text>
                        <DrawerCloseButton mt="10px" mr="4px" />
                    </DrawerHeader>

                    <DrawerBody p={0}>
                        <Flex
                            direction="column"
                            align="center"
                            justify="center"
                            textAlign="center"
                            height="100%"
                            px={6}
                            py={8}
                        >
                            <Text fontWeight="bold" fontSize="lg">
                                {topInnovation.namaInovasi}
                            </Text>
                            <Text fontSize="sm" mb={4}>
                                dari {topInnovation.namaInnovator || "Umum"}
                            </Text>

                            <Box my={6}>
                                <Image
                                    src={getImageSrc(topInnovation)}
                                    alt={topInnovation.namaInovasi}
                                    mx="auto"
                                    boxSize="80px"
                                    borderRadius="full"
                                    objectFit="cover"
                                    fallbackSrc="/images/default-logo.svg"
                                />
                            </Box>

                            <Text fontWeight="bold" mb={1}>
                                Cocok dengan desamu!
                            </Text>
                            <Text fontSize="sm" color="gray.600" noOfLines={3}>
                                {topInnovation.deskripsi || "Saatnya desamu berinovasi! Terapkan inovasi dan buat perubahan besar di desamu."}
                            </Text>
                        </Flex>
                    </DrawerBody>

                    <DrawerFooter flexDirection="column" gap={3}>
                        <Button
                            bg="#347357"
                            color="white"
                            w="full"
                            fontSize="sm"
                            border="2px"
                            _hover={{ bg: "#2e5e4b" }}
                            onClick={() => router.push(`/innovation/detail/${topInnovation.id}`)}
                        >
                            Detail Inovasi
                        </Button>

                        <Button
                            variant="outline"
                            colorScheme="green"
                            w="full"
                            fontSize="sm"
                            mb={3}
                            onClick={() => {
                                onClose();
                                router.push(paths.VILLAGE_RECOMENDATION);
                            }}
                        >
                            Rekomendasi Lainnya
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
};

export default Rekomendasi;
