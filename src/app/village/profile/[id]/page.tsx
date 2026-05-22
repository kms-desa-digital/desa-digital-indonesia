"use client";


import CardInnovation from "Components/card/innovation";
import TopBar from "Components/topBar";
import { paths } from "Consts/path";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import EnlargedImage from "Components/village/Image";
import { useAuthState } from "react-firebase-hooks/auth";
import { useUser } from "src/contexts/UserContext";

import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Flex,
    Text,
    Button,
    useDisclosure,
    Image,
} from "@chakra-ui/react";
import { auth } from "src/firebase/clientApp";
// import { auth, firestore } from "src/firebase/clientApp";
import { getVillageById, updateVillage, getVillageInnovations, verifyVillage } from "Services/villageServices";
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
    NavbarButton,
    SubText,
    Title,
} from "./_styles";
import StatusCard from "Components/card/status/StatusCard";
import RejectionModal from "Components/confirmModal/RejectionModal";
import ActionDrawer from "Components/drawer/ActionDrawer";
import { useAdminStatus } from "Hooks/useAdminStatus";

export default function ProfileVillage() {
    const router = useRouter();
    const [userLogin] = useAuthState(auth);
    // const innovationsRef = collection(firestore, "innovations");
    const [innovations, setInnovations] = useState<any[]>([]);
    const [village, setVillage] = useState<any | undefined>(undefined);
    const [owner, setOwner] = useState(false);
    const [loading, setLoading] = useState(false);
    const params = useParams();
    const id = params.id as string;
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [openModal, setOpenModal] = useState(false);
    const [modalInput, setModalInput] = useState("");

    const { isAdmin } = useAdminStatus();
    const { uid: contextUid, firebaseUid: contextFirebaseUid } = useUser();
    const t = useTranslations("Village");

    const formatLocation = (villageData: any) => {
        if (!villageData) return "No Location";
        const lokasi = villageData.lokasi || {};
        const kecamatan = lokasi.kecamatan?.label || villageData.kecamatan || "Unknown Subdistrict";
        const kabupaten = lokasi.kabupatenKota?.label || villageData.kabupatenKota || villageData.kabupaten || "Unknown City";
        const provinsi = lokasi.provinsi?.label || villageData.provinsi || "Unknown Province";

        if (kecamatan === "Unknown Subdistrict" && kabupaten === "Unknown City" && provinsi === "Unknown Province") {
            return "No Location";
        }
        return `KECAMATAN ${kecamatan}, ${kabupaten}, ${provinsi}`;
    };

    const handleVerify = async () => {
        setLoading(true);
        try {
            if (id) {
                /*
                const docRef = doc(firestore, "villages", id);
                await updateDoc(docRef, {
                    status: "Terverifikasi",
                });
                */
                await verifyVillage(id, "Terverifikasi");
                setVillage((prev: any) => ({
                    ...prev,
                    status: "Terverifikasi",
                }));
                toast.success("Profil desa berhasil diverifikasi");
                if (isAdmin) {
                    router.replace("/admin/verification/Verifikasi Desa");
                }
            } else {
                throw new Error("Village ID is undefined");
            }
        } catch (error) {
            console.error("Error verifying village:", error);
        }
        setLoading(false);
        onClose();
    };

    const toEditVillage = () => {
        router.push(paths.VILLAGE_FORM);
    };

    const handleReject = async () => {
        setLoading(true);
        try {
            if (id) {
                /*
                const docRef = doc(firestore, "villages", id);
                await updateDoc(docRef, {
                    status: "Ditolak",
                    catatanAdmin: modalInput, // Simpan alasan penolakan ke Firestore
                });
                */
                await verifyVillage(id, "Ditolak", modalInput);
                setVillage((prev: any) => ({
                    ...prev,
                    status: "Ditolak",
                    catatanAdmin: modalInput,
                }));
                toast.success("Penolakan berhasil");
                if (isAdmin) {
                    router.replace("/admin/verification/Verifikasi Desa");
                }
            } else {
                throw new Error("Village ID is undefined");
            }
        } catch (error) {
            console.error("Error during rejection:", error);
        }
        setLoading(false);
        setOpenModal(false); // Tutup modal setelah menyimpan
    };


    useEffect(() => {
        const fetchVillageData = async () => {
            if (id) {
                try {
                    const response: any = await getVillageById(id);
                    const data = response.village || response.data;

                    if (data) {
                        setVillage(data);
                        const isOwner =
                            data.userId === contextUid ||
                            data.userId === contextFirebaseUid ||
                            id === contextUid ||
                            id === contextFirebaseUid ||
                            data._id === contextUid ||
                            data._id === contextFirebaseUid;

                        if (contextUid || contextFirebaseUid) {
                            setOwner(isOwner);
                        }

                        // Redirect Owner if status is Ditolak
                        if (isOwner && data.status === "Ditolak") {
                            router.push(paths.VILLAGE_FORM || "/village/form");
                            return;
                        }
                    } else {
                        // No data returned
                        if (userLogin?.uid === id) {
                            router.push(paths.VILLAGE_FORM || "/village/form");
                            return;
                        }
                    }
                } catch (error) {
                    console.error("Error fetching village data:", error);
                    if (userLogin?.uid === id) {
                        router.push(paths.VILLAGE_FORM || "/village/form");
                        return;
                    }
                }
            }
        };
        fetchVillageData();

        // Polling for real-time status updates
        const intervalId = setInterval(async () => {
            if (!id) return;
            try {
                const response: any = await getVillageById(id);
                const data = response.village || response.data;
                if (data) {
                    setVillage((prev: any) => {
                        if (prev && prev.status !== data.status) {
                            const uid = userLogin?.uid;
                            const isOwner = data?.userId === uid;
                            if (isOwner && data.status === "Ditolak") {
                                router.push(paths.VILLAGE_FORM || "/village/form");
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
    }, [id, userLogin, router, contextUid, contextFirebaseUid]);

    useEffect(() => {
        const fetchVillageInnovationsData = async () => {
            if (!id) return;
            try {
                const response: any = await getVillageInnovations(id, "Terverifikasi");
                setInnovations(response.innovations || []);
            } catch (error) {
                console.error("Error fetching village innovations:", error);
            }
        };

        fetchVillageInnovationsData();
    }, [id]);

    return (
        <>
            <TopBar title={t("detailTitle")} onBack={() => router.back()} />
            <div style={{ position: "relative", width: "100%" }}>
                <Background src={village?.header || "/images/default-header.svg"} alt="background" />
                <Logo src={village?.logo || "/images/default-logo.svg"} alt="logo" />
            </div>
            <div>
                <ContentContainer>
                    <Flex flexDirection="column" alignItems="flex-end" mb={owner ? 0 : 4}>
                        {owner && (
                            <Button
                                size="xs"
                                onClick={() => router.push(`/village/pengajuan/${id}`)}
                                fontSize="12px"
                                fontWeight="500"
                                height="29px"
                                width="126px"
                                padding="6px 8px"
                                borderRadius="4px"
                                leftIcon={<Image src="/icons/send.svg" alt="send" />}
                            >
                                {t("claimSubmission")}
                            </Button>
                        )}
                    </Flex>

                    <Title> {village?.namaDesa} </Title>
                    <ActionContainer>
                        <Icon src="/icons/location.svg" alt="loc" />
                        <Description>{formatLocation(village)}</Description>
                    </ActionContainer>
                    <div>
                        <SubText margin-bottom={16}>{t("about")}</SubText>
                        <Description>{village?.deskripsi}</Description>
                    </div>
                    <SubText>{t("villageContact")}</SubText>
                    <Flex flexDirection="column" alignItems="flex-start" gap="12px">
                        <Flex
                            width="100%"
                            flexDirection="row"
                            alignItems="flex-start"
                            gap="16px"
                            paddingBottom="12px"
                        >
                            <Box color="#4B5563" fontSize="12px" minWidth="110px">
                                {t("whatsappNumber")}
                            </Box>
                            <Description>{village?.whatsapp}</Description>
                        </Flex>
                        <Flex
                            width="100%"
                            flexDirection="row"
                            alignItems="flex-start"
                            gap="16px"
                            paddingBottom="12px"
                        >
                            <Box color="#4B5563" fontSize="12px" minWidth="110px">
                                {t("instagramLink")}
                            </Box>
                            <Description>{village?.instagram || "-"}</Description>
                        </Flex>
                        <Flex
                            width="100%"
                            flexDirection="row"
                            alignItems="flex-start"
                            gap="16px"
                            paddingBottom="12px"
                        >
                            <Box color="#4B5563" fontSize="12px" minWidth="110px">
                                {t("websiteLink")}
                            </Box>
                            <Description>{village?.website || "-"}</Description>
                        </Flex>
                    </Flex>
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
                                        <Text>{village?.infrastrukturDesa || "Tidak tersedia"}</Text>
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
                                        <Text fontWeight="bold">{t("digitalTechnologyDevelopment")}</Text>
                                        <Text>{village?.teknologi || "Tidak tersedia"}</Text>
                                    </Box>
                                    <Box mt={2}>
                                        <Text fontWeight="bold">{t("technologyCapability")}</Text>
                                        <Text>{village?.kemampuan || "Tidak tersedia"}</Text>
                                    </Box>
                                    {/* <Box mt={2}>
                    <Text fontWeight="bold">Deskripsi Kesiapan Digital:</Text>
                    <Text>{village?.kesiapanDigital || "Tidak tersedia"}</Text>
                  </Box> */}
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
                                    {village?.sosialBudaya || "Tidak tersedia"}
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
                                    {village?.sumberDaya || "Tidak tersedia"}
                                </AccordionPanel>
                            </AccordionItem>
                        </Accordion>
                    </div>
                    <div>
                        <SubText>{t("villageGallery")}</SubText>
                        <CardContainer>
                            <Horizontal>
                                {village?.images &&
                                    (Object.values(village.images) as string[]).length > 0 ? (
                                    (Object.values(village.images) as string[]).map(
                                        (image: string, index: number) => (
                                            <EnlargedImage key={index} src={image} />
                                        )
                                    )
                                ) : (
                                    <Text fontSize={12} color="gray.400">
                                        {t("noImages")}
                                    </Text>
                                )}
                            </Horizontal>
                        </CardContainer>
                    </div>
                    <div>
                        <Flex
                            justifyContent="space-between"
                            alignItems="flex-end"
                            alignSelf="stretch"
                        >
                            <SubText>{t("appliedInnovations")}</SubText>
                            <Text
                                onClick={() => router.push(`/village/detail/${id}/innovations`)}
                                cursor="pointer"
                                color="var(--Primary, #347357)"
                                fontSize="12px"
                                fontWeight="500"
                                textDecorationLine="underline"
                                paddingBottom="12px"
                            >
                                {t("viewAll")}
                            </Text>
                        </Flex>
                        <CardContainer>
                            <Horizontal>
                                {innovations.length === 0 ? (
                                    <Text color="gray.400" fontSize={12}>
                                        {t("noInnovations")}
                                    </Text>
                                ) : (
                                    innovations.slice(0, 5).map((innovation, idx) => (
                                        // @ts-ignore
                                        <CardInnovation
                                            key={idx}
                                            images={innovation.images}
                                            namaInovasi={innovation.namaInovasi}
                                            kategori={innovation.kategori}
                                            deskripsi={innovation.deskripsi}
                                            tahunDibuat={innovation.tahunDibuat}
                                            innovatorLogo={innovation.innovatorImgURL}
                                            innovatorName={innovation.namaInnovator}
                                            jumlahDesa={innovation.jumlahDesa || 0}
                                            onClick={() =>
                                                router.push(`/innovation/detail/${innovation.id}`)
                                            }
                                        />
                                    ))
                                )}
                            </Horizontal>
                        </CardContainer>
                        <Box height="100px" />
                    </div>
                </ContentContainer>
            </div>


            {isAdmin ? (
                village?.status === "Terverifikasi" || village?.status === "Ditolak" ? (
                    <StatusCard
                        status={village?.status}
                        message={village?.catatanAdmin}
                    />
                ) : (
                    <NavbarButton>
                        <Button width="100%" fontSize="14px" onClick={onOpen}>
                            Verifikasi Permohonan Akun
                        </Button>
                    </NavbarButton>
                )
            ) : (
                owner && village?.status === "Menunggu" ? (
                    <StatusCard
                        status={village?.status}
                        message={village?.catatanAdmin}
                    />
                ) : (
                    <NavbarButton>
                        <Button
                            width="100%"
                            onClick={() => {
                                if (owner) {
                                    toEditVillage();
                                } else {
                                    onOpen();
                                }
                            }}
                        >
                            {owner ? "Edit Profile" : " "}
                        </Button>
                    </NavbarButton>
                )
            )}
            <RejectionModal
                isOpen={openModal}
                onClose={() => setOpenModal(false)}
                onConfirm={handleReject}
                loading={loading}
                setMessage={setModalInput}
                message={modalInput}
            />
            <ActionDrawer
                isOpen={isOpen}
                onClose={onClose}
                onVerify={handleVerify}
                isAdmin={isAdmin}
                role="Desa"
                loading={loading}
                setOpenModal={setOpenModal}
            />
        </>
    );
}
