"use client";

import { 
    ChevronDownIcon, 
    SearchIcon, 
    CloseIcon
} from "@chakra-ui/icons";
import {
    Box,
    Button,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
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
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getVillages, getClaims } from "Services/villageServices";
import { getInnovators } from "Services/innovatorServices";
import { getInnovation } from "Services/innovationServices";
import Pagination from "@/components/common/Pagination";

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

const VerificationPageContent: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations("Admin");
    const tc = useTranslations("Categories");
    const params = useParams() as { category: string };
    const { category } = params;
    const [verifData, setVerifData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial states from search params
    const initialPage = parseInt(searchParams.get("page") || "1", 10);
    const initialFilter = searchParams.get("filter") || "Semua";
    const initialSearch = searchParams.get("search") || "";

    // Pencarian dan filter
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedFilter, setSelectedFilter] = useState<string>(initialFilter);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(5);

    const isFirstMount = useRef(true);

    const updateUrl = (page: number, filter: string, search: string) => {
        const urlParams = new URLSearchParams();
        if (page > 1) urlParams.set("page", page.toString());
        if (filter !== "Semua") urlParams.set("filter", filter);
        if (search) urlParams.set("search", search);
        
        const queryString = urlParams.toString();
        const newPath = queryString ? `?${queryString}` : window.location.pathname;
        router.replace(newPath, { scroll: false });
    };

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

    const statusLabels: Record<string, string> = {
        Semua: t("verificationFilterAll"),
        Menunggu: t("verificationFilterPending"),
        Terverifikasi: t("verificationFilterVerified"),
        Ditolak: t("verificationFilterRejected"),
    };

    const categoryTitle = (() => {
        switch (decodedCategory) {
            case "Verifikasi Desa":
                return tc("verifDesa");
            case "Verifikasi Inovator":
                return tc("verifInno");
            case "Verifikasi Tambah Inovasi":
                return tc("verifAddInno");
            case "Verifikasi Klaim Inovasi":
                return tc("verifClaim");
            default:
                return t("verificationTitle");
        }
    })();

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
            
            const pagination = response.pagination || response.data?.pagination || response.data?.data?.pagination;
            if (pagination && pagination.totalPages) {
                setTotalPages(pagination.totalPages);
            } else {
                setTotalPages(1);
            }
            
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

    // Search optimization: delay search
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        const timeoutId = setTimeout(async () => {
            setCurrentPage(1);
            updateUrl(1, selectedFilter, searchTerm);
            const data = await fetchData(1);
            setVerifData(data || []);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchTerm("");
        setCurrentPage(1);
        updateUrl(1, selectedFilter, "");
    };

    const handleFilterSelect = (status: string) => {
        setSelectedFilter(status);
        setCurrentPage(1);
        updateUrl(1, status, searchTerm);
    };
    
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateUrl(page, selectedFilter, searchTerm);
    };

    return (
        <Container page>
            <TopBar title={categoryTitle} onBack={() => router.back()} />
            <Stack padding="0 16px" gap={2} marginBottom={4}>
                    <Flex gap={2} mb={2} mt={8}>
                        <InputGroup flex={1}>
                            <InputLeftElement pointerEvents="none">
                                <SearchIcon color="gray.400" />
                            </InputLeftElement>
                            <Input
                                placeholder={t("verificationSearchPlaceholder")}
                                size="md"
                                borderRadius="full"
                                value={searchTerm}
                                onChange={handleSearch}
                                bg="white"
                                pr={searchTerm ? "40px" : undefined}
                            />
                            {searchTerm && (
                                <InputRightElement>
                                    <Box
                                        as="button"
                                        onClick={handleClearSearch}
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        borderRadius="full"
                                        bg="#6B7280"
                                        color="white"
                                        boxSize="18px"
                                        _hover={{ bg: "gray.600" }}
                                        _active={{ bg: "gray.700" }}
                                        cursor="pointer"
                                        mr="8px"
                                    >
                                        <CloseIcon w="6px" h="6px" />
                                    </Box>
                                </InputRightElement>
                            )}
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
                                {statusLabels[selectedFilter] || selectedFilter}
                            </MenuButton>
                            <MenuList>
                                {statusOptions.map((status) => (
                                    <MenuItem
                                        key={status}
                                        onClick={() => handleFilterSelect(status)}
                                        fontWeight={selectedFilter === status ? "bold" : "normal"}
                                    >
                                        {statusLabels[status] || status}
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
                                    key={data.id || data._id || index}
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
                            {t("verificationNoData")}
                        </Text>
                    )}
                    
                    {!loading && verifData.length > 0 && totalPages > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </Stack>
        </Container>
    );
};

const VerificationPage = () => {
    return (
        <Suspense fallback={<Skeleton height="100vh" />}>
            <VerificationPageContent />
        </Suspense>
    );
};

export default VerificationPage;
