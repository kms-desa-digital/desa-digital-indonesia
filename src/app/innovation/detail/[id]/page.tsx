"use client";

import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Badge,
    Flex,
    Img,
    Stack,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { FaCircle } from "react-icons/fa";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Slider from "react-slick";
import { toast } from "react-toastify";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useUser } from "src/contexts/UserContext";

import StatusCard from "Components/card/status/StatusCard";
import RejectionModal from "Components/confirmModal/RejectionModal";
import ActionDrawer from "Components/drawer/ActionDrawer";
import TopBar from "Components/topBar";
import { paths } from "Consts/path";
// import { collection, deleteField, doc, DocumentData, documentId, getDoc, getDocs, increment, query, updateDoc, where } from "firebase/firestore";
import { auth } from "src/firebase/clientApp";
import { getInnovationById, getAppliedVillages, updateInnovation } from "Services/innovationServices";
import { getInnovatorById, updateInnovator } from "Services/innovatorServices";
import { getVillageById, getClaims, updateVillage } from "Services/villageServices";
import {
    ActionContainer,
    BenefitContainer,
    ChipContainer,
    ContentContainer,
    Description,
    Description2,
    Icon,
    Label,
    Logo,
    SubText,
    Text1,
    Text2,
    Title
} from "./_styles";



