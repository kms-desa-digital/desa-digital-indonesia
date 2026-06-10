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
import TopBar from "Components/topBar";
import Container from "Components/container";
import { auth } from "src/firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import { getInnovation } from "Services/innovationServices";
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

const PengajuanInovasiContent: React.FC = () => {
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
            const response: any = await getInnovation({
                innovatorId: id,
                status: selectedFilter && selectedFilter !== "Semua" ? selectedFilter : undefined,
                search: debouncedSearch || undefined,
                limit: itemsPerPage,
                skip: skipValue,
            });

            const innovationsData = response.innovations || response.data?.innovations || [];
            const pagination = response.pagination || response.data?.pagination || {};

            setFilteredData(innovationsData);
            setTotalPages(pagination.totalPages || 1);
        } catch (err) {
            console.error("Error fetching innovations from API:", err);
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

    return (
        <Container page>
            <TopBar title="Pengajuan Inovasi" onBack={() => router.back()} />
            <Stack padding="0 16px" gap={4} mt={6}>
                <Button
                    backgroundColor="#347357"
                    color="white"
                    _hover={{ backgroundColor: "#2d634b" }}
                    size="sm"
                    onClick={() => router.push("/innovation/add")}
                    borderRadius="md"
                    width="100%"
                >
                    + Tambah Inovasi
                </Button>
                <Flex gap={2} mb={2}>
                    <InputGroup flex={1}>
                        <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                            placeholder="Cari inovasi di sini"
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
                            {selectedFilter || "Filter"}
                        </MenuButton>
                        <MenuList>
                            {["Semua", "Menunggu", "Terverifikasi", "Ditolak"].map(
                                (status) => (
                                    <MenuItem
                                        key={status}
                                        fontSize={12}
                                        onClick={() => handleFilterSelect(status)}
                                    >
                                        {status}
                                    </MenuItem>
                                )
                            )}
                        </MenuList>
                    </Menu>
                </Flex>

                {loading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
                    : filteredData.length > 0
                        ? filteredData.map((item, idx) => (
                            <CardNotification
                                key={idx}
                                title={item.namaInovasi || "Tanpa Nama Inovasi"}
                                status={item.status || "Unknown"}
                                date={formatTimestamp(item.createdAt)}
                                description={item.deskripsi || "Tidak ada deskripsi"}
                                onClick={() => {
                                    if (item.status === "Terverifikasi") {
                                        router.push(`/innovation/detail/${item.id}`);
                                    } else {
                                        router.push(`/innovation/edit/${item.id}`);
                                    }
                                }}
                            />
                        ))
                        : (
                            <Box textAlign="center" py={8}>
                                <Text color="gray.500" fontSize="sm">
                                    Belum ada pengajuan inovasi
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

const PengajuanInovasi = () => {
    return (
        <Suspense fallback={<Loading />}>
            <PengajuanInovasiContent />
        </Suspense>
    );
};

export default PengajuanInovasi;
