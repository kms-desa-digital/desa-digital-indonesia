"use client";

import { AddIcon, ChevronDownIcon, SearchIcon, CloseIcon } from "@chakra-ui/icons";
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
    Stack,
    Text,
} from "@chakra-ui/react";
import Container from "Components/container";
import TopBar from "Components/topBar";
import React, { useCallback, useEffect, useState, useRef, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { paths } from "Consts/path";
import { getAds } from "Services/adminServices";
import Pagination from "@/components/common/Pagination";

type Ad = {
    _id: string;
    name: string;
    minDate: string;
    maxDate: string;
    link: string;
    image?: string;
    status: string;
    createdAt: string;
};

const STATUS_OPTIONS = ["Semua", "Menunggu", "Ditampilkan", "Selesai"];

const statusBadgeStyle: Record<string, { color: string; borderColor: string; bg: string }> = {
    Menunggu:    { color: "#854D0E", borderColor: "#EAB308", bg: "#FEF9C3" },
    Ditampilkan: { color: "#16A34A", borderColor: "#16A34A", bg: "#DCFCE7" },
    Selesai:     { color: "#1D4ED8", borderColor: "#3B82F6", bg: "#EFF6FF" },
};

const formatRangeDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    } catch {
        return dateStr;
    }
};

const formatCreatedAt = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1);
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
    } catch {
        return dateStr;
    }
};

const SkeletonCard = () => (
    <Box borderWidth="1px" borderRadius="xl" padding="14px 16px" mb={2} bg="white">
        <Flex justifyContent="space-between" alignItems="center" mb={2}>
            <Skeleton height="16px" width="40%" />
            <Skeleton height="22px" width="80px" borderRadius="full" />
        </Flex>
        <Skeleton height="13px" width="60%" mb={3} />
        <Skeleton height="12px" width="25%" />
    </Box>
);

