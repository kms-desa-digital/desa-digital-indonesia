"use client";

import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Flex,
    Image,
    Skeleton,
    Stack,
    Text,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import Container from "Components/container";
import TopBar from "Components/topBar";
import ConfModal from "Components/confirmModal/confModal";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { deleteAd, getAdById } from "Services/adminServices";

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

const statusBannerStyle: Record<
    string,
    { bg: string; color: string; text: string }
> = {
    Menunggu:    { bg: "#FEF9C3", color: "#854D0E", text: "Iklan sedang menunggu untuk ditampilkan" },
    Ditampilkan: { bg: "#DCFCE7", color: "#16A34A", text: "Iklan sedang ditampilkan" },
    Selesai:     { bg: "#EFF6FF", color: "#1D4ED8", text: "Iklan telah selesai ditampilkan" },
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

const AdDetailField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Box>
        <Text fontSize="14px" fontWeight="400" mb={2}>
            {label} <span style={{ color: "red" }}>*</span>
        </Text>
        {children}
    </Box>
);

const AdminAdDetailPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const toast = useToast();

    const [ad, setAd] = useState<Ad | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        const fetchAd = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const response: any = await getAdById(id);
                // axios interceptor returns response.data, so response = { message, data: adDoc }
                const adDoc = response?.data ?? response;
                setAd(adDoc);
            } catch (err) {
                console.error("Error fetching ad:", err);
                toast({
                    title: "Gagal memuat data iklan",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                    position: "top",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchAd();
    }, [id]);

    const handleDeleteConfirm = async () => {
        setDeleteLoading(true);
        try {
            await deleteAd(id);
            toast({
                title: "Iklan berhasil dihapus",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
            router.push("/admin/ads");
        } catch (err) {
            toast({
                title: "Gagal menghapus iklan",
                description: "Silakan coba lagi.",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
        } finally {
            setDeleteLoading(false);
            onClose();
        }
    };

    const bannerStyle = ad ? (statusBannerStyle[ad.status] ?? {
        bg: "#F3F4F6",
        color: "#374151",
        text: `Status: ${ad.status}`,
    }) : null;

    return (
        <Container page>
            <TopBar title="Detail Iklan" onBack={() => router.back()} />

            {loading ? (
                <Stack padding="0 16px" mt={4} gap={4}>
                    <Skeleton height="44px" borderRadius="md" />
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Box key={i}>
                            <Skeleton height="14px" width="35%" mb={2} />
                            <Skeleton height="42px" borderRadius="md" />
                        </Box>
                    ))}
                </Stack>
            ) : !ad ? (
                <Flex align="center" justify="center" mt={16}>
                    <Text color="gray.400" fontSize="14px">
                        Iklan tidak ditemukan
                    </Text>
                </Flex>
            ) : (
                <>
                    <Stack padding="0 16px" mt={4} gap={4} pb="100px">
                        {/* Status Banner */}
                        {bannerStyle && (
                            <Box
                                bg={bannerStyle.bg}
                                color={bannerStyle.color}
                                borderRadius="md"
                                px={4}
                                py={3}
                                fontSize="13px"
                                fontWeight="500"
                            >
                                {bannerStyle.text}
                            </Box>
                        )}

                        {/* Pemesan Iklan */}
                        <AdDetailField label="Pemesan Iklan">
                            <Box
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                                px={4}
                                py="10px"
                                bg="gray.50"
                                fontSize="14px"
                                color="gray.700"
                            >
                                {ad.name}
                            </Box>
                        </AdDetailField>

                        {/* Tanggal */}
                        <AdDetailField label="Tanggal Iklan">
                            <Flex align="center" gap={3}>
                                <Box
                                    flex={1}
                                    border="1px solid"
                                    borderColor="gray.200"
                                    borderRadius="md"
                                    px={3}
                                    py="10px"
                                    bg="gray.50"
                                    fontSize="14px"
                                    color="gray.700"
                                    textAlign="center"
                                >
                                    {formatRangeDate(ad.minDate)}
                                </Box>
                                <Text color="gray.400" fontWeight="bold">-</Text>
                                <Box
                                    flex={1}
                                    border="1px solid"
                                    borderColor="gray.200"
                                    borderRadius="md"
                                    px={3}
                                    py="10px"
                                    bg="gray.50"
                                    fontSize="14px"
                                    color="gray.700"
                                    textAlign="center"
                                >
                                    {formatRangeDate(ad.maxDate)}
                                </Box>
                            </Flex>
                        </AdDetailField>

                        {/* Gambar Iklan */}
                        <AdDetailField label="Gambar Iklan">
                            {ad.image ? (
                                <Box
                                    border="1px solid"
                                    borderColor="gray.200"
                                    borderRadius="md"
                                    overflow="hidden"
                                    maxW="200px"
                                >
                                    <Image
                                        src={ad.image}
                                        alt={ad.name}
                                        objectFit="cover"
                                        w="100%"
                                    />
                                </Box>
                            ) : (
                                <Box
                                    border="1px dashed"
                                    borderColor="gray.300"
                                    borderRadius="md"
                                    px={4}
                                    py={6}
                                    textAlign="center"
                                    color="gray.400"
                                    fontSize="13px"
                                    bg="gray.50"
                                >
                                    Tidak ada gambar
                                </Box>
                            )}
                        </AdDetailField>

                        {/* Link */}
                        <AdDetailField label="Link">
                            <Box
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                                px={4}
                                py="10px"
                                bg="gray.50"
                                fontSize="14px"
                                color="blue.600"
                                wordBreak="break-all"
                            >
                                {ad.link}
                            </Box>
                        </AdDetailField>
                    </Stack>

                    {/* Fixed Bottom Actions */}
                    <Flex
                        position="fixed"
                        bottom="0"
                        width="100%"
                        maxW="360px"
                        borderTop="1px solid rgba(0, 0, 0, 0.1)"
                        boxShadow="0px -2px 4px 0px rgba(0, 0, 0, 0.06), 0px -4px 6px 0px rgba(0, 0, 0, 0.10)"
                        bg="white"
                        gap={3}
                        px={4}
                        py={3}
                    >
                        {/* Hapus Iklan */}
                        <Button
                            flex={1}
                            leftIcon={<DeleteIcon />}
                            backgroundColor="#EF4444"
                            color="white"
                            _hover={{ backgroundColor: "#DC2626" }}
                            fontSize="14px"
                            fontWeight="700"
                            borderRadius="md"
                            onClick={onOpen}
                        >
                            Hapus Iklan
                        </Button>

                        {/* Edit Iklan */}
                        <Button
                            flex={1}
                            leftIcon={<EditIcon />}
                            backgroundColor="#347357"
                            color="white"
                            _hover={{ backgroundColor: "#2a5c46" }}
                            fontSize="14px"
                            fontWeight="700"
                            borderRadius="md"
                            onClick={() => router.push(`/admin/ads/edit/${id}`)}
                        >
                            Edit Iklan
                        </Button>
                    </Flex>
                </>
            )}

            {/* Delete Confirmation — ConfModal */}
            <ConfModal
                isOpen={isOpen}
                onClose={onClose}
                modalTitle="Hapus Iklan"
                modalBody1="Apakah anda yakin ingin menghapus iklan?"
                onYes={handleDeleteConfirm}
                isLoading={deleteLoading}
            />
        </Container>
    );
};

export default AdminAdDetailPage;
