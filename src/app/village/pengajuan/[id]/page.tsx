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
import { useTranslations } from "next-intl";
import TopBar from "Components/topBar";
import Container from "Components/container";
import { auth } from "src/firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
// import { auth, firestore } from "src/firebase/clientApp";
import { getClaims } from "Services/villageServices";
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

const PengajuanKlaim: React.FC = () => {
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
    const t = useTranslations("Village");

    // Pagination Status
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const itemsPerPage = 5;

    const fetchData = async (page = 1) => {
        setLoading(true);
        const skipValue = (page - 1) * itemsPerPage;

        try {
            const response: any = await getClaims(
                id,
                selectedFilter && selectedFilter !== "Semua" ? selectedFilter : undefined,
                itemsPerPage,
                skipValue,
                searchTerm || undefined
            );

            const claimsData = response.claims || response.data?.claims || [];
            const pagination = response.pagination || response.data?.pagination || {};

            setData(claimsData);
            setFilteredData(claimsData);
            setHasMore(pagination.hasMore || false);
        } catch (err) {
            console.error("Error fetching claims from API:", err);
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
    }, [id, selectedFilter, searchTerm]); // Tambah searchTerm ke dependency

    // Client side UI filtering removed in favor of server side search/filter

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
                    ml="-16px" // Netralisir padding dari Stack
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
                            {selectedFilter ? statusLabels[selectedFilter] : t("filter")}
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
                                        {statusLabels[status]}
                                    </MenuItem>
                                )
                            )}
                        </MenuList>
                    </Menu>
                </Flex>

                {loading
                    ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                    : filteredData.map((item, idx) => (
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
                        {t("pageLabel", { page: currentPage })}
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
                <Box height="40px" />
            </Stack>
        </Container>
    );
};

export default PengajuanKlaim;