const AdminAdsPageContent: React.FC = () => {
    const t = useTranslations("Admin");
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initial states from search params
    const initialPage = parseInt(searchParams.get("page") || "1", 10);
    const initialFilter = searchParams.get("filter") || "Semua";
    const initialSearch = searchParams.get("search") || "";

    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
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

    const fetchAds = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params: any = {
                page,
                limit: itemsPerPage,
            };
            if (selectedStatus && selectedStatus !== "Semua") params.status = selectedStatus;
            if (debouncedSearch) params.search = debouncedSearch;

            const response: any = await getAds(params);
            const data = response?.data?.data || response?.data || [];
            
            setAds(Array.isArray(data) ? data : []);
            
            // Check pagination hasMore from response or length
            const pagination = response?.data?.pagination || response?.pagination;
            if (pagination && pagination.totalPages) {
                setTotalPages(pagination.totalPages);
            } else {
                setTotalPages(1);
            }
        } catch (err) {
            console.error("Error fetching ads:", err);
            setAds([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [selectedStatus, debouncedSearch]);

    // Initial load and dependency load
    useEffect(() => {
        fetchAds(currentPage);
    }, [fetchAds, currentPage]);

    // Search debounce
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
            updateUrl(1, selectedStatus, searchTerm);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleClearSearch = () => {
        setSearchTerm("");
        setCurrentPage(1);
        updateUrl(1, selectedStatus, "");
    };

    const handleFilterSelect = (status: string) => {
        setSelectedStatus(status);
        setCurrentPage(1);
        updateUrl(1, status, searchTerm);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateUrl(page, selectedStatus, searchTerm);
    };

    return (
        <Container page>
            <TopBar title={t("adsTitle")} onBack={() => router.back()} />

            <Box padding="0 16px">
                {/* Tambah Iklan Button — at the top */}
                <Button
                    leftIcon={<AddIcon boxSize="10px" />}
                    fontSize="14px"
                    fontWeight="700"
                    width="100%"
                    backgroundColor="#347357"
                    color="white"
                    _hover={{ backgroundColor: "#2a5c46" }}
                    borderRadius="lg"
                    mt={6}
                    mb={4}
                    onClick={() => router.push(paths.MAKE_ADS)}
                >
                    {t("adsAdd")}
                </Button>

                {/* Search & Filter */}
                <Flex align="center" gap={2} mb={4}>
                    <InputGroup flex={1}>
                        <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.400" boxSize="14px" />
                        </InputLeftElement>
                        <Input
                            placeholder={t("adsSearchPlaceholder")}
                            size="md"
                            bg="white"
                            borderRadius="full"
                            fontSize="13px"
                            _placeholder={{ color: "gray.400" }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                            rightIcon={<ChevronDownIcon />}
                            borderRadius="full"
                            backgroundColor="white"
                            border="1px solid"
                            borderColor="gray.200"
                            textColor="gray.600"
                            _hover={{ bg: "gray.50" }}
                            fontSize="13px"
                            fontWeight="normal"
                            px={4}
                            minW="100px"
                        >
                            {selectedStatus === "Semua" ? "Filter" : selectedStatus}
                        </MenuButton>
                        <MenuList>
                            {STATUS_OPTIONS.map((status) => (
                                <MenuItem
                                    key={status}
                                    fontSize={13}
                                    fontWeight={selectedStatus === status ? "semibold" : "normal"}
                                    color={selectedStatus === status ? "#347357" : "inherit"}
                                    onClick={() => handleFilterSelect(status)}
                                >
                                    {status}
                                </MenuItem>
                            ))}
                        </MenuList>
                    </Menu>
                </Flex>

                {/* Ads List */}
                <Stack gap={3}>
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                    ) : ads.length === 0 ? (
                        <Flex direction="column" align="center" justify="center" py={12}>
                            <Text fontSize="13px" color="gray.400" textAlign="center">
                                Belum ada iklan yang terdaftar
                            </Text>
                        </Flex>
                    ) : (
                        ads.map((ad) => {
                            const badgeStyle = statusBadgeStyle[ad.status] ?? {
                                color: "gray.600",
                                borderColor: "gray.300",
                                bg: "gray.50",
                            };
                            return (
                                <Box
                                    key={ad._id}
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                    borderRadius="xl"
                                    padding="14px 16px"
                                    bg="white"
                                    boxShadow="sm"
                                    cursor="pointer"
                                    _hover={{ boxShadow: "md", borderColor: "gray.300" }}
                                    onClick={() => router.push(`/admin/ads/detail/${ad._id}`)}
                                >
                                    {/* Row 1: Name + Badge */}
                                    <Flex justifyContent="space-between" alignItems="center" mb={1}>
                                        <Text fontWeight="700" fontSize="15px">
                                            {ad.name}
                                        </Text>
                                        <Box
                                            border="1px solid"
                                            borderColor={badgeStyle.borderColor}
                                            bg={badgeStyle.bg}
                                            color={badgeStyle.color}
                                            borderRadius="full"
                                            px={3}
                                            py="2px"
                                            fontSize="12px"
                                            fontWeight="500"
                                            whiteSpace="nowrap"
                                        >
                                            {ad.status}
                                        </Box>
                                    </Flex>

                                    {/* Row 2: Date range */}
                                    <Text fontSize="13px" color="gray.700" mb={2}>
                                        {formatRangeDate(ad.minDate)} - {formatRangeDate(ad.maxDate)}
                                    </Text>

                                    {/* Row 3: Created at */}
                                    <Text fontSize="12px" color="gray.400">
                                        {formatCreatedAt(ad.createdAt)}
                                    </Text>
                                </Box>
                            );
                        })
                    )}
                </Stack>

                {/* Pagination Controls */}
                {!loading && ads.length > 0 && totalPages > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
            </Box>
        </Container>
    );
};

const AdminAdsPage = () => {
    return (
        <Suspense fallback={<Skeleton height="100vh" />}>
            <AdminAdsPageContent />
        </Suspense>
    );
};

export default AdminAdsPage;
