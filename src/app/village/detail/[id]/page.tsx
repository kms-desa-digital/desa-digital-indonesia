"use client";


import CardInnovation from "Components/card/innovation";
import TopBar from "Components/topBar";
import { paths } from "Consts/path";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import EnlargedImage from "src/components/village/Image";
import Loading from "Components/loading";
import { toast } from "react-toastify";

import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Flex,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import StatusCard from "Components/card/status/StatusCard";
/*
import {
    DocumentData,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
*/
import { DocumentData } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
// import { auth, firestore } from "src/firebase/clientApp";
import { auth } from "src/firebase/clientApp";
import { getVillageById, getVillageInnovations } from "Services/villageServices";
import api from "Services/api";
import { useUser } from "src/contexts/UserContext";
import {
    ActionContainer,
    Background,
    CardContainer,
    ChipContainer,
    ContPotensiDesa,
    ContentContainer,
    Description,
    Horizontal,
    Icon,
    Label,
    Logo,
    SubText,
    Title,
} from "./_styles";
import RejectionModal from "Components/confirmModal/RejectionModal";
import ActionDrawer from "Components/drawer/ActionDrawer";

export default function DetailVillagePage() {
    const router = useRouter();
    const t = useTranslations("Village");
    const [userLogin] = useAuthState(auth);
    const { role } = useUser();
    const [innovations, setInnovations] = useState<DocumentData[]>([]);
    const [village, setVillage] = useState<DocumentData | undefined>();
    const params = useParams();
    const id = params.id as string;

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [admin, setAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [modalInput, setModalInput] = useState(""); // Catatan admin
    const [isExpanded, setIsExpanded] = useState(false);

    const truncateText = (text: string, wordLimit: number) => {
        if (!text) return "";
        const words = text.split(" ");
        return words.length > wordLimit
            ? words.slice(0, wordLimit).join(" ") + "..."
            : text;
    };

    const formatLocation = (lokasi: any) => {
        if (!lokasi) return "No Location";
        const kecamatan = lokasi.kecamatan?.label || "Unknown Subdistrict";
        const kabupaten = lokasi.kabupatenKota?.label || "Unknown City";
        const provinsi = lokasi.provinsi?.label || "Unknown Province";

        return `KECAMATAN ${kecamatan}, ${kabupaten}, ${provinsi}`;
    };

    const handleVerify = async () => {
        setLoading(true);
        try {
            if (id) {
                await api.post(`/admin/verify/village/${id}`, { status: "Terverifikasi", catatanAdmin: "" });
                setVillage((prev: any) =>
                    prev ? { ...prev, status: "Terverifikasi" } : undefined
                );
                toast.success("Profil Desa berhasil diverifikasi");
            } else {
                throw new Error("Village ID is undefined");
            }
        } catch (error) {
            console.error("Error verifying village via API:", error);
            toast.error("Gagal memverifikasi profil desa");
        } finally {
            setLoading(false);
            onClose();
        }
    };

    const handleReject = async () => {
        setLoading(true);
        try {
            if (id) {
                await api.post(`/admin/verify/village/${id}`, { status: "Ditolak", catatanAdmin: modalInput });
                setVillage((prev: any) =>
                    prev ? { ...prev, status: "Ditolak", catatanAdmin: modalInput } : undefined
                );
                toast.success("Profil Desa berhasil ditolak");
            } else {
                throw new Error("Village ID is undefined");
            }
        } catch (error) {
            console.error("Error during rejection via API:", error);
            toast.error("Gagal menolak profil desa");
        } finally {
            setLoading(false);
            setOpenModal(false);
            onClose();
        }
    };
    useEffect(() => {
        setAdmin(role === "admin");
    }, [role]);


    useEffect(() => {
        const fetchVillageData = async () => {
            if (id) {
                setLoading(true);
                try {
                    const res: any = await getVillageById(id);
                    const villageData = res.village || res.data;
                    if (villageData) {
                        if (villageData.userId === userLogin?.uid) {
                            router.push("/village/profile/" + id);
                            return;
                        }
                        setVillage(villageData);
                    } else {
                        console.error("No such village found via API!");
                    }

                    const resInv: any = await getVillageInnovations(id, "Terverifikasi");
                    setInnovations(resInv.innovations || resInv.data || []);
                } catch (error) {
                    console.error("Error fetching village data from API:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                console.error("Village ID is undefined");
                setLoading(false);
            }
        };

        fetchVillageData();
    }, [id]);

    if (loading) {
        return <Loading />;
    }

    return (
        <Box paddingBottom={0}>
            <TopBar title={t("detailTitle")} onBack={() => router.back()} />
            <div style={{ position: "relative", width: "100%" }}>
                <Background src={village?.header || "/images/default-header.svg"} alt="background" />
                <Logo src={village?.logo || "/images/default-logo.svg"} alt="logo" />
            </div>
            <div>
                <ContentContainer>
                    <Title> {village?.namaDesa} </Title>
                    <ActionContainer>
                        <Icon src="/icons/location.svg" alt="loc" />
                        <Description>{formatLocation(village?.lokasi)}</Description>
                    </ActionContainer>
                    <div>
                        <SubText margin-bottom={16}>{t("about")}</SubText>
                        <Description>
                            {isExpanded ? (
                                <>
                                    {village?.deskripsi}
                                    {village?.deskripsi && village.deskripsi.split(" ").length > 20 && (
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
                                            {t("readLess")}
                                        </Text>
                                    )}
                                </>
                            ) : (
                                <>
                                    {truncateText(village?.deskripsi || "", 20)}
                                    {village?.deskripsi && village.deskripsi.split(" ").length > 20 && (
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
                                            {t("readMore")}
                                        </Text>
                                    )}
                                </>
                            )}
                        </Description>
                    </div>
                    <div>
                        <SubText>{t("villagePotential")}</SubText>
                        <ContPotensiDesa>
                            {village?.potensiDesa?.map((potensi: string, index: number) => (
                                <ChipContainer key={index}>
                                    <Label>{potensi}</Label>
                                </ChipContainer>
                            ))}
                        </ContPotensiDesa>
                    </div>
                    <div>
                        <SubText>{t("villageCharacteristics")}</SubText>
                        <Accordion defaultIndex={[0]} allowMultiple>
                            <AccordionItem>
                                <h2>
                                    <AccordionButton paddingLeft="4px" paddingRight="4px">
                                        <Flex
                                            as="span"
                                            flex="1"
                                            textAlign="left"
                                            fontSize="12px"
                                            fontWeight="700"
                                            gap={2}
                                        >
                                            <Icon src="/icons/geography.svg" alt="geo" /> {t("geography")}
                                        </Flex>
                                        <AccordionIcon color="#347357" />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel
                                    pb={4}
                                    fontSize={12}
                                    paddingLeft="4px"
                                    paddingRight="4px"
                                >
                                    {village?.geografisDesa}
                                </AccordionPanel>
                            </AccordionItem>
                            <AccordionItem>
                                <h2>
                                    <AccordionButton paddingLeft="4px" paddingRight="4px">
                                        <Flex
                                            as="span"
                                            flex="1"
                                            textAlign="left"
                                            fontSize="12px"
                                            fontWeight="700"
                                            gap={2}
                                        >
                                            <Icon src="/icons/infrastructure.svg" alt="Infrastrusture" />{" "}
                                            {t("infrastructure")}
                                        </Flex>
                                        <AccordionIcon color="#347357" />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel
                                    pb={4}
                                    fontSize={12}
                                    paddingLeft="4px"
                                    paddingRight="4px"
                                >
                                    <Box>
                                        <Text fontWeight="bold">{t("roadCondition")}</Text>
                                        <Text>{village?.kondisijalan || "Tidak tersedia"}</Text>
                                    </Box>
                                    <Box mt={2}>
                                        <Text fontWeight="bold">{t("internetNetwork")}</Text>
                                        <Text>{village?.jaringan || "Tidak tersedia"}</Text>
                                    </Box>
                                    <Box mt={2}>
                                        <Text fontWeight="bold">{t("electricityAvailability")}</Text>
                                        <Text>{village?.listrik || "Tidak tersedia"}</Text>
                                    </Box>
                                    <Box mt={2}>
                                        <Text fontWeight="bold">{t("others")}</Text>
                                        <Text>
                                            {village?.infrastrukturDesa || "Tidak tersedia"}
                                        </Text>
                                    </Box>
                                </AccordionPanel>
                            </AccordionItem>
                            <AccordionItem>
                                <h2>
                                    <AccordionButton paddingLeft="4px" paddingRight="4px">
                                        <Flex
                                            as="span"
                                            flex="1"
                                            textAlign="left"
                                            fontSize="12px"
                                            fontWeight="700"
                                            gap={2}
                                        >
                                            <Icon src="/icons/digital-readiness.svg" alt="DigR" /> {t("digitalReadiness")}
                                        </Flex>
                                        <AccordionIcon color="#347357" />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel
                                    pb={4}
                                    fontSize={12}
                                    paddingLeft="4px"
                                    paddingRight="4px"
                                >
                                    <Box>
                                        <Text fontWeight="bold">
                                            {t("digitalTechnologyDevelopment")}
                                        </Text>
                                        <Text>{village?.teknologi || "Tidak tersedia"}</Text>
                                    </Box>
                                    <Box mt={2}>
                                        <Text fontWeight="bold">{t("technologyCapability")}</Text>
                                        <Text>{village?.kemampuan || "Tidak tersedia"}</Text>
                                    </Box>
                                </AccordionPanel>
                            </AccordionItem>
                            <AccordionItem>
                                <h2>
                                    <AccordionButton paddingLeft="4px" paddingRight="4px">
                                        <Flex
                                            as="span"
                                            flex="1"
                                            textAlign="left"
                                            fontSize="12px"
                                            fontWeight="700"
                                            gap={2}
                                        >
                                            <Icon src="/icons/socio-cultural.svg" alt="SocCul" /> {t("socialCulture")}
                                        </Flex>
                                        <AccordionIcon color="#347357" />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel
                                    pb={4}
                                    fontSize={12}
                                    paddingLeft="4px"
                                    paddingRight="4px"
                                >
                                    {village?.sosialBudaya}
                                </AccordionPanel>
                            </AccordionItem>
                            <AccordionItem>
                                <h2>
                                    <AccordionButton paddingLeft="4px" paddingRight="4px">
                                        <Flex
                                            as="span"
                                            flex="1"
                                            textAlign="left"
                                            fontSize="12px"
                                            fontWeight="700"
                                            gap={2}
                                        >
                                            <Icon src="/icons/resource-village.svg" alt="Resource" /> {t("naturalResources")}
                                        </Flex>
                                        <AccordionIcon color="#347357" />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel
                                    pb={4}
                                    fontSize={12}
                                    paddingLeft="4px"
                                    paddingRight="4px"
                                >
                                    {village?.sumberDaya}
                                </AccordionPanel>
                            </AccordionItem>
                        </Accordion>
                    </div>
                    <div>
                        <SubText>{t("villageGallery")}</SubText>
                        <CardContainer>
                            {village?.images && Object.values(village.images).length > 0 ? (
                                <Horizontal>
                                    {(Object.values(village.images) as string[]).map(
                                        (image: string, index: number) => (
                                            <EnlargedImage key={index} src={image} />
                                        )
                                    )}
                                </Horizontal>
                            ) : (
                                <Text color="gray.400" fontSize={12}>
                                    {t("noImages")}
                                </Text>
                            )}
                        </CardContainer>
                    </div>
                    <div>
                        <Flex
                            justifyContent="space-between"
                            alignItems="flex-end"
                            align-self="stretch"
                        >
                            <SubText>{t("appliedInnovations")}</SubText>
                            <Text
                                onClick={() => router.push(`/village/detail/${id}/innovations`)} // Redirect to innovations list page
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
                        {village?.status === "Terverifikasi" && (
                            <CardContainer style={{ paddingBottom: "10px" }}>
                                <Horizontal>
                                    {innovations.length === 0 ? (
                                        <Text color="gray.400" fontSize={12}>
                                            {t("noInnovations")}
                                        </Text>
                                    ) : (
                                        innovations.slice(0, 5).map((innovation, idx) => (
                                            <CardInnovation
                                                key={innovation.id || innovation._id || idx}
                                                images={innovation.images}
                                                namaInovasi={innovation.namaInovasi}
                                                kategori={innovation.kategori}
                                                deskripsi={innovation.deskripsi}
                                                tahunDibuat={innovation.tahunDibuat}
                                                innovatorLogo={innovation.innovatorImgURL}
                                                innovatorName={innovation.namaInnovator}
                                                jumlahDesa={innovation.jumlahDesa || 0}
                                                onClick={() => {
                                                    if (innovation.id) {
                                                        router.push(`/innovation/detail/${innovation.id}`);
                                                    }
                                                }}
                                            />
                                        ))
                                    )}
                                </Horizontal>
                            </CardContainer>
                        )}
                    </div>
                    <Box
                        position="fixed"
                        bottom="0"
                        left="50%"
                        transform="translateX(-50%)"
                        width="100%"
                        maxWidth="360px"
                        bg="white"
                        p="3.5"
                        boxShadow="0px -6px 12px rgba(0, 0, 0, 0.1)"
                    >
                        {/* Logika untuk Admin */}
                        {admin ? (
                            village?.status === "Terverifikasi" ||
                                village?.status === "Ditolak" ? (
                                // Tampilkan StatusCard jika status Terverifikasi atau Ditolak
                                <StatusCard
                                    message={village?.catatanAdmin}
                                    status={village?.status}
                                />
                            ) : (
                                // Tampilkan tombol Verifikasi jika status belum Terverifikasi/Ditolak
                                <Button width="100%" fontSize="14px" mb={8} onClick={onOpen}>
                                    Verifikasi Permohonan Akun
                                </Button>
                            )
                        ) : (
                            // Logika untuk Non-Admin
                            <Flex>
                                <Button width="100%" onClick={onOpen}>
                                    {t("villageContact")}
                                </Button>
                            </Flex>
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
                    <Box height="60px" />
                </ContentContainer>
            </div>
            <ActionDrawer
                isOpen={isOpen}
                onClose={onClose}
                isAdmin={admin}
                loading={loading}
                onVerify={handleVerify}
                setOpenModal={setOpenModal}
                role="Desa"
                contactData={{
                    whatsapp: village?.whatsapp || "",
                    instagram: village?.instagram || "https://www.instagram.com/",
                    website: village?.website || "https://www.google.com/",
                }}
            />
        </Box>
    );
}
