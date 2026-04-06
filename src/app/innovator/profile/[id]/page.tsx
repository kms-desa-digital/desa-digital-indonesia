"use client";

import { ChevronRightIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Flex,
    Image,
    Stack,
    Tag,
    TagLabel,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import TopBar from "Components/topBar/index";
import { paths } from "Consts/path";
import { getInnovatorById, updateInnovator } from "Services/innovatorServices";
import { getInnovation } from "Services/innovationServices";
import React, { useEffect, useState } from "react";

type InnovatorData = {
    id: string;
    namaInovator: string;
    kategori: string;
    logo: string;
    header: string;
    deskripsi: string;
    whatsapp: string;
    instagram: string;
    website: string;
    status: string;
    catatanAdmin: string;
    jumlahInovasi: number;
    jumlahDesaDampingan: number;
};
import { useAuthState } from "react-firebase-hooks/auth";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { LuDot } from "react-icons/lu";
import { TbPlant2 } from "react-icons/tb";
import { useRouter, useParams } from "next/navigation";
import { auth, firestore } from "src/firebase/clientApp";
import InnovationPreview from "Components/innovator/hero/innovations";
import {
    Background,
    ContentContainer,
    Description,
    Label,
    Logo,
    Title,
} from "./_styles";


import {
    CardContainer,
    Icon,
    NavbarButton,
    Horizontal,
} from "./_styles";
import StatusCard from "Components/card/status/StatusCard";
import RejectionModal from "Components/confirmModal/RejectionModal";
import ActionDrawer from "Components/drawer/ActionDrawer";
import Loading from "Components/loading";
import { useAdminStatus } from "Hooks/useAdminStatus";




const ProfileInnovator: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [userLogin] = useAuthState(auth);
    const [innovatorData, setInnovatorData] = useState<InnovatorData | null>(null);
    const [innovations, setInnovations] = useState<any[]>([]);
    const [villages, setVillages] = useState<any[]>([]); // Add state for villages
    const [owner, setOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [openModal, setOpenModal] = useState(false);
    const [modalInput, setModalInput] = useState("");

    const { isAdmin, checking } = useAdminStatus();

    const handleVerify = async () => {
        setLoading(true);
        try {
            if (id) {
                /*
                const innovatorRef = doc(firestore, "innovators", id);
                await updateDoc(innovatorRef, {
                    status: "Terverifikasi",
                    catatanAdmin: "",
                });
                */
                await updateInnovator(id, { status: "Terverifikasi", catatanAdmin: "" });
                setInnovatorData((prev) =>
                    prev ? ({ ...prev, status: "Terverifikasi" }) : null
                );
            }
        } catch (error) {
            console.error("Error verifying user via API:", error);
            setError("Error verifying user.");
        }
        setLoading(false);
        onClose();
    };

    const toEditInovator = () => {
        router.push(paths.INNOVATOR_FORM);
    };

    const handleReject = async () => {
        setLoading(true);
        try {
            if (id) {
                /*
                const innovatorRef = doc(firestore, "innovators", id);
                await updateDoc(innovatorRef, {
                    status: "Ditolak",
                    catatanAdmin: modalInput,
                });
                */
                await updateInnovator(id, { status: "Ditolak", catatanAdmin: modalInput });
                setInnovatorData((prev) =>
                    prev ? ({
                        ...prev,
                        status: "Ditolak",
                        catatanAdmin: modalInput,
                    }) : null);
            }
        } catch (error) {
            console.error("Error rejecting user via API:", error);
            setError("Error rejecting user.");
        }
        setLoading(false);
        setOpenModal(false);
        // onClose();
    };

    // Fetch innovator data
    useEffect(() => {
        if (!id) {
            setError("Invalid innovator ID.");
            setLoading(false);
            return;
        }

        const fetchInnovatorData = async () => {
            try {
                /*
                const innovatorRef = doc(firestore, "innovators", id);
                const innovatorDoc = await getDoc(innovatorRef);
                ... Firestore Logic ...
                */
                const res: any = await getInnovatorById(id);
                const data = res?.innovator || res?.data;
                if (data) {
                    setInnovatorData(data);
                    if (userLogin?.uid) {
                        setOwner(data.id === userLogin.uid || data.userId === userLogin.uid);
                    }
                } else {
                    console.log("Innovator not found via API");
                    setError("Innovator not found.");
                }

                // Villages lookup - backend should ideally provide this or we filter locally
                // For now, I'll filter innovations which has villages mapping if available
                setVillages([]); // Placeholder for villages via API
            } catch (error) {
                console.error("Error fetching innovator data from API:", error);
                setError("Error fetching innovator data.");
            } finally {
                setLoading(false);
            }
        };

        fetchInnovatorData();
    }, [id, userLogin?.uid]);

    // Fetch innovations data
    useEffect(() => {
        const fetchInnovations = async () => {
            try {
                /*
                const innovationsRef = collection(firestore, "innovations");
                const q = query(innovationsRef, where("innovatorId", "==", id));
                const innovationsDocs = await getDocs(q);
                ... Firestore Logic ...
                */
                const res: any = await getInnovation({ innovatorId: id });
                const innovationsData = res.innovations || [];
                setInnovations(innovationsData);
            } catch (error) {
                console.error("Error fetching innovations data from API:", error);
                setError("Error fetching innovations data.");
            }
        };

        if (id) {
            fetchInnovations();
        }
    }, [id]);

    if (loading || checking) {
        return <Loading />;
    }

    if (error) {
        return <div style={{ textAlign: "center", marginTop: "40px" }}>Error: {error}</div>;
    }

    if (!innovatorData) {
        return <div style={{ textAlign: "center", marginTop: "40px" }}>Tidak ada data yang tersedia.</div>;
    }

    const truncateText = (text: string, wordLimit: number) => {
        const words = text.split(" ");
        return words.length > wordLimit
            ? words.slice(0, wordLimit).join(" ") + "..."
            : text;
    };

    return (
        <>
            <TopBar
                title={owner ? "Profile Saya" : "Detail Inovator"}
                onBack={() => router.back()}
            />
            <div style={{ position: "relative", width: "100%" }}>
                <Background src={innovatorData.header || "/images/default-header.svg"} alt="header" />
                <Logo
                    src={innovatorData.logo || "/images/default-logo.svg"}
                    alt="logo"
                    mx={16}
                    my={-40}
                />
            </div>
            <ContentContainer>
                <Stack gap={2}>
                    <Flex direction="column" align="flex-end" mb={owner ? 0 : 6}>
                        {owner && (
                            <Button
                                leftIcon={<Image src="/icons/send.svg" alt="send" />}
                                onClick={() => router.push(paths.PENGAJUAN_INOVASI_PAGE)} // Ensure this path is valid or updated
                                fontSize="12px"
                                fontWeight="500"
                                height="29px"
                                width="136px"
                                padding="6px 8px"
                                borderRadius="4px"
                            >
                                Pengajuan Inovasi
                            </Button>
                        )}
                    </Flex>
                    <Title>{innovatorData.namaInovator}</Title>
                    <Label>{innovatorData.kategori}</Label>
                    <Flex direction="row" gap={3} mt={1} alignItems="center">
                        <Icon as={FaWandMagicSparkles} color="#4B5563" />
                        <Text fontSize="12px" fontWeight="400" color="#4B5563">
                            {innovatorData.jumlahInovasi} Inovasi
                        </Text>
                        <Icon as={LuDot} color="#4B5563" />
                        <Icon as={TbPlant2} color="#4B5563" />
                        <Text fontSize="12px" fontWeight="400" color="#4B5563">
                            {innovatorData.jumlahDesaDampingan} Desa Dampingan
                        </Text>
                    </Flex>
                </Stack>
                <Flex>
                    <Stack direction="column" gap={0}>
                        <Text fontSize="16px" fontWeight="700">
                            Tentang
                        </Text>
                        <Flex flexDirection="column" alignItems="flex-start">
                            {owner && (
                                <>
                                    <Flex
                                        width="100%"
                                        flexDirection="row"
                                        alignItems="flex-start"
                                        gap="16px"
                                        paddingTop="8px"
                                    >
                                        <Box color="#4B5563" fontSize="12px" minWidth="110px">
                                            Nomor WhatsApp
                                        </Box>
                                        <Description>{innovatorData.whatsapp}</Description>
                                    </Flex>
                                    <Flex
                                        width="100%"
                                        flexDirection="row"
                                        alignItems="flex-start"
                                        gap="16px"
                                        paddingTop="12px"
                                    >
                                        <Box color="#4B5563" fontSize="12px" minWidth="110px">
                                            Link Instagram
                                        </Box>
                                        <Description>
                                            {innovatorData.instagram || "Tidak tersedia"}
                                        </Description>
                                    </Flex>
                                    <Flex
                                        width="100%"
                                        flexDirection="row"
                                        alignItems="flex-start"
                                        gap="16px"
                                        paddingTop="12px"
                                    >
                                        <Box color="#4B5563" fontSize="12px" minWidth="110px">
                                            Link Website
                                        </Box>
                                        <Description>
                                            {innovatorData.website || "Tidak tersedia"}
                                        </Description>
                                    </Flex>
                                </>
                            )}
                        </Flex>
                        <Box
                            fontSize="12px"
                            fontWeight="400"
                            color="#4B5563"
                            paddingTop="8px"
                        >
                            {isExpanded ? (
                                // Tampilkan teks lengkap jika `isExpanded` true
                                <>
                                    {innovatorData.deskripsi}
                                    {innovatorData.deskripsi.split(" ").length > 20 && ( // Tampilkan "Lebih Sedikit" jika lebih dari 20 kata
                                        <Text
                                            as="span"
                                            fontSize="12px"
                                            fontWeight="700"
                                            color="#347357"
                                            cursor="pointer"
                                            textDecoration="underline"
                                            onClick={() => setIsExpanded(!isExpanded)} // Toggle state
                                        >
                                            Lebih Sedikit
                                        </Text>
                                    )}
                                </>
                            ) : (
                                // Tampilkan teks terpotong jika `isExpanded` false
                                <>
                                    {truncateText(innovatorData.deskripsi, 20)}
                                    {innovatorData.deskripsi.split(" ").length > 20 && ( // Tampilkan "Selengkapnya" jika lebih dari 20 kata
                                        <Text
                                            as="span"
                                            fontSize="12px"
                                            fontWeight="700"
                                            color="#347357"
                                            cursor="pointer"
                                            textDecoration="underline"
                                            onClick={() => setIsExpanded(!isExpanded)} // Toggle state
                                        >
                                            {" "}
                                            Selengkapnya
                                        </Text>
                                    )}
                                </>
                            )}
                        </Box>
                    </Stack>
                </Flex>
                <div>
                    <Flex
                        justify="space-between"
                        alignItems="flex-end"
                        alignSelf="stretch"
                    >
                        <Text fontSize="16px" fontWeight="700">
                            Produk Inovasi
                        </Text>
                        <Text
                            fontSize="12px"
                            fontWeight="500"
                            color="#347357"
                            cursor="pointer"
                            textDecoration="underline"
                            onClick={() => router.push(`/innovator/products/${id}`)}
                        >
                            Lihat Semua
                        </Text>
                    </Flex>
                    <CardContainer>
                        <Horizontal>
                            {innovations.length > 0 ? (
                                <InnovationPreview innovations={innovations} innovatorId={id} />
                            ) : (
                                <Text fontSize="12px" color="#9CA3AF" textAlign="center" mt={2}>
                                    Inovator belum memiliki inovasi
                                </Text>
                            )}
                        </Horizontal>
                    </CardContainer>
                </div>
                <Flex direction="column">
                    <Flex justify="space-between" align="center">
                        <Text fontSize="16px" fontWeight="700">
                            Desa Dampingan
                        </Text>
                        <Text
                            fontSize="12px"
                            fontWeight="500"
                            color="#347357"
                            cursor="pointer"
                            textDecoration="underline"
                        // onClick={() => navigate(`/innovator/${innovatorId}/all-innovations`)}
                        >
                            Lihat Semua
                        </Text>
                    </Flex>
                    {villages.length > 0 ? (
                        villages.map((village) => (
                            <Box
                                mt={2}
                                key={village.id}
                                borderWidth="1px"
                                borderRadius="lg"
                                overflow="hidden"
                                p={2}
                                mb={16}
                                cursor="pointer"
                                backgroundColor="white"
                                borderColor="gray.200"
                                onClick={() =>
                                    router.push(`/village/profile/${village.id}`)
                                }
                            >
                                <Flex alignItems="center" mb={3}>
                                    <Image
                                        src={village.logo}
                                        alt={`${village.namaDesa} Logo`}
                                        boxSize="40px"
                                        borderRadius="full"
                                        mr={4}
                                    />
                                    <Text fontSize="12px" fontWeight="600">
                                        {village.namaDesa}
                                    </Text>
                                    <ChevronRightIcon color="gray.500" ml="auto" />
                                </Flex>
                                {/* Menambahkan Border Pembatas Di Atas "Inovasi Diterapkan" */}
                                <Box borderTop="1px" borderColor="gray.300" pt={3} mt={3} />
                                <Text fontSize="12px" fontWeight="400" mb={2} color="#9CA3AF">
                                    Inovasi diterapkan
                                </Text>
                                <Flex direction="row" gap={2} flexWrap="wrap">
                                    {Array.isArray(village.inovasiDiterapkan) &&
                                        village.inovasiDiterapkan.map((inovasi: any, index: number) => (
                                            <Tag
                                                key={index}
                                                size="sm"
                                                variant="solid"
                                                borderRadius="full"
                                                backgroundColor="#E5E7EB"
                                            >
                                                <TagLabel color="#374151">{inovasi}</TagLabel>
                                            </Tag>
                                        ))}
                                </Flex>
                            </Box>
                        ))
                    ) : (
                        <Text fontSize="12px" color="#9CA3AF" textAlign="left" mt={2}>
                            Belum memiliki desa dampingan
                        </Text>
                    )}
                </Flex>
            </ContentContainer>
            <div>
                {isAdmin ? (
                    innovatorData.status === "Terverifikasi" ||
                        innovatorData.status === "Ditolak" ? (
                        <StatusCard
                            status={innovatorData.status}
                            message={innovatorData.catatanAdmin}
                        />
                    ) : (
                        <NavbarButton>
                            <Button width="100%" fontSize="14px" onClick={onOpen}>
                                Verifikasi Permohonan Akun
                            </Button>
                        </NavbarButton>
                    )
                ) : (
                    <NavbarButton>
                        <Button
                            width="100%"
                            onClick={() => {
                                if (owner) {
                                    toEditInovator(); // Arahkan ke halaman edit inovator jika owner
                                } else {
                                    onOpen(); // Buka modal jika bukan owner
                                }
                            }}
                        >
                            {owner ? "Edit Profile" : "Kontak"}
                        </Button>
                    </NavbarButton>
                )}
            </div>
            <RejectionModal
                isOpen={openModal}
                onClose={() => setOpenModal(false)}
                onConfirm={handleReject}
                setMessage={setModalInput}
                message={modalInput}
                loading={loading}
            />
            <ActionDrawer
                isOpen={isOpen}
                onClose={onClose}
                onVerify={handleVerify}
                isAdmin={isAdmin}
                role="Inovator"
                loading={loading}
                setOpenModal={setOpenModal}
                contactData={{
                    whatsapp: innovatorData.whatsapp || "",
                    instagram: innovatorData.instagram || "https://www.instagram.com/",
                    website: innovatorData?.website || "https://www.google.com/",
                }}
            />
        </>
    );
};

export default ProfileInnovator;