function DetailInnovation() {
    const t = useTranslations("Innovation");
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { role, isVillageVerified } = useUser();
    const [isExpanded, setIsExpanded] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [user] = useAuthState(auth);
    const [data, setData] = useState<any>({});
    const [innovatorData, setDatainnovator] = useState<any>({});
    const [village, setVillage] = useState<any[]>([]);
    const [admin, setAdmin] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [modalInput, setModalInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isClaimed, setIsClaimed] = useState(false);
    const [claimId, setClaimId] = useState("");
    const [claimStatus, setClaimStatus] = useState("");

    const getApiErrorInfo = (err: any) => {
        const status = err?.status || err?.response?.status;
        const message = err?.message || err?.data?.message || "Terjadi kesalahan";
        return { status, message };
    };

    const villageSafe = Array.isArray(village) ? village : [];
    const villageMap = new Map();

    useEffect(() => {
        setAdmin(role === "admin");
    }, [role]);

    useEffect(() => {
        if (id) {
            setLoading(true);
            getInnovationById(id)
                .then((res: any) => {
                    const innovationData = res.innovation || res.data || res;
                    if (innovationData) {
                        setData(innovationData);
                        setError("");
                    } else {
                        setError("Inovasi tidak ditemukan atau sudah dihapus");
                    }
                })
                .catch((error) => {
                    const { status, message } = getApiErrorInfo(error);
                    if (status === 404) {
                        setError("Inovasi tidak ditemukan atau sudah dihapus");
                    } else {
                        console.error("Error fetching innovation details:", { status, message });
                        setError("Gagal memuat detail inovasi");
                    }
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [id]);

    useEffect(() => {
        const innovatorId = data.innovatorId || data.userId; // Coba fallback ke userId
        if (innovatorId) {
            const fetchInnovator = async () => {
                try {
                    const res: any = await getInnovatorById(innovatorId);
                    const invData = res.innovator || res.data || res;
                    if (invData) {
                        setDatainnovator(invData);
                    }
                } catch (err) {
                    console.error("Error fetching innovator from API:", err);
                }
            }
            fetchInnovator();
        }
    }, [data.innovatorId, data.userId]);

    useEffect(() => {
        const fetchVillages = async () => {
            if (!id || !data?.id) return;
            try {
                const res: any = await getAppliedVillages(id);
                setVillage(res.villages || res.data || []);
            } catch (error) {
                const { status, message } = getApiErrorInfo(error);
                if (status === 404) {
                    setVillage([]);
                    return;
                }
                console.error("Error fetching related villages:", { status, message });
                setVillage([]);
            }
        };
        fetchVillages();
    }, [id, data?.id]);

    useEffect(() => {
        const checkClaimStatus = async () => {
            if (user?.uid && role === "village" && id) {
                try {
                    const res: any = await getClaims(user.uid, undefined, 100);
                    const claims = res.data || res.claims || res || [];
                    const found = claims.find((c: any) => (c.inovasiId === id || c.innovationId === id));
                    if (found) {
                        setIsClaimed(true);
                        setClaimId(found.id || found._id);
                        setClaimStatus(found.status);
                    } else {
                        setIsClaimed(false);
                        setClaimId("");
                        setClaimStatus("");
                    }
                } catch (err) {
                    console.error("Error checking claim status:", err);
                }
            }
        };
        checkClaimStatus();
    }, [user, id, role]);

    /*
    useEffect(() => {
        const fetchData = async () => {
            if (!id || !data.desaId) return;
            // Using Firebase for village lookup until /api/villages exists
            try {
                const villagesRef = collection(firestore, "villages");
                const q = query(villagesRef, where(documentId(), "in", data.desaId));
                const snap = await getDocs(q);
                setVillage(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching related villages:", error);
            }
        };
        fetchData();
    }, [id, data.desaId]);
    */

    type Village = {
        namaDesa: string;
        logo: string;
        userId: string;
    };

    const handleVerify = async () => {
        setLoading(true);
        try {
            if (!id) {
                setError("Innovation ID not found");
                setLoading(false);
                return;
            }
            // Update innovation status via API
            await updateInnovation(id, {
                status: "Terverifikasi",
                catatanAdmin: ""
            });
            setData({ ...data, status: "Terverifikasi" });

            // Update innovator's innovation count via API
            if (data.innovatorId) {
                const currentCount = innovatorData.jumlahInovasi || 0;
                await updateInnovator(data.innovatorId, {
                    jumlahInovasi: currentCount + 1
                });
            }

            // Update linked villages' innovation count
            if (village && village.length > 0) {
                for (const v of village) {
                    try {
                        const vRes: any = await getVillageById(v.id || v.userId);
                        const vData = vRes.data || vRes.village;
                        const newValue = (Number(vData?.jumlahInovasiDiterapkan) || 0) + 1;
                        await updateVillage(v.id || v.userId, { 
                            jumlahInovasiDiterapkan: newValue 
                        });
                    } catch (err) {
                        console.error(`Error updating count for village ${v.id}:`, err);
                    }
                }
            }

            toast.success("Inovasi berhasil diverifikasi!");
        } catch (error) {
            console.error("Error verifying innovation via API:", error);
            setError("Error verifying innovation");
        }
        setLoading(false);
        onClose();
    };

    const handleReject = async () => {
        setLoading(true);
        try {
            if (!id) {
                setError("Innovation ID not found");
                setLoading(false);
                return;
            }
            await updateInnovation(id, {
                status: "Ditolak",
                catatanAdmin: modalInput,
            });
            setData((prevData: any) => ({
                ...prevData,
                status: "Ditolak",
                catatanAdmin: modalInput,
            }));
        } catch (error) {
            console.error("Error rejecting innovation via API:", error);
            setError("Error rejecting innovation");
        }
        setLoading(false);
        onClose();
        setOpenModal(false);
    };

    const handleVillageonClick = () => {
        if (role === "village" && isVillageVerified) {
            router.push(paths.KLAIM_INOVASI_PAGE);
        } else {
            toast.warning(
                "Akun anda belum terdaftar atau terverifikasi sebagai desa",
                {
                    position: "top-center",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                }
            );
        }
    };

    if (loading) {
        return (
            <Box>
                <TopBar title={t("detailTitle")} onBack={() => router.back()} />
                <ContentContainer>
                    <Skeleton height="200px" borderRadius="12px" />
                    <Box mt="20px">
                        <Skeleton height="30px" width="70%" />
                    </Box>
                    <Box mt="10px">
                        <Skeleton count={3} />
                    </Box>
                </ContentContainer>
            </Box>
        );
    }

    const year = data.tahunDibuat ? new Date(data.tahunDibuat).getFullYear() : "N/A";

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 4000,
    };

    const owner = user && user.uid === data.innovatorId; // Check if the current user is the creator
    const truncateText = (text: string, wordLimit: number) => {
        if (!text) return "";
        const words = text.split(" ");
        return words.length > wordLimit
            ? words.slice(0, wordLimit).join(" ")
            : text;
    };


    if (error || !data || !data.namaInovasi) {
        return (
            <Box minH="100vh">
                <TopBar title={t("detailTitle")} onBack={() => router.back()} />
                <Flex minH="calc(100vh - 70px)" align="center" justify="center" px={4}>
                    <Box textAlign="center" maxW="320px">
                        <Text fontSize="16px" color="gray.500">
                            {error || "Inovasi tidak ditemukan atau sudah dihapus"}
                        </Text>
                        <Button mt={4} size="sm" onClick={() => router.push(paths.INNOVATION_PAGE)}>
                            Kembali ke Daftar Inovasi
                        </Button>
                    </Box>
                </Flex>
            </Box>
        );
    }

    const claimElement = (() => {
        if (role !== "village" || !user?.uid) return null;

        const handleClaimClick = () => {
            if (!isVillageVerified) {
                toast.warning("Akun anda belum terverifikasi sebagai desa", { position: "top-center" });
                return;
            }
            if (claimStatus === "Terverifikasi" || claimStatus === "Menunggu") {
                router.push(`/village/klaimInovasi/detail/${claimId}`);
            } else if (claimStatus === "Ditolak") {
                router.push(`/village/klaimInovasi?inovasiId=${id}&editId=${claimId}`);
            } else {
                router.push(`/village/klaimInovasi?inovasiId=${id}`);
            }
        };

        const config = (() => {
            switch (claimStatus) {
                case "Terverifikasi":
                    return { label: "Sudah Klaim", bg: "#71A686", color: "white" };
                case "Menunggu":
                    return { label: "Proses Klaim", bg: "orange.400", color: "white" };
                case "Ditolak":
                    return { label: "Ditolak", bg: "red.500", color: "white" };
                default:
                    return { label: "Klaim Inovasi", bg: "white", color: "#347357" };
            }
        })();

        return (
            <Button
                fontSize="12px"
                fontWeight="500"
                height="32px"
                bg={config.bg}
                color={config.color}
                onClick={handleClaimClick}
                _hover={{ opacity: 0.8 }}
            >
                {config.label}
            </Button>
        );
    })();

    return (
        <Box>
            <TopBar title={t("detailTitle")} onBack={() => router.back()} rightElement={claimElement} />
            {data.images && data.images.length > 1 ? (
                <Slider {...settings}>
                    {data.images.map((image: string, index: number) => (
                        <Img
                            marginTop="14px"
                            maxWidth="360px"
                            maxHeight="248px"
                            width="360px"
                            height="248px"
                            objectFit="cover"
                            objectPosition="center"
                            key={index}
                            src={image}
                            alt={`background-${index}`}
                        />
                    ))}
                </Slider>
            ) : (
                data.images &&
                data.images.length === 1 && (
                    <Img
                        marginTop="56px"
                        src={data.images[0]}
                        maxWidth="360px"
                        maxHeight="248px"
                        width="100%"
                        height="100%"
                        objectFit="cover"
                        objectPosition="center"
                        alt="background"
                    />
                )
            )}
            <ContentContainer>
                <div>
                    <Title>{data.namaInovasi}</Title>
                    <ChipContainer>
                        <Text
                            fontSize="10px"
                            fontWeight="400"
                            background={
                                data.statusInovasi === "Masih diproduksi"
                                    ? "#DCFCE7"
                                    : "#e5e7eb"
                            }
                            color={
                                data.statusInovasi === "Masih diproduksi"
                                    ? "#374151"
                                    : "#000000"
                            }
                            padding="4px 8px"
                            borderRadius="20px"
                        >
                            {data.statusInovasi}
                        </Text>
                        <Label
                            onClick={() =>
                                router.push(`/innovation/${data.kategori}`)
                            }
                        >
                            {data.kategori}
                        </Label>
                        <Description2>{t("createdYear", { year })}</Description2>
                    </ChipContainer>
                </div>
                <ActionContainer
                    onClick={() =>
                        router.push(`/innovator/profile/${data.innovatorId}`)
                    }
                >
                    <Logo src={innovatorData.logo || "/images/default-logo.svg"} alt="logo" />
                    <div>
                        <Text2>{t("innovator")}</Text2>
                        <Text1>{innovatorData.namaInovator}</Text1>
                    </div>
                </ActionContainer>
                <Stack spacing="8px">
                    <div>
                        <Text fontSize="16px" fontWeight="700" lineHeight="140%" mb="12px">
                            {t("description")}
                        </Text>
                        <Box fontSize="12px" fontWeight="400" color="#4B5563">
                            {isExpanded ? (
                                // Tampilkan teks lengkap jika `isExpanded` true
                                <>
                                    {data.deskripsi}
                                    {data.deskripsi.split(" ").length > 20 && (
                                        <Text
                                            as="span"
                                            fontSize="12px"
                                            fontWeight="700"
                                            color="#347357"
                                            cursor="pointer"
                                            textDecoration="underline"
                                            onClick={() => setIsExpanded(!isExpanded)} // Toggle state
                                        >
                                            {t("readLess")}
                                        </Text>
                                    )}
                                </>
                            ) : (
                                <>
                                    {truncateText(data.deskripsi || "", 20)}
                                    {data.deskripsi &&
                                        data.deskripsi.split(" ").length > 20 && ( // Tampilkan "Selengkapnya" jika lebih dari 20 kata
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
                                                {t("readMore")}
                                            </Text>
                                        )}
                                </>
                            )}
                        </Box>
                    </div>

                    <div>
                        <Text fontSize="12px" fontWeight="600">
                            {t("businessModel")}
                        </Text>
                        <Text fontSize="12px" fontWeight="400" color="#4B5563">
                            {data.modelBisnis?.join(", ")}
                        </Text>
                    </div>

                    <div>
                        <Text fontSize="12px" fontWeight="600">
                            {t("appliedVillages")}
                        </Text>
                        <Text fontSize="12px" fontWeight="400" color="#4B5563">
                            {data.inputDesaMenerapkan}
                        </Text>
                    </div>
                    <div>
                        <Text fontSize="12px" fontWeight="600">
                            {t("priceRange")}
                        </Text>
                        <Text fontSize="12px" fontWeight="400" color="#4B5563">
                            {data.hargaMinimal
                                ? `Rp. ${new Intl.NumberFormat("id-ID").format(
                                    data.hargaMinimal
                                )}${data.hargaMaksimal
                                    ? ` - Rp. ${new Intl.NumberFormat("id-ID").format(
                                        data.hargaMaksimal
                                    )}`
                                    : ""
                                }`
                                : "Harga tidak tersedia"}
                        </Text>
                    </div>
                </Stack>

                <div>
                    <Text fontSize="16px" fontWeight="700" lineHeight="140%">
                        {t("benefits")}
                    </Text>
                    <Flex>
                        <Accordion width="360px" allowMultiple>
                            {Array.isArray(data.manfaat) && data.manfaat.length > 0 ? (
                                data.manfaat.map(
                                    (
                                        item: any,
                                        index: number
                                    ) => (
                                        <Flex
                                            key={index}
                                            mt="12px"
                                            border="1px solid var(--Gray-30, #E5E7EB);"
                                            borderRadius="8px"
                                        >
                                            <AccordionItem width="100%" border="none">
                                                <h2>
                                                    <AccordionButton border="none">
                                                        <Flex
                                                            w="100%"
                                                            alignItems="center"
                                                            justifyContent="space-between"
                                                        >
                                                            <Flex
                                                                alignItems="center"
                                                                w="auto"
                                                                flexWrap="nowrap"
                                                                gap="12px"
                                                            >
                                                                <FaCircle
                                                                    size={12}
                                                                    color="#568A73"
                                                                    style={{
                                                                        overflow: "visible",
                                                                    }}
                                                                />
                                                                <Text
                                                                    fontSize="12px"
                                                                    fontWeight="700"
                                                                    textAlign="start"
                                                                >
                                                                    {item.judul}
                                                                </Text>
                                                            </Flex>
                                                            <AccordionIcon ml={8} color="#568A73" />
                                                        </Flex>
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4}>
                                                    <Description>{item.deskripsi}</Description>
                                                </AccordionPanel>
                                            </AccordionItem>
                                        </Flex>
                                    )
                                )
                            ) : (
                                <Text fontSize="12px" fontWeight="400">
                                    Tidak ada data manfaat.
                                </Text>
                            )}
                        </Accordion>
                    </Flex>
                </div>

                <Flex direction="column" mb={14}>
                    <Text fontSize="16px" fontWeight="700" lineHeight="140%" mb="12px">
                        {t("preparation")}
                    </Text>
                    {Array.isArray(data.infrastruktur) &&
                        data.infrastruktur.length > 0 ? (
                        data.infrastruktur.map((item: any, index: number) => (
                            <BenefitContainer key={index}>
                                <Icon src="/icons/check-circle.svg" alt="check" />
                                <Description>{item}</Description>
                            </BenefitContainer>
                        ))
                    ) : (
                        <Description>No specific needs listed.</Description>
                    )}
                </Flex>
                <Flex flexDirection="column" mb='20px' gap="8px">
                    <Flex
                        justifyContent="space-between"
                        alignItems="flex-end"
                        align-self="stretch"
                    >
                        <SubText>{t("appliedVillages")}</SubText>
                        <Text
                            onClick={() =>
                                router.push(`/innovation/desaYangMenerapkan/${data.id}`)
                            }
                            cursor="pointer"
                            color="var(--Primary, #347357)"
                            fontSize="12px"
                            fontWeight="500"
                            textDecorationLine="underline"
                            paddingBottom="12px"
                        >
                            {" "}
                            {t("viewAll")}{" "}
                        </Text>
                    </Flex>
                    {village.map((desa: any, index: number) => (
                        <ActionContainer
                            key={index}
                            onClick={() =>
                                router.push(`/village/detail/${desa.id || desa.userId}`)
                            }
                            style={{ cursor: "pointer" }}
                        >
                            <Logo
                                src={desa.logo || innovatorData.logo}
                                alt="logo"
                                style={{
                                    borderRadius: "50%",
                                }}
                            />
                            <Text1>{desa.namaDesa}</Text1>
                        </ActionContainer>
                    ))}
                    <Box height="20px" />
                </Flex>

                {owner && ( // Conditionally render the Edit button
                    <Box
                        position="fixed"
                        bottom="0"
                        left="50%"
                        transform="translateX(-50%)"
                        width="100%"
                        maxWidth="363px"
                        bg="white"
                        p="3.5"
                        pb="20px"
                        zIndex="999"
                        boxShadow="0px -6px 12px rgba(0, 0, 0, 0.1)"
                    >
                        {data.status === "Menunggu" || data.status === "Ditolak" ? (
                            <>
                                <StatusCard message={data.catatanAdmin} status={data.status} />
                                <Button
                                    width="100%"
                                    fontSize="16px"
                                    onClick={() => router.push(`/innovation/edit/${data.id}`)}
                                    mt={2}
                                >
                                    Edit Inovasi
                                </Button>
                            </>
                        ) : (
                            <Button
                                width="100%"
                                fontSize="16px"
                                onClick={() => router.push(`/innovation/edit/${data.id}`)}
                            >
                                Edit Inovasi
                            </Button>
                        )}
                    </Box>
                )}
                {!owner && (
                    <Box
                        position="fixed"
                        bottom="0"
                        left="50%"
                        transform="translateX(-50%)"
                        width="100%"
                        maxWidth="363px"
                        bg="white"
                        p="3.5"
                        pb="20px"
                        zIndex="999"
                        boxShadow="0px -6px 12px rgba(0, 0, 0, 0.1)"
                    >
                        {admin ? (
                            data.status === "Terverifikasi" || data.status === "Ditolak" ? (
                                <StatusCard message={data.catatanAdmin} status={data.status} />
                            ) : (
                                <Button width="100%" fontSize="14px" onClick={onOpen}>
                                    Verifikasi Permohonan Inovasi
                                </Button>
                            )
                        ) : (
                            <Button width="100%" fontSize="16px" onClick={onOpen}>
                                {t("knowMore")}
                            </Button>
                        )}
                    </Box>
                )}
                <RejectionModal
                    isOpen={openModal}
                    onClose={() => setOpenModal(false)}
                    onConfirm={handleReject}
                    loading={loading}
                    message={modalInput}
                    setMessage={setModalInput}
                />
                <ActionDrawer
                    isOpen={isOpen}
                    onClose={onClose}
                    isAdmin={admin}
                    loading={loading}
                    onVerify={handleVerify}
                    setOpenModal={setOpenModal}
                    role="Inovator"
                    contactData={{
                        whatsapp: innovatorData?.whatsapp || "",
                        instagram: innovatorData?.instagram || "https://www.instagram.com/",
                        website: innovatorData?.website || "https://www.google.com/",
                    }}
                />
                <Box height="60px" />
            </ContentContainer>
        </Box>
    );
}

export default DetailInnovation;
