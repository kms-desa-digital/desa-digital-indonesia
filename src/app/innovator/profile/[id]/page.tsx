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
import { useTranslations } from "next-intl";
import TopBar from "Components/topBar/index";
import { paths } from "Consts/path";
import { getInnovatorById, updateInnovator, getAssistedVillages } from "Services/innovatorServices";
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
    const t = useTranslations("Innovation");
    const [isExpanded, setIsExpanded] = useState(false);
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [userLogin] = useAuthState(auth);
    const [innovatorData, setInnovatorData] = useState<InnovatorData | null>(null);
    const [innovations, setInnovations] = useState<any[]>([]);
    const [villages, setVillages] = useState<any[]>([]); // Add state for villages
    const [totalVillagesCount, setTotalVillagesCount] = useState<number>(0);
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
                const res: any = await getInnovatorById(id);
                const data = res?.innovator || res?.data;
                if (data) {
                    setInnovatorData(data);
                    
                    const uid = userLogin?.uid;
                    const isOwner = data.id === uid || data.userId === uid || id === uid;
                    
                    if (uid) {
                        setOwner(isOwner);
                    }
                    
                    // Redirect Owner if status is Ditolak
                    if (isOwner && data.status === "Ditolak") {
                        router.push(paths.INNOVATOR_FORM);
                        return;
                    }
                } else {
                    console.log("Innovator not found via API");
                    if (userLogin?.uid === id) {
                         router.push(paths.INNOVATOR_FORM);
                         return;
                    } else {
                         setError("Innovator not found.");
                    }
                }

                // Villages lookup via backend
                try {
                    const villageRes: any = await getAssistedVillages(id);
                    setVillages(villageRes?.villages || villageRes?.data || []);
                    setTotalVillagesCount(villageRes?.totalCount || villageRes?.villages?.length || 0);
                } catch (err) {
                    console.error("Error fetching villages:", err);
                }
            } catch (error) {
                console.error("Error fetching innovator data from API:", error);
                if (userLogin?.uid === id) {
                    router.push(paths.INNOVATOR_FORM);
                    return;
                }
                setError("Error fetching innovator data.");
            } finally {
                setLoading(false);
            }
        };

        fetchInnovatorData();
        
        // Polling for real-time status updates
        const intervalId = setInterval(async () => {
            if (!id) return;
            try {
                const res: any = await getInnovatorById(id);
                const data = res?.innovator || res?.data;
                if (data) {
                    setInnovatorData((prev) => {
                        // Prevent unnecessary re-renders if nothing changed much
                        if (prev && prev.status !== data.status) {
                            // If owner and status changes to Ditolak, redirect to form
                            const uid = userLogin?.uid;
                            const isOwner = data.id === uid || data.userId === uid || id === uid;
                            if (isOwner && data.status === "Ditolak") {
                                router.push(paths.INNOVATOR_FORM);
                            }
                            return { ...prev, ...data };
                        }
                        return prev || data;
                    });
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, [id, userLogin?.uid, router]);

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
                const res: any = await getInnovation({ innovatorId: id, status: "Terverifikasi" });
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
                                onClick={() => router.push("/innovator/pengajuan/" + id)} // Updated to point to new pengajuan inovasi page
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
                            {totalVillagesCount > 0 ? totalVillagesCount : innovatorData.jumlahDesaDampingan} Desa Dampingan
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
                            onClick={() => router.push(`/innovator/villages/${id}`)}
                        >
                            Lihat Semua
                        </Text>
                    </Flex>
                    {villages.length > 0 ? (
                        villages.slice(0, 3).map((village) => (
                             <Box
                                 mt={2}
                                 key={village.id}
                                 borderWidth="1px"
                                 borderRadius="xl"
                                 p={4}
                                 mb={4}
                                 cursor="pointer"
                                 backgroundColor="white"
                                 borderColor="gray.200"
                                 shadow="xs"
                                 _hover={{ shadow: 'sm', borderColor: '#347357' }}
                                 onClick={() =>
                                     router.push(`/village/detail/${village.id}`)
                                 }
                             >
                                 <Flex alignItems="center">
                                     <Image
                                         src={village.logo || "/images/default-logo.svg"}
                                         alt={`${village.namaDesa} Logo`}
                                         boxSize="32px"
                                         borderRadius="full"
                                         mr={3}
                                     />
                                     <Text fontSize="13px" fontWeight="700" color="#1F2937">
                                         {village.namaDesa}
                                     </Text>
                                     <ChevronRightIcon color="gray.400" ml="auto" />
                                 </Flex>
                                 <Box borderTop="1px" borderColor="gray.100" pt={2} mt={2}>
                                     <Text fontSize="10px" fontWeight="400" mb={1} color="#9CA3AF">
                                         {t("appliedInnovations")}
                                     </Text>
                                     <Flex direction="row" gap={2} flexWrap="wrap">
                                         {Array.isArray(village.inovasiDiterapkan) && village.inovasiDiterapkan.length > 0 ? (
                                             village.inovasiDiterapkan.map((inovasi: any, index: number) => (
                                                 <Box
                                                     key={index}
                                                     px={2}
                                                     py={0.5}
                                                     fontSize="10px"
                                                     fontWeight="500"
                                                     borderRadius="full"
                                                     backgroundColor="#F3F4F6"
                                                     color="#4B5563"
                                                     border="1px solid #E5E7EB"
                                                 >
                                                     {inovasi}
                                                 </Box>
                                             ))
                                         ) : (
                                             <Text fontSize="10px" color="#D1D5DB">Belum ada inovasi spesifik</Text>
                                         )}
                                     </Flex>
                                 </Box>
                             </Box>
                        ))
                    ) : (
                        <Text fontSize="12px" color="#9CA3AF" textAlign="left" mt={2}>
                            Belum memiliki desa dampingan
                        </Text>
                    )}
                </Flex>
                <Box height="100px" />
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
                    // Also check if owner and waiting, show status instead of button maybe? But owner waiting is shown on form.
                    // Wait, if owner and status is Menunggu, it shouldn't show Edit Profile.
                    owner && innovatorData.status === "Menunggu" ? (
                        <StatusCard
                            status={innovatorData.status}
                            message={innovatorData.catatanAdmin}
                        />
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
                    )
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
