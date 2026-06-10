"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
import { ChevronDownIcon, SearchIcon, CloseIcon } from "@chakra-ui/icons";
import { useTranslations } from "next-intl";
import TopBar from "Components/topBar";
import Container from "Components/container";
import { auth } from "src/firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import { getClaims } from "Services/villageServices";
import CardNotification from "Components/card/notification/CardNotification";
import Pagination from "Components/common/Pagination";

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

import { useUser } from "src/contexts/UserContext";
import Forbidden from "src/components/Forbidden";
import Loading from "Components/loading";

const PengajuanKlaimContent: React.FC = () => {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user] = useAuthState(auth);
    const { role, loading: userLoading, uid, firebaseUid } = useUser();
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial states from search params
    const initialPage = parseInt(searchParams.get("page") || "1", 10);
    const initialFilter = searchParams.get("filter") || "Semua";
    const initialSearch = searchParams.get("search") || "";

    // Pencarian dan filter
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedFilter, setSelectedFilter] = useState<string>(initialFilter);
    const t = useTranslations("Village");

    // Pagination State
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

    const fetchData = async (page = 1) => {
        setLoading(true);
        const skipValue = (page - 1) * itemsPerPage;

        try {
            const response: any = await getClaims(
                id,
                selectedFilter && selectedFilter !== "Semua" ? selectedFilter : undefined,
                itemsPerPage,
                skipValue,
                debouncedSearch || undefined
            );

            const claimsData = response.claims || response.data?.claims || [];
            const pagination = response.pagination || response.data?.pagination || {};

            setFilteredData(claimsData);
            setTotalPages(pagination.totalPages || (pagination.hasMore ? page + 1 : page));
        } catch (err) {
            console.error("Error fetching claims from API:", err);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
            updateUrl(1, selectedFilter, searchTerm);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleFilterSelect = (status: string) => {
        setSelectedFilter(status);
        setCurrentPage(1);
        updateUrl(1, status, searchTerm);
    };

    useEffect(() => {
        if (id) {
            fetchData(currentPage);
        }
    }, [id, selectedFilter, debouncedSearch, currentPage]);

    if (userLoading) {
        return <Loading />;
    }

    const normalizedRole = (role || "").toLowerCase();
    const isAuthorized = normalizedRole === "admin" || uid === id || firebaseUid === id;

    if (!isAuthorized) {
        return <Forbidden />;
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateUrl(page, selectedFilter, searchTerm);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const formatTimestamp = (dateStr: string) => {
        if (!dateStr) return "-";
        try {
            return new Date(dateStr).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch (e) {
            return dateStr;
        }
    };

    const statusLabels: Record<string, string> = {
        Semua: t("filterAll"),
        Menunggu: t("filterPending"),
        Terverifikasi: t("filterVerified"),
        Ditolak: t("filterRejected"),
    };

    return (
        <Container page>
            <TopBar title={t("claimSubmission")} onBack={() => router.back()} />
            <Stack padding="0 16px" gap={4} mt={4}>
                <Flex
                    flexDirection="column"
                    mb={2}
                    mt="-4px"
                    backgroundColor="#DCFCE7"
                    alignItems="center"
                    ml="-16px"
                    mr="-16px">
                    <Text
                        fontSize={12}
                        mb={2}
                        mt={3}
                        textAlign={"center"}
                        color={"#347357"}>
                        {t("claimNotRegistered")}
                    </Text>
                    <Button
                        mb={3}
                        fontSize={12}
                        backgroundColor="#FFFFFF"
                        color="#347357"
                        width="90%"
                        borderRadius={6}
                        border="1px solid #347357"
                        _hover={{
                            backgroundColor: "#347357",
                            color: "#FFFFFF"
                        }}
                        onClick={() => router.push("/village/klaimInovasi/manual")}>
                        {t("manualClaimHere")}
                    </Button>
                </Flex>
                <Flex gap={2} mb={2}>
                    <InputGroup flex={1}>
                        <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                            placeholder={t("searchClaimPlaceholder")}
                            size="md"
                            borderRadius="full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            bg="white"
                            fontSize="10pt"
                            pr="40px"
                        />
                        {searchTerm && (
                            <InputRightElement>
                                <Box
                                    as="button"
                                    onClick={() => setSearchTerm("")}
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
                            {selectedFilter ? statusLabels[selectedFilter] : t("filter")}
                        </MenuButton>
                        <MenuList>
                            {["Semua", "Menunggu", "Terverifikasi", "Ditolak"].map(
                                (status) => (
                                    <MenuItem
                                        key={status}
                                        fontSize={12}
                                        onClick={() => handleFilterSelect(status)}
                                    >
                                        {statusLabels[status]}
                                    </MenuItem>
                                )
                            )}
                        </MenuList>
                    </Menu>
                </Flex>

                {loading
                    ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                    : filteredData.length > 0
                        ? filteredData.map((item, idx) => (
                            <CardNotification
                                key={idx}
                                title={item.namaInovasi || "Tanpa Nama Inovasi"}
                                status={item.status || "Unknown"}
                                date={formatTimestamp(item.createdAt)}
                                description={item.deskripsiInovasi || item.deskripsi || "Tidak ada deskripsi"}
                                onClick={() =>
                                    router.push(`/village/klaimInovasi/detail/${item.id}`)
                                }
                            />
                        ))
                        : (
                            <Box textAlign="center" py={8}>
                                <Text color="gray.500" fontSize="sm">
                                    Belum ada pengajuan klaim
                                </Text>
                            </Box>
                        )}

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />

                <Box height="40px" />
            </Stack>
        </Container>
    );
};

const PengajuanKlaim = () => {
    return (
        <Suspense fallback={<Loading />}>
            <PengajuanKlaimContent />
        </Suspense>
    );
};

export default PengajuanKlaim;
