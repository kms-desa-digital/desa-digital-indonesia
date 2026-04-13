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
    Avatar
} from "@chakra-ui/react";
import TopBar from "Components/topBar";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "src/firebase/clientApp";
import { getClaimById, updateVillage, updateClaim, getVillageById } from "Services/villageServices";
import { getInnovationById } from "Services/innovationServices";

import {
    Container,
    NavbarButton,
    Label,
    Text1,
    Text2,
} from "../../_styles";

import StatusCard from "Components/card/status/StatusCard";
import RejectionModal from "Components/confirmModal/RejectionModal";
import ActionDrawer from "Components/drawer/ActionDrawer";
import Loading from "Components/loading";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useUser } from "src/contexts/UserContext";

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

    const { role } = useUser();
    useEffect(() => {
        setIsAdmin(role === "admin");
    }, [role]);

    useEffect(() => {
        if (id) {
            const fetchClaim = async () => {
                setFetchLoading(true);
                try {
                    const res: any = await getClaimById(id);
                    const data = res.data;
                    if (data) {
                        setClaimData(data);
                        setIsManual(!data.inovasiId);
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
                if (claimData.desaId) {
                    const vRes: any = await getVillageById(claimData.desaId);
                    const vData = vRes.data || vRes.village;
                    const newValue = (Number(vData?.jumlahInovasiDiterapkan) || 0) + 1;
                    await updateVillage(claimData.desaId, { jumlahInovasiDiterapkan: newValue });
                }
                toast.success("Klaim berhasil diverifikasi!");
                router.push(`/village/pengajuan/${claimData.desaId || user?.uid}`);
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
                toast.success("Klaim ditolak");
                router.push(`/village/pengajuan/${claimData?.desaId || user?.uid}`);
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

    if (fetchLoading) return <Loading />;
    if (!claimData) return null;

    const files = claimData.buktiFiles || claimData.bukti_files || {};
    const fotos = files.foto || claimData.images || [];
    const video = files.video || claimData.video || "";
    const docs = files.dokumen || claimData.dokumen || [];

    return (
        <Box bg="#F9FAFB" minH="100vh">
            <TopBar
                title="Detail Klaim Inovasi"
                onBack={() => router.back()}
            />
            
            <Container style={{ paddingTop: "72px", paddingBottom: "120px" }}>
                {/* Header Profile Section */}
                <Box bg="white" p={5} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" mb={4}>
                    <Flex gap={4} align="center">
                        <Image 
                            src={claimData.logoInovator || "/images/default-logo.svg"} 
                            alt="Logo" 
                            boxSize="64px" 
                            borderRadius="lg" 
                            objectFit="cover" 
                            bg="gray.50"
                        />
                        <Box flex={1}>
                            <Text fontWeight="800" fontSize="16px" color="gray.800" noOfLines={2}>
                                {claimData.namaInovasi}
                            </Text>
                            <Text fontSize="13px" color="gray.500" fontWeight="500">
                                {claimData.namaInovator}
                            </Text>
                        </Box>
                        <Badge colorScheme={isManual ? "blue" : "green"} variant="subtle" borderRadius="md" px={2} py={0.5} fontSize="10px">
                            {isManual ? "MANUAL" : "KATALOG"}
                        </Badge>
                    </Flex>
                </Box>

                {/* Deskripsi Section */}
                <Box bg="white" p={5} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" mb={4}>
                    <Text fontWeight="700" fontSize="14px" color="gray.800" mb={2}>Deskripsi Penerapan</Text>
                    <Text fontSize="13px" color="gray.600" lineHeight="1.6">
                        {claimData.deskripsiInovasi || "Tidak ada deskripsi tersedia untuk klaim ini."}
                    </Text>
                    
                    {!isManual && (
                        <Button 
                            mt={4} 
                            w="full" 
                            variant="link" 
                            colorScheme="green" 
                            size="sm" 
                            onClick={() => router.push(`/innovation/detail/${claimData.inovasiId}`)}
                        >
                            Lihat Detail Produk di Katalog
                        </Button>
                    )}
                </Box>

                {/* Evidence Photo Section */}
                {fotos.length > 0 && (
                    <Box mb={4}>
                        <Text fontWeight="700" fontSize="14px" color="gray.800" mb={3}>Bukti Foto</Text>
                        <SimpleGrid columns={2} spacing={3}>
                            {fotos.map((src: string, i: number) => (
                                <Box 
                                    key={i} 
                                    borderRadius="lg" 
                                    overflow="hidden" 
                                    height="140px" 
                                    bg="gray.200"
                                    cursor="pointer"
                                    onClick={() => window.open(src, '_blank')}
                                >
                                    <Image src={src} boxSize="full" objectFit="cover" alt={`Bukti Foto ${i+1}`} />
                                </Box>
                            ))}
                        </SimpleGrid>
                    </Box>
                )}

                {/* Video Section */}
                {video && (
                    <Box mb={4}>
                        <Text fontWeight="700" fontSize="14px" color="gray.800" mb={3}>Dokumentasi Video</Text>
                        <Box borderRadius="lg" overflow="hidden" bg="black" shadow="sm">
                            <video src={video} controls style={{ width: "100%", maxHeight: "250px" }} />
                        </Box>
                    </Box>
                )}

                {/* Documents Section */}
                {docs.length > 0 && (
                    <Box mb={4}>
                        <Text fontWeight="700" fontSize="14px" color="gray.800" mb={3}>Dokumen Pendukung</Text>
                        <Stack spacing={3}>
                            {docs.map((src: string, i: number) => (
                                <Flex 
                                    key={i} 
                                    p={3} 
                                    bg="white" 
                                    borderRadius="lg" 
                                    align="center" 
                                    justify="space-between"
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                    cursor="pointer"
                                    onClick={() => window.open(src, '_blank')}
                                    _hover={{ bg: "gray.50" }}
                                >
                                    <Flex align="center" gap={3}>
                                        <Box p={2} bg="blue.50" borderRadius="md">
                                            <Text fontSize="16px" fontWeight="800" color="blue.500">PDF</Text>
                                        </Box>
                                        <Box>
                                            <Text fontSize="13px" fontWeight="700" noOfLines={1} color="gray.700">
                                                {decodeURIComponent(src.split('/').pop()?.split('?')[0] || `Dokumen_${i+1}.pdf`)}
                                            </Text>
                                            <Text fontSize="11px" color="gray.500">Ketuk untuk mengunduh</Text>
                                        </Box>
                                    </Flex>
                                </Flex>
                            ))}
                        </Stack>
                    </Box>
                )}
            </Container>

            {/* Fixed Action Bar at the Bottom */}
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
                    <>
                        <StatusCard status={claimData.status} message={claimData.catatanAdmin} />
                        {claimData.status === "Ditolak" && (
                            <Button
                                mt={3}
                                w="full"
                                h="48px"
                                borderRadius="lg"
                                colorScheme="green"
                                onClick={() => router.push(isManual ? `/village/klaimInovasi/manual?editId=${id}` : `/village/klaimInovasi?inovasiId=${claimData.inovasiId}&editId=${id}`)}
                                fontWeight="800"
                                fontSize="15px"
                            >
                                Perbaiki & Ajukan Kembali
                            </Button>
                        )}
                    </>
                )}
            </Box>

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
        </Box>
    );
};

export default KlaimInovasiDetail;
