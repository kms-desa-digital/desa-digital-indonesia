"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
    Image,
} from "@chakra-ui/react";
import { ChevronDownIcon, SearchIcon } from "@chakra-ui/icons";
import TopBar from "Components/topBar";
import Container from "Components/container";
import { auth } from "src/firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import { getInnovation } from "Services/innovationServices";
import CardNotification from "Components/card/notification/CardNotification";
import Right from "@public/icons/arrow-right.svg";
import Left from "@public/icons/arrow-left.svg";

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
    const [data, setData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial states from search params
    const initialPage = parseInt(searchParams.get("page") || "1", 10);
    const initialFilter = searchParams.get("filter") || "Semua";
    const initialSearch = searchParams.get("search") || "";

    // Pencarian dan filter
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedFilter, setSelectedFilter] = useState<string>(initialFilter);

    // Pagination Status
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [hasMore, setHasMore] = useState(false);
    const itemsPerPage = 5;

    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

    const updateUrl = (page: number, filter: string, search: string) => {
        const urlParams = new URLSearchParams();
        if (page > 1) urlParams.set("page", page.toString());
        if (filter !== "Semua") urlParams.set("filter", filter);
        if (search) urlParams.set("search", search);
        
        const queryString = urlParams.toString();
        const newPath = queryString ? `?${queryString}` : window.location.pathname;
        router.push(newPath, { scroll: false });
    };

    const fetchData = async (page = 1) => {
        setLoading(true);
        const skipValue = (page - 1) * itemsPerPage;

        try {
            const response: any = await getInnovation({
                innovatorId: id,
                status: selectedFilter && selectedFilter !== "Semua" ? selectedFilter : undefined,
                search: debouncedSearch || undefined,
            });
            
            const innovationsData = response.innovations || response.data?.innovations || [];
            
            // Apply pagination on client since API might not support limit/skip specifically, although if it does, it's better
            // Depending on the API implementation, we might need to slice
            const slicedData = innovationsData.slice(skipValue, skipValue + itemsPerPage);
            
            setData(innovationsData); // Store all data if API returns all
            setFilteredData(slicedData);
            setHasMore(innovationsData.length > skipValue + itemsPerPage);
        } catch (err) {
            console.error("Error fetching innovations from API:", err);
            setData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
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

    const handleNextPage = async () => {
        if (hasMore) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            updateUrl(nextPage, selectedFilter, searchTerm);
        }
    };

    const handlePrevPage = async () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            setCurrentPage(prevPage);
            updateUrl(prevPage, selectedFilter, searchTerm);
        }
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
                    : filteredData.map((item, idx) => (
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
                    ))}

                {/* Pagination Buttons */}
                <Flex gap={4} mt={4} mb={4} alignItems="center" alignSelf="center">
                    <Button
                        rightIcon={<Image src={Left.src} alt="back" />}
                        iconSpacing={0}
                        onClick={handlePrevPage}
                        isDisabled={currentPage === 1}
                        colorScheme="teal"
                        size="sm"
                        variant="outline"
                        borderRadius="md"
                        width="16px"
                    >
                    </Button>
                    <Text textAlign="center" fontSize="10pt">
                        Halaman {currentPage}
                    </Text>
                    <Button
                        rightIcon={<Image src={Right.src} alt="back" />}
                        iconSpacing={0}
                        onClick={handleNextPage}
                        isDisabled={!hasMore}
                        colorScheme="teal"
                        size="sm"
                        variant="outline"
                        borderRadius="md"
                        width="16px"
                    >
                    </Button>
                </Flex>
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
