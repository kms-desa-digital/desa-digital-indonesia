"use client";

import { 
    ChevronDownIcon, 
    SearchIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon 
} from "@chakra-ui/icons";
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
import CardNotification from "Components/card/notification/CardNotification";
import Container from "Components/container";
import TopBar from "Components/topBar";
import { paths } from "Consts/path";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getVillages, getClaims } from "Services/villageServices";
import { getInnovators } from "Services/innovatorServices";
import { getInnovation } from "Services/innovationServices";

const SkeletonCard = () => {
    return (
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
};

const VerificationPage: React.FC = () => {
    const router = useRouter();
    const params = useParams() as { category: string };
    const { category } = params;
    const [verifData, setVerifData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pencarian dan filter
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<string>("Semua");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [hasMore, setHasMore] = useState(true);

    const formatShortDate = (dateSource: any) => {
        if (!dateSource) return "-";
        
        let date: Date;
        if (dateSource.seconds) {
            // Firebase format
            date = new Date(dateSource.seconds * 1000);
        } else {
            // Standard Date format or string
            date = new Date(dateSource);
        }

        if (isNaN(date.getTime())) return "-";

        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear().toString().slice(2);
        return `${day}/${month}/${year}`;
    };

    const formatLocation = (lokasi: any) => {
        if (!lokasi) return "-";
        const kecamatan = lokasi.kecamatan?.label || lokasi.kecamatan || "Unknown Subdistrict";
        const kabupaten = lokasi.kabupatenKota?.label || lokasi.kabupaten || "Unknown City";
        const provinsi = lokasi.provinsi?.label || lokasi.provinsi || "Unknown Province";

        return `Kecamatan ${kecamatan}, ${kabupaten}, ${provinsi}`;
    };

    const categoryToPathMap: Record<string, string> = {
        "Verifikasi Desa": paths.VILLAGE_PROFILE_PAGE,
        "Verifikasi Inovator": paths.INNOVATOR_PROFILE_PAGE,
        "Verifikasi Tambah Inovasi": paths.DETAIL_INNOVATION_PAGE,
        "Verifikasi Klaim Inovasi": paths.DETAIL_KLAIM_INOVASI_PAGE,
    };

    const decodedCategory = decodeURIComponent(category || "");

    const handleCardClick = (id: string) => {
        const pathTemplate = categoryToPathMap[decodedCategory];
        if (pathTemplate) {
            const path = pathTemplate.replace(":id", id);
            router.push(path);
        } else {
            console.error("Unknown category or path mapping missing", decodedCategory);
        }
    };

    const statusOptions = ["Semua", "Menunggu", "Terverifikasi", "Ditolak"];

    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            let response: any;
            const apiParams: any = {
                status: selectedFilter === "Semua" ? undefined : selectedFilter,
                search: searchTerm || undefined,
                limit: itemsPerPage,
                skip: (page - 1) * itemsPerPage
            };

            const decodedCategory = decodeURIComponent(category || "");

            switch (decodedCategory) {
                case "Verifikasi Desa":
                    response = await getVillages(apiParams);
                    break;
                case "Verifikasi Inovator":
                    response = await getInnovators(apiParams);
                    break;
                case "Verifikasi Tambah Inovasi":
                    response = await getInnovation(apiParams);
                    break;
                case "Verifikasi Klaim Inovasi":
                    response = await getClaims(undefined, apiParams.status, apiParams.limit, apiParams.skip, apiParams.search);
                    break;
                default:
                    console.warn("Unknown category:", decodedCategory);
                    return [];
            }

            const data = response.villages || response.innovators || response.innovations || response.claims || response.data || [];
            
            setHasMore(data.length === itemsPerPage);
            return data;
        } catch (error) {
            console.error("Error fetching data from API:", error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Load data when category, filter, or page changes
    useEffect(() => {
        const load = async () => {
            const data = await fetchData(currentPage);
            setVerifData(data || []);
        };
        load();
    }, [category, selectedFilter, currentPage]);

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedFilter]);

    // Search optimization: delay search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            setCurrentPage(1);
            const data = await fetchData(1);
            setVerifData(data || []);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleNextPage = () => {
        if (hasMore) setCurrentPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterSelect = (status: string) => {
        setSelectedFilter(status);
    };

    return (
        <Container page>
            <TopBar title={decodeURIComponent(category || "Verification")} onBack={() => router.back()} />

            <Stack padding="0 16px" gap={2} marginBottom={4}>
                    <Flex gap={2} mb={2} mt={8}>
                        <InputGroup flex={1}>
                            <InputLeftElement pointerEvents="none">
                                <SearchIcon color="gray.400" />
                            </InputLeftElement>
                            <Input
                                placeholder="Cari di sini..."
                                size="md"
                                borderRadius="full"
                                value={searchTerm}
                                onChange={handleSearch}
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
                                {selectedFilter}
                            </MenuButton>
                            <MenuList>
                                {statusOptions.map((status) => (
                                    <MenuItem
                                        key={status}
                                        onClick={() => handleFilterSelect(status)}
                                        fontWeight={selectedFilter === status ? "bold" : "normal"}
                                    >
                                        {status}
                                    </MenuItem>
                                ))}
                            </MenuList>
                        </Menu>
                    </Flex>
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                    ) : verifData.length > 0 ? (
                        verifData.map((data, index) => {
                            const decodedCategory = decodeURIComponent(category || "");
                            const isVillageCategory = decodedCategory === "Verifikasi Desa";
                            const description = isVillageCategory
                                ? formatLocation(data.lokasi)
                                : data.deskripsi || data.kategori || "Klaim " + (data.namaInovasi || "");

                            return (
                                <CardNotification
                                    key={index}
                                    title={
                                        data.namaDesa ||
                                        data.namaInovator ||
                                        data.namaInovasi ||
                                        "No Title"
                                    }
                                    status={data.status || "Menunggu"}
                                    date={formatShortDate(data.createdAt)}
                                    description={description}
                                    onClick={() => handleCardClick(data.id || data._id)}
                                />
                            );
                        })
                    ) : (
                        <Text textAlign="center" mt={4}>
                            Tidak ada data untuk ditampilkan
                        </Text>
                    )}
                    
                    {verifData.length > 0 && (
                        <Flex
                            justifyContent="center"
                            mt={8}
                            mb={8}
                            alignItems="center"
                            gap={4}
                        >
                            <Button
                                onClick={handlePrevPage}
                                isDisabled={currentPage === 1}
                                variant="outline"
                                size="sm"
                                borderColor="gray.200"
                                color="#347357"
                                _hover={{ bg: "gray.50" }}
                            >
                                <ChevronLeftIcon />
                            </Button>
                            
                            <Text textAlign="center" fontWeight="500" fontSize="14px" color="gray.700">
                                Halaman {currentPage}
                            </Text>
                            
                            <Button
                                onClick={handleNextPage}
                                isDisabled={!hasMore}
                                variant="outline"
                                size="sm"
                                borderColor="gray.200"
                                color="#347357"
                                _hover={{ bg: "gray.50" }}
                            >
                                <ChevronRightIcon />
                            </Button>
                        </Flex>
                    )}
                </Stack>
        </Container>
    );
};

export default VerificationPage;
