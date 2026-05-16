"use client";

import {
    Box,
    Button,
    Flex,
    Text,
    Stack,
    Image,
    Tag,
    Badge,
    SimpleGrid,
    useDisclosure,
    Avatar,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton
} from "@chakra-ui/react";
import TopBar from "Components/topBar";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "src/firebase/clientApp";
import { getClaimById, updateVillage, updateClaim, getVillageById, deleteClaim } from "Services/villageServices";

import { getInnovationById } from "Services/innovationServices";

import {
    Container as LocalContainer,
    Title,
    NavbarButton,
    Label,
    Text1,
    Text2,
} from "../../_styles";

import Container from "Components/container";


import StatusCard from "Components/card/status/StatusCard";
import RejectionModal from "Components/confirmModal/RejectionModal";
import ActionDrawer from "Components/drawer/ActionDrawer";
import Loading from "Components/loading";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useUser } from "src/contexts/UserContext";
import Forbidden from "src/components/Forbidden";

const KlaimInovasiDetail: React.FC = () => {
    const router = useRouter();
    const [user] = useAuthState(auth);
    const params = useParams();
    const id = params.id as string;
    const [claimData, setClaimData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [modalInput, setModalInput] = useState("");
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isManual, setIsManual] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { role, uid, loading: userLoading } = useUser();
    useEffect(() => {
        setIsAdmin(role === "admin" || role === "ADMIN");
    }, [role]);

    useEffect(() => {
        if (id) {
            const fetchClaim = async () => {
                setFetchLoading(true);
                try {
                    const res: any = await getClaimById(id);
                    const data = res.data;
                    if (data) {
                        if (data.status === "Ditolak") {
                            router.replace(data.inovasiId 
                                ? `/village/klaimInovasi?inovasiId=${data.inovasiId}&editId=${id}` 
                                : `/village/klaimInovasi/manual?editId=${id}`
                            );
                            return;
                        }

                        setClaimData(data);
                        setIsManual(!data.inovasiId);

                        if (data.inovasiId) {
                            try {
                                const iRes: any = await getInnovationById(data.inovasiId);
                                if (iRes.data?.kategori || iRes.data?.category) {
                                    setClaimData((prev: any) => ({
                                        ...prev,
                                        kategoriInovasi: iRes.data.kategori || iRes.data.category
                                    }));
                                }
                            } catch (err) {
                                console.error("Error fetching innovation category:", err);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching claim from API:", error);
                } finally {
                    setFetchLoading(false);
                }
            };
            fetchClaim();
        }
    }, [id]);

    const handleVerify = async () => {
        setLoading(true);
        try {
            if (id && claimData) {
                await updateClaim(id, { status: "Terverifikasi" });
                setClaimData((prev: any) => ({ ...prev, status: "Terverifikasi" }));
                toast.success("Klaim berhasil diverifikasi!");
            }
        } catch (error) {
            console.error("Failed to verify claim via API:", error);
            toast.error("Gagal memverifikasi klaim");
        } finally {
            setLoading(false);
            onClose();
        }
    };

    const handleReject = async () => {
        if (!modalInput) {
            toast.error("Alasan penolakan wajib diisi");
            return;
        }
        setLoading(true);
        try {
            if (id) {
                await updateClaim(id, {
                    status: "Ditolak",
                    catatanAdmin: modalInput
                });
                setClaimData((prev: any) => ({
                    ...prev,
                    status: "Ditolak",
                    catatanAdmin: modalInput
                }));
                toast.success("Klaim ditolak");
            }
        } catch (error) {
            console.error("Failed to reject claim via API:", error);
            toast.error("Gagal menolak klaim");
        } finally {
            setLoading(false);
            setOpenModal(false);
            onClose();
        }
    };

    const handleDelete = async () => {
        if (confirm("Apakah Anda yakin ingin menghapus klaim ini?")) {
            setLoading(true);
            try {
                await deleteClaim(id);
                toast.success("Klaim berhasil dihapus");
                router.push(`/village/pengajuan/${claimData?.desaId || user?.uid}`);
            } catch (error) {
                console.error("Failed to delete claim:", error);
                toast.error("Gagal menghapus klaim");
            } finally {
                setLoading(false);
            }
        }
    };

    if (fetchLoading || userLoading) return <Loading />;

    const normalizedRole = (role || "").toLowerCase();
    const isAuthorized = normalizedRole === "admin" || uid === claimData?.desaId;

    // Allow viewing if authorized (Admin/Owner) OR if the claim is verified (Public View)
    const canView = isAuthorized || claimData?.status === "Terverifikasi";

    if (claimData && !canView) {
        return <Forbidden />;
    }

    if (!claimData) return null;

    const files = claimData.buktiFiles || claimData.bukti_files || {};
    const fotos = files.foto || claimData.images || [];
    const video = files.video || claimData.video || "";
    const docs = files.dokumen || claimData.dokumen || [];

    return (
        <Box bg="#F9FAFB" minH="100vh">
            <Container page>
                <TopBar
                    title="Detail Klaim Inovasi"
                    onBack={() => router.back()}
                />

                {/* Rejection Alert at the top for User */}
                {!isAdmin && claimData.status === "Ditolak" && (
                    <Box px={4}>
                        <StatusCard status="Ditolak" message={claimData.catatanAdmin} />
                    </Box>
                )}

                <Box
                    paddingBottom="40px"
                >
                    {/* Header Profile Section */}

                    <Box position="relative" w="full" h="280px">
                        <Image
                            src={claimData.fotoInovasi || (fotos.length > 0 ? fotos[0] : "/images/default-innovation.jpg")}
                            alt="Header"
                            w="full"
                            h="full"
                            objectFit="cover"
                        />

                        <Box
                            position="absolute"
                            top="0"
                            left="0"
                            w="full"
                            h="full"
                            bgGradient="linear(to-b, rgba(0,0,0,0.4), transparent)"
                        />
                    </Box>

                    <Box px={5} mt="-24px" position="relative" zIndex={1}>
                        <Box bg="white" p={5} borderRadius="10px" shadow="xl">
                            <Stack spacing={4}>
                                <Box>
                                    <Title>
                                        {claimData.namaInovasi}
                                    </Title>
                                    <Flex gap={2} wrap="wrap">
                                        <Tag
                                            colorScheme={isManual ? "blue" : "green"}
                                            variant="subtle"
                                            borderRadius="full"
                                            mt={1}
                                            px={4}
                                            py={1}
                                            fontSize="10px"
                                            fontWeight="700"
                                            bg={isManual ? "blue.50" : "green.50"}
                                            color={isManual ? "blue.600" : "green.600"}
                                        >
                                            {isManual ? "Manual" : "Klaim"}
                                        </Tag>
                                        {!isManual && claimData.kategoriInovasi && (
                                            <Tag
                                                colorScheme="gray"
                                                variant="subtle"
                                                borderRadius="full"
                                                mt={1}
                                                px={4}
                                                py={1}
                                                fontSize="10px"
                                                fontWeight="700"
                                                bg="gray.100"
                                                color="gray.600"
                                            >
                                                {claimData.kategoriInovasi}
                                            </Tag>
                                        )}
                                    </Flex>
                                </Box>

                                <Flex
                                    align="center"
                                    gap={3}
                                    p={3}
                                    borderRadius="20px"
                                    borderWidth="1px"
                                    borderColor="gray.100"
                                    bg="gray.50"
                                >
                                    <Avatar
                                        src={claimData.logoInovator || "/images/default-logo.svg"}
                                        name={claimData.namaInovator}
                                        size="sm"
                                        borderRadius="lg"
                                    />
                                    <Box>
                                        <Text fontSize="10px" color="gray.500" fontWeight="600">Inovator</Text>
                                        <Text fontSize="12px" fontWeight="800" color="gray.800">{claimData.namaInovator}</Text>
                                    </Box>
                                </Flex>

                                <Box>
                                    <Text fontWeight="700" fontSize="14px" color="gray.800" mb={2}>Deskripsi</Text>
                                    <Text
                                        fontSize="12px"
                                        color="gray.600"
                                        lineHeight="1.6"
                                        noOfLines={isExpanded ? undefined : 3}
                                    >
                                        {claimData.deskripsiInovasi || "Tidak ada deskripsi tersedia untuk klaim ini."}
                                    </Text>
                                    {(claimData.deskripsiInovasi?.length > 160) && (
                                        <Button
                                            variant="link"
                                            color="green.700"
                                            fontSize="12px"
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            mt={1}
                                            fontWeight="700"
                                            textDecoration="underline"
                                        >
                                            {isExpanded ? "Sembunyikan" : "Selengkapnya"}
                                        </Button>
                                    )}
                                </Box>

                                {!isManual && (
                                    <Button
                                        w="full"
                                        h="36px"
                                        bg="green.700"
                                        color="white"
                                        borderRadius="10px"
                                        fontSize="14px"
                                        fontWeight="700"
                                        _hover={{ bg: "green.800" }}
                                        onClick={() => router.push(`/innovation/detail/${claimData.inovasiId}`)}
                                    >
                                        Lihat Detail
                                    </Button>
                                )}
                            </Stack>
                    </Box>
                    </Box>
                    
                    {/* Evidence Section - Only shown to Authorized Users (Admin/Owner) */}
                    {isAuthorized && (
                        <Box px={8} mt={6}>
                        <Text fontWeight="700" fontSize="14px" color="gray.700" mb={2}>Dokumen Bukti Klaim</Text>

                        {/* Photo Proofs */}
                        {fotos.length > 0 && (
                            <Box mb={6}>
                                <Text fontWeight="400" fontSize="12px" color="gray.500" mb={2}>Foto Inovasi</Text>
                                <SimpleGrid columns={2} spacing={3}>
                                    {fotos.map((src: string, i: number) => (
                                        <Box
                                            key={i}
                                            borderRadius="10px"
                                            overflow="hidden"
                                            height="160px"
                                            bg="gray.100"
                                            cursor="pointer"
                                            onClick={() => setPreviewUrl(src)}
                                            transition="transform 0.2s"
                                            _hover={{ transform: "scale(1.02)" }}
                                        >
                                            <Image src={src} boxSize="full" objectFit="cover" alt={`Bukti Foto ${i + 1}`} />
                                        </Box>
                                    ))}
                                </SimpleGrid>
                            </Box>
                        )}

                        {/* Video Proof */}
                        {video && (Array.isArray(video) ? video.length > 0 : (video && video !== "" && video !== "undefined")) && (
                            <Box mb={6}>
                                <Text fontWeight="400" fontSize="12px" color="gray.500" mb={2}>Video Inovasi</Text>
                                <Box borderRadius="10px" overflow="hidden" bg="black" shadow="lg">
                                    <video src={Array.isArray(video) ? video[0] : video} controls style={{ width: "100%", maxHeight: "300px" }} />
                                </Box>
                            </Box>
                        )}

                        {/* Document Proofs */}
                        {docs.length > 0 && (
                            <Box mb={6}>
                                <Text fontWeight="400" fontSize="12px" color="gray.500" mb={2}>Dokumen Pendukung</Text>
                                <Stack spacing={3}>
                                    {docs.map((src: string, i: number) => {
                                        const fileName = (() => {
                                            try {
                                                const decoded = decodeURIComponent(src);
                                                const nameWithQuery = decoded.split('/').pop() || "";
                                                const name = nameWithQuery.split('?')[0];
                                                const rawName = name.split('/').pop() || name;

                                                // Remove timestamp prefix (e.g., 1776098288873_)
                                                if (rawName.includes('_')) {
                                                    const parts = rawName.split('_');
                                                    if (parts.length > 1 && !isNaN(Number(parts[0]))) {
                                                        return parts.slice(1).join('_');
                                                    }
                                                }
                                                return rawName;
                                            } catch (e) {
                                                return `Dokumen ${i + 1}`;
                                            }
                                        })();

                                        const fileExt = fileName.split('.').pop()?.toUpperCase() || "DOC";
                                        const isPdf = fileExt === "PDF";

                                        return (
                                            <Flex
                                                key={i}
                                                p={4}
                                                bg="white"
                                                borderRadius="10px"
                                                align="center"
                                                justify="space-between"
                                                borderWidth="1px"
                                                borderColor="gray.100"
                                                cursor="pointer"
                                                onClick={() => setPreviewUrl(src)}
                                                _hover={{ bg: "gray.50", borderColor: "green.200" }}
                                                transition="all 0.2s"
                                                overflow="hidden"
                                            >
                                                <Flex align="center" gap={2} flex={1} minW={0}>
                                                    <Box p={2} px={3} bg={isPdf ? "red.50" : "blue.50"} borderRadius="10px" flexShrink={0}>
                                                        <Text fontSize="10px" fontWeight="700" color={isPdf ? "red.500" : "blue.500"}>{fileExt.length > 4 ? "DOC" : fileExt}</Text>
                                                    </Box>
                                                    <Box flex={1} minW={0}>
                                                        <Text fontSize="12px" fontWeight="400" noOfLines={1} color="gray.700">
                                                            {fileName}
                                                        </Text>
                                                        <Text fontSize="10px" color="gray.400">Ketuk untuk melihat dokumen</Text>
                                                    </Box>
                                                </Flex>
                                            </Flex>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        )}
                        </Box>
                    )}
                </Box>


                {/* Fixed Action Bar at the Bottom */}

                {isAuthorized && (
                    <Box
                        position="fixed"
                        bottom="0"
                        left="50%"
                        transform="translateX(-50%)"
                        width="100%"
                        maxW="363px"
                        bg="white"
                        p={4}
                        pb="24px"
                        zIndex="20"
                        shadow="0px -4px 10px rgba(0,0,0,0.05)"
                        borderTopWidth="1px"
                    >
                        {isAdmin ? (
                            claimData.status === "Menunggu" ? (
                                <Button
                                    w="full"
                                    h="48px"
                                    borderRadius="lg"
                                    colorScheme="green"
                                    isLoading={loading}
                                    onClick={onOpen}
                                    fontWeight="800"
                                    fontSize="15px"
                                >
                                    Verifikasi Klaim
                                </Button>
                            ) : (
                                <StatusCard status={claimData.status} message={claimData.catatanAdmin} />
                            )
                        ) : (
                            <Stack spacing={3} w="full">
                                {/* Status Card only for Waiting status for User (Rejection is shown at top) */}
                                {claimData.status === "Menunggu" && (
                                    <StatusCard status="Menunggu" />
                                )}

                                {user?.uid === claimData.desaId && (
                                    <Button
                                        width="100%"
                                        onClick={() => router.push(isManual ? `/village/klaimInovasi/manual?editId=${id}` : `/village/klaimInovasi?inovasiId=${claimData.inovasiId}&editId=${id}`)}
                                        fontSize="16px"
                                        display={claimData.status === "Menunggu" ? "none" : "flex"}
                                        mt={2}
                                    >
                                        {claimData.status === "Ditolak" ? "Ajukan Ulang" : "Edit Klaim"}
                                    </Button>
                                )}
                            </Stack>
                        )}
                    </Box>
                )}




                <RejectionModal
                    isOpen={openModal}
                    onClose={() => setOpenModal(false)}
                    onConfirm={handleReject}
                    message={modalInput}
                    setMessage={setModalInput}
                    loading={loading}
                />
                <ActionDrawer
                    isOpen={isOpen}
                    onClose={onClose}
                    setOpenModal={setOpenModal}
                    isAdmin={isAdmin}
                    loading={loading}
                    onVerify={handleVerify}
                    role="admin"
                />

                {/* Document Preview Modal */}
                <Modal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} isCentered>
                    <ModalOverlay bg="blackAlpha.700" />
                    <ModalContent
                        maxW="90vw"
                        w="auto"
                        h="auto"
                        minH="unset"
                        maxH="90vh"
                        borderRadius="xl"
                        overflow="hidden"
                        mx="auto"
                        bg="transparent"
                        boxShadow="none"
                    >
                        <ModalHeader bg="green.700" color="white" py={3} fontSize="14px" borderTopRadius="xl">
                            <Flex justify="space-between" align="center">
                                <Text fontWeight="700">Pratinjau {previewUrl && (/\.(jpg|jpeg|png|webp|gif|svg)/i.test(previewUrl.split('?')[0]) ? "Foto" : "Dokumen")}</Text>
                                <ModalCloseButton position="static" size="sm" />
                            </Flex>
                        </ModalHeader>
                        <ModalBody p={0} bg="white" borderBottomRadius="xl" display="flex" alignItems="center" justifyContent="center" overflow="hidden">
                            {previewUrl && (
                                /\.(jpg|jpeg|png|webp|gif|svg)/i.test(previewUrl.split('?')[0]) ? (
                                    <Image 
                                        src={previewUrl} 
                                        maxH="80vh" 
                                        maxW="100%"
                                        objectFit="contain" 
                                        alt="Pratinjau Foto" 
                                    />
                                ) : (
                                    <Box w="340px" h="80vh">
                                        <iframe
                                            src={`${previewUrl}#view=FitH&toolbar=0`}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                border: "none",
                                            }}
                                            title="Pratinjau Dokumen"
                                        />
                                    </Box>
                                )
                            )}
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </Container>
        </Box>
    );
};




export default KlaimInovasiDetail;
