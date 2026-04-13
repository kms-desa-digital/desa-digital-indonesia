"use client";

import { ChevronRightIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Flex,
    Icon,
    Image,
    Stack,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import Send from "@public/icons/send.svg";
import RejectionModal from "Components/confirmModal/RejectionModal";
import Container from "Components/container";
import ActionDrawer from "Components/drawer/ActionDrawer";
import TopBar from "Components/topBar/index";
import { paths } from "Consts/path";
// import { DocumentData, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { getInnovatorById, updateInnovator, getAssistedVillages } from "Services/innovatorServices";
import { getInnovation } from "Services/innovationServices";
import { getUserById } from "Services/userServices";
import { DocumentData } from "firebase/firestore"; // Still used for type
import React, { useEffect, useState } from "react";
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
    Label,
    Logo,
    Title,
} from "./_styles";

const DetailInnovator: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [innovatorData, setInnovatorData] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [innovations, setInnovations] = useState<DocumentData[]>([]);
    const [villages, setVillages] = useState<DocumentData[]>([]);
    const [admin, setAdmin] = useState(false);
    const [owner, setOwner] = useState(false);
    const [userLogin] = useAuthState(auth);
    const [openModal, setOpenModal] = useState(false);
    const [modalInput, setModalInput] = useState("");

    const handleVerify = async () => {
        setLoading(true);
        try {
            if (!id) {
                setError("Invalid innovator ID.");
                setLoading(false);
                return;
            }
            /*
            const docRef = doc(firestore, "innovators", id);
            await updateDoc(docRef, {
                status: "Terverifikasi",
            });
            */
            await updateInnovator(id, { status: "Terverifikasi" });
            setInnovatorData((prev) => (prev ? { ...prev, status: "Terverifikasi" } : null));
        } catch (error) {
            console.error("Error verifying innovator via API:", error);
            setError("Error verifying innovator.");
        }
        setLoading(false);
        onClose();
    };

    const handleReject = async () => {
        try {
            if (!id) {
                setError("Invalid innovator ID.");
                setLoading(false);
                return;
            }
            /*
            const docRef = doc(firestore, "innovators", id);
            await updateDoc(docRef, {
                status: "Ditolak",
                catatanAdmin: modalInput,
            });
            */
            await updateInnovator(id, { status: "Ditolak", catatanAdmin: modalInput });
            setInnovatorData((prev) => (prev ? {
                ...prev,
                status: "Ditolak",
                catatanAdmin: modalInput,
            } : null));
        } catch (error) {
            console.error("Error rejecting innovator via API:", error);
            setError("Error rejecting innovator.");
        }
        setLoading(false);
        setOpenModal(false);
    };

    useEffect(() => {
        const fetchUser = async () => {
            if (userLogin?.uid) {
                try {
                /*
                const userRef = doc(firestore, "users", userLogin.uid);
                const userDoc = await getDoc(userRef);
                */
                    const res: any = await getUserById(userLogin.uid);
                    const userData = res.data;
                    if (userData) {
                        setAdmin(userData.role === "admin");
                        if (id === userLogin.uid) {
                            setOwner(true);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching user via API:", err);
                }
            }
        };
        fetchUser();
    }, [userLogin, id]);

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
                    if (data.userId === userLogin?.uid) {
                        router.push("/innovator/profile/" + id);
                        return;
                    }
                    setInnovatorData(data);
                } else {
                    console.log("Innovator not found via API");
                    setError("Innovator not found.");
                }
            } catch (error) {
                console.error("Error fetching innovator data from API:", error);
                setError("Error fetching innovator data.");
            } finally {
                setLoading(false);
            }
        };

        fetchInnovatorData();
    }, [id]);

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

    useEffect(() => {
        const fetchVillages = async () => {
             if (!id) return;
             try {
                 const res: any = await getAssistedVillages(id);
                 setVillages(res?.villages || res?.data || []);
             } catch (err) {
                 console.error("Error fetching villages:", err);
             }
        };
        fetchVillages();
    }, [id]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!innovatorData) {
        return <div>No data available</div>;
    }

    const truncateText = (text: string, wordLimit: number) => {
        const words = text.split(" ");
        return words.length > wordLimit
            ? words.slice(0, wordLimit).join(" ") + "..."
            : text;
    };

    return (
        <Container page>
            <TopBar title="Profil Inovator" onBack={() => router.back()} />
            <Flex position="relative">
                <Background src={innovatorData.header} alt="header" />
                <Logo src={innovatorData.logo} alt="logo" />
                <Box
                    position="absolute"
                    top="130%"
                    right="16px"
                    transform="translateY(-50%)"
                >
                    {owner && (
                        <Button
                            leftIcon={<Image src={Send.src} alt="send" />}
                            onClick={onOpen}
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
                </Box>
            </Flex>
            <ContentContainer>
                <Stack gap={3} mt={4}>
                    <Title>{innovatorData.namaInovator}</Title>
                    <Label>{innovatorData.kategori}</Label>
                    <Flex direction="row" gap={3} mt={0} alignItems="center">
                        <Icon as={FaWandMagicSparkles} color="#4B5563" />
                        <Text fontSize="12px" fontWeight="400" color="#4B5563">
                            {innovatorData.jumlahInovasi} Inovasi
                        </Text>
                        <Icon as={LuDot} color="#4B5563" />
                        <Icon as={TbPlant2} color="#4B5563" />
                        <Text fontSize="12px" fontWeight="400" color="#4B5563">
                            {villages.length > 0 ? villages.length : innovatorData.jumlahDesaDampingan} Desa Dampingan
                        </Text>
                    </Flex>
                </Stack>
                <Flex>
                    <Stack direction="column">
                        <Text fontSize="16px" fontWeight="700">
                            Tentang
                        </Text>
                        <Flex direction="column" alignItems="flex-start">
                            <Flex
                                width="100%"
                                flexDirection="row"
                                alignItems="flex-start"
                                paddingBottom="12px"
                            >
                                <Box color="#4B5563" fontSize="12px" minWidth="110px">
                                    Nomor WhatsApp
                                </Box>
                                <Text
                                    maxW="200px"
                                    whiteSpace="normal"
                                    overflowWrap="break-word"
                                    fontSize="12px"
                                >
                                    {innovatorData.whatsapp}
                                </Text>
                            </Flex>
                            <Flex
                                width="100%"
                                flexDirection="row"
                                alignItems="flex-start"
                                paddingBottom="12px"
                            >
                                <Box color="#4B5563" fontSize="12px" minWidth="110px">
                                    Link Instagram
                                </Box>
                                <Text
                                    maxW="222px"
                                    whiteSpace="normal"
                                    overflowWrap="break-word"
                                    fontSize="12px"
                                >
                                    {innovatorData.instagram}
                                </Text>
                            </Flex>
                            <Flex
                                width="100%"
                                flexDirection="row"
                                alignItems="flex-start"
                                paddingBottom="12px"
                            >
                                <Box color="#4B5563" fontSize="12px" minWidth="110px">
                                    Link Website
                                </Box>
                                <Text
                                    maxW="222px"
                                    whiteSpace="normal"
                                    overflowWrap="break-word"
                                    fontSize="12px"
                                >
                                    {innovatorData.website}
                                </Text>
                            </Flex>
                        </Flex>

                        <Flex direction="row" alignItems="center">
                            <Text fontSize="12px" fontWeight="700" color="#4B5563" mr={2}>
                                Model bisnis digital:
                            </Text>
                            <Text fontSize="12px" fontWeight="400" color="#4B5563" flex="1">
                                {innovatorData.modelBisnis}
                            </Text>
                        </Flex>

                        <Box fontSize="12px" fontWeight="400" color="#4B5563">
                            {isExpanded ? (
                                <>
                                    {innovatorData.deskripsi}
                                    {innovatorData.deskripsi.split(" ").length > 20 && (
                                        <Text
                                            as="span"
                                            fontSize="12px"
                                            fontWeight="700"
                                            color="#347357"
                                            cursor="pointer"
                                            textDecoration="underline"
                                            onClick={() => setIsExpanded(!isExpanded)}
                                        >
                                            Lebih Sedikit
                                        </Text>
                                    )}
                                </>
                            ) : (
                                <>
                                    {truncateText(innovatorData.deskripsi, 20)}
                                    {innovatorData.deskripsi.split(" ").length > 20 && (
                                        <Text
                                            as="span"
                                            fontSize="12px"
                                            fontWeight="700"
                                            color="#347357"
                                            cursor="pointer"
                                            textDecoration="underline"
                                            onClick={() => setIsExpanded(!isExpanded)}
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
                <Flex direction="column">
                    <InnovationPreview innovations={innovations} innovatorId={id} />
                </Flex>
                <Flex direction="column">
                    <Text fontSize="16px" fontWeight="700" mb={3}>
                        Desa Dampingan
                    </Text>
                    {villages.slice(0, 3).map((village) => (
                        <Box
                            key={village.id}
                            borderWidth="1px"
                            borderRadius="xl"
                            p={3}
                            mb={3}
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
                                <Text fontSize="13px" fontWeight="700">
                                    {village.namaDesa}
                                </Text>
                                <ChevronRightIcon color="gray.400" ml="auto" />
                            </Flex>
                            <Box borderTop="1px" borderColor="gray.100" pt={2} mt={2}>
                                <Text fontSize="10px" fontWeight="400" mb={1} color="#9CA3AF">
                                    Inovasi diterapkan
                                </Text>
                                <Flex direction="row" gap={1.5} flexWrap="wrap">
                                    {Array.isArray(village.inovasiDiterapkan) && village.inovasiDiterapkan.length > 0 ? (
                                        village.inovasiDiterapkan.map((inovasi: string, index: number) => (
                                            <Box
                                                key={index}
                                                px={2}
                                                py={0.5}
                                                backgroundColor="#F3F4F6"
                                                borderRadius="full"
                                                fontSize="10px"
                                                fontWeight="500"
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
                    ))}
                </Flex>
                <Button mt={-3} size="m" type="submit" onClick={onOpen}>
                    Kontak Inovator
                </Button>
                <RejectionModal
                    isOpen={openModal}
                    onClose={() => setOpenModal(false)}
                    onConfirm={handleReject}
                    message={modalInput}
                    setMessage={setModalInput}
                    loading={loading}
                />
            </ContentContainer>

            <ActionDrawer
                isOpen={isOpen}
                onClose={onClose}
                isAdmin={admin}
                onVerify={handleVerify}
                setOpenModal={setOpenModal}
                loading={loading}
                role="inovator"
                contactData={{
                    whatsapp: innovatorData.whatsapp || "",
                    instagram: innovatorData.instagram || "",
                    website: innovatorData?.website || ""
                }}
            />
            <Box height="60px" />
        </Container>
    );
};

export default DetailInnovator;
