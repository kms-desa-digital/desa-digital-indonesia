"use client";

import { ChevronDownIcon, SearchIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Skeleton,
    SkeletonCircle,
    Stack,
    Text,
} from "@chakra-ui/react";
import TopBar from "Components/topBar";
import Container from "Components/container";
import CardNotification from "Components/card/notification/CardNotification";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, firestore } from "src/firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
// import {
//     doc,
//     getDoc,
//     collection,
//     getDocs,
//     orderBy,
//     query,
//     startAfter,
//     limit,
//     where,
// } from "firebase/firestore";
import { getAppliedVillages } from "Services/innovationServices";

const SkeletonCard = () => (
    <Box borderWidth="1px" borderRadius="lg" padding="4" mb={4} bg="white">
        <Flex alignItems="center" justifyContent="space-between">
            <Box width="60%">
                <Skeleton height="20px" width="80%" mb={2} />
                <Skeleton height="15px" width="50%" mb={2} />
                <Skeleton height="15px" width="100%" mb={2} />
            </Box>
            <SkeletonCircle size="10" />
        </Flex>
    </Box>
);

const DesaYangMenerapkan: React.FC = () => {
    const params = useParams();
    const inovasiId = params.id as string;

    const router = useRouter();
    const [user] = useAuthState(auth);
    const [data, setData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pencarian dan filter
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

    // Pagination Status
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const itemsPerPage = 5;

    const fetchData = async () => {
        setLoading(true);
        try {
            const res: any = await getAppliedVillages(inovasiId);
            const villages = res.villages || [];
            
            // Map MongoDB result to match UI expectation
            const formattedData = villages.map((v: any) => ({
                id: v.id,
                namaDesa: v.namaDesa,
                desaId: v.userId || v.id,
                kabupatenKota: v.kabupaten || v.kabupatenKota,
                status: "Terverifikasi", // Yang muncul di sini diasumsikan sudah terverifikasi di inovasi tersebut
                createdAt: { seconds: Date.now() / 1000 } // Dummy timestamp if not available in this view
            }));

            setData(formattedData);
            setFilteredData(formattedData);
            setHasMore(false); // New API currently doesn't support pagination, but we can implement it later if needed
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    /*
    const fetchDataFirebase = async (isNextPage = false) => {
        setLoading(true);
        // ... logic firebase
    };
    */

    useEffect(() => {
        if (user && inovasiId) fetchData();
    }, [user, inovasiId]);

    useEffect(() => {
        let filtered = [...data];
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter((item) =>
                (item.namaInovasi || "").toLowerCase().includes(lower)
            );
        }
        if (selectedFilter && selectedFilter !== "Semua") {
            filtered = filtered.filter((item) => item.status === selectedFilter);
        }
        setFilteredData(filtered);
    }, [searchTerm, selectedFilter, data]);

    const handleNextPage = async () => {
        if (hasMore) {
            setCurrentPage((prev) => prev + 1);
            await fetchData();
        }
    };

    const handlePrevPage = async () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
            await fetchData();
        }
    };

    const formatTimestamp = (timestamp: {
        seconds: number;
        nanoseconds: number;
    }) => {
        if (!timestamp?.seconds) return "Invalid Date";
        return new Date(timestamp.seconds * 1000).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <Container page>
            <TopBar
                title="Desa Yang Menerapkan Inovasi"
                onBack={() => router.back()}
            />
            <Stack padding="0 16px" gap={2}>
                <Flex gap={2} mb={2} mt={8}>
                    <InputGroup flex={1}>
                        <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                            placeholder="Cari desa di sini"
                            size="md"
                            borderRadius="full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            bg="white"
                        />
                    </InputGroup>

                    <Menu>
                        <MenuButton
                            as={Button}
                            rightIcon={<ChevronDownIcon color="#347357" />}
                            borderRadius="8px"
                            backgroundColor="white"
                            border="1px solid"
                            borderColor="gray.200"
                            textColor={"gray.600"}
                            _hover={{ bg: "gray.50" }}
                            fontSize="12px"
                            fontWeight="normal"
                        >
                            {selectedFilter || "Filter"}
                        </MenuButton>
                        <MenuList>
                            {["Semua", "Menunggu", "Terverifikasi", "Ditolak"].map(
                                (status) => (
                                    <MenuItem
                                        key={status}
                                        onClick={() =>
                                            setSelectedFilter(status === "Semua" ? null : status)
                                        }
                                    >
                                        {status}
                                    </MenuItem>
                                )
                            )}
                        </MenuList>
                    </Menu>
                </Flex>

                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    filteredData.map((item, idx) => (
                        <CardNotification
                            key={idx}
                            title={item.namaDesa || "Tanpa Nama Desa"}
                            status={item.status || "Unknown"}
                            date={formatTimestamp(item.createdAt)}
                            description={item.kabupatenKota || "Tidak ada deskripsi"}
                            onClick={() => {
                                // Navigate to Village Detail
                                router.push(`/village/detail/${item.desaId}`);
                            }}
                        />
                    ))
                )}

                {/* Pagination Buttons */}
                <Flex
                    justifyContent="space-between"
                    mt={4}
                    mb={4}
                    alignItems="center"
                >
                    <Button
                        onClick={handlePrevPage}
                        isDisabled={currentPage === 1}
                        colorScheme="teal"
                        size="sm"
                        variant="outline"
                        borderRadius="md"
                        width="120px"
                    >
                        Sebelumnya
                    </Button>
                    <Text textAlign="center" fontWeight="medium">
                        Halaman {currentPage}
                    </Text>
                    <Button
                        onClick={handleNextPage}
                        isDisabled={!hasMore}
                        colorScheme="teal"
                        size="sm"
                        variant="outline"
                        borderRadius="md"
                        width="120px"
                    >
                        Selanjutnya
                    </Button>
                </Flex>
            </Stack>
        </Container>
    );
};

export default DesaYangMenerapkan;
