"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

const PengajuanInovasi: React.FC = () => {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [user] = useAuthState(auth);
    const [data, setData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pencarian dan filter
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

    // Pagination Status
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const itemsPerPage = 5;

    const fetchData = async (page = 1) => {
        setLoading(true);
        const skipValue = (page - 1) * itemsPerPage;

        try {
            const response: any = await getInnovation({
                innovatorId: id,
                status: selectedFilter && selectedFilter !== "Semua" ? selectedFilter : undefined,
                search: searchTerm || undefined,
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

    useEffect(() => {
        if (id) {
            setCurrentPage(1);
            fetchData(1);
        }
    }, [id, selectedFilter, searchTerm]);

    const handleNextPage = async () => {
        if (hasMore) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            await fetchData(nextPage);
        }
    };

    const handlePrevPage = async () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            setCurrentPage(prevPage);
            await fetchData(prevPage);
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

export default PengajuanInovasi;
