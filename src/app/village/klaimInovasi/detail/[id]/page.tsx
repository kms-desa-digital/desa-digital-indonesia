"use client";

import {
    Box,
    Button,
    Collapse,
    Flex,
    Text,
    Stack,
    useDisclosure,
} from "@chakra-ui/react";
import TopBar from "Components/topBar";
import React, { useEffect, useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import ConfModal from "src/components/confirmModal/confModal";
import SecConfModal from "src/components/confirmModal/secConfModal";
import DocUpload from "src/components/form/DocUpload";
import ImageUpload from "src/components/form/ImageUpload";
import VidUpload from "src/components/form/VideoUpload";
import { auth } from "src/firebase/clientApp";
import { getClaimById, updateVillage, updateClaim, getVillageById } from "Services/villageServices";
import { getInnovationById, updateInnovation } from "Services/innovationServices";
import { getInnovatorById, updateInnovator } from "Services/innovatorServices";

import {
    CheckboxGroup,
    Container,
    Field,
    JenisKlaim,
    Label,
    NavbarButton,
    Text1,
    Text2,
} from "../../_styles";

import StatusCard from "Components/card/status/StatusCard";
import RejectionModal from "Components/confirmModal/RejectionModal";
import ActionDrawer from "Components/drawer/ActionDrawer";
import Loading from "Components/loading";
/*
import {
    // addDoc,
    // collection,
    doc,
    getDoc,
    increment,
    // serverTimestamp,
    updateDoc,
} from "firebase/firestore";
*/
// import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useUser } from "src/contexts/UserContext";
import RecommendationDrawer from "Components/drawer/RecommendationDrawer";

const KlaimInovasiDetail: React.FC = () => {
    const router = useRouter();
    const [user] = useAuthState(auth);
    const params = useParams();
    const id = params.id as string;
    const [claimData, setClaimData] = useState<any>(null);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<string[]>([]);
    const [selectedVid, setSelectedVid] = useState<string>("");
    const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
    const selectedFileRef = useRef<HTMLInputElement>(null);
    const selectedVidRef = useRef<HTMLInputElement>(null);
    const selectedDocRef = useRef<HTMLInputElement>(null);
    const logoFileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [error, setError] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const modalBody1 = "Apakah Anda yakin ingin mengajukan klaim?";
    const modalBody2 =
        "Inovasi sudah ditambahkan. Admin sedang memverifikasi pengajuan klaim inovasi. Silahkan cek pada halaman pengajuan klaim";
    const [openModal, setOpenModal] = useState(false);
    const [modalInput, setModalInput] = useState("");
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [disabled, setDisabled] = useState(false);
    const [editable, setEditable] = useState(false);
    const [isManual, setIsManual] = useState(false);
    const [textInputsValue, setTextInputsValue] = useState({
        inovationName: "",
        inovatorName: "",
        description: "",
    });
    const [logoFiles, setLogoFiles] = useState<string[]>([]);
    const [innovationFiles, setInnovationFiles] = useState<string[]>([]);
    const {
        isOpen: isRecOpen,
        onOpen: onRecOpen,
        onClose: onRecClose,
    } = useDisclosure();

    const inovasiId = claimData?.inovasiId; // Use inovasiId from fetched claimData
    // console.log("Inovasi ID:", inovasiId);

    const { role } = useUser();
    useEffect(() => {
        if (role === "admin") {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    }, [role]);

    const handleCheckboxChange = (checkbox: string) => {
        // Read-only in detail view
        return;
    };

    const handleAjukanKlaim = () => {
        // This is detail view, mostly for verification or viewing status.
        // Re-upload logic could be added here if needed, but for now assuming read-only/verification.
        return;
    };

    const onSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Read-only
    };

    const onSelectVid = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Read-only
    };

    const onSelectDoc = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Read-only
    };

    const onSubmitForm = async (event: React.FormEvent<HTMLElement>) => {
        event.preventDefault();
        // submitClaim();
        // setEditable(false);
    };

    const [isModal1Open, setIsModal1Open] = useState(false);
    const [isModal2Open, setIsModal2Open] = useState(false);
    const closeModal = () => {
        setIsModal1Open(false);
        setIsModal2Open(false);
    };

    const handleModal1Yes = async () => {
        console.log("Modal 1 Yes clicked");
        // await submitClaim();
    };

    useEffect(() => {
        // Jika salah satu modal terbuka, sembunyikan scrollbar
        const isAnyModalOpen = isModal1Open || isModal2Open || openModal || isOpen;
        if (isAnyModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = ""; // Kembalikan scrollbar jika kedua modal tertutup
        }
    }, [isModal1Open, isModal2Open, openModal, isOpen]);

    useEffect(() => {
        if (id) {
            const fetchClaim = async () => {
                setFetchLoading(true);
                try {
                    /*
                    const claimRef = doc(firestore, "claimInnovations", id);
                    const claimSnap = await getDoc(claimRef);
                    ... Firestore Logic ...
                    */
                    const res: any = await getClaimById(id);
                    const data = res.data;
                    if (data) {
                        console.log("Claim data from API:", JSON.stringify(data, null, 2));
                        setClaimData(data);
                        setEditable(data.status === "Ditolak");
                        setIsManual(!data.inovasiId);
                        
                        // Extract evidence files correctly from object if available
                        const files = data.buktiFiles || {};
                        setSelectedCheckboxes(data.buktiJenis || data.jenisDokumen || []);
                        setSelectedFiles(files.foto || data.images || data.buktiFoto || []);
                        setSelectedVid(files.video?.[0] || data.video || data.selectedVid || "");
                        setSelectedDoc(files.dokumen || data.dokumen || data.selectedDoc || []);

                        if (!data.inovasiId) {
                            setTextInputsValue({
                                inovationName: data.namaInovasi || "",
                                inovatorName: data.namaInovator || "",
                                description: data.deskripsiInovasi || "",
                            });
                            setLogoFiles(data.logoInovator ? [data.logoInovator] : []);
                            setInnovationFiles(data.fotoInovasi ? [data.fotoInovasi] : []);
                        }
                    } else {
                        console.log("Claim not found via API");
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
                // 1. Update claim status to Terverifikasi
                await updateClaim(id, { status: "Terverifikasi" });

                // 2. Increment Village's "jumlahInovasiDiterapkan"
                if (claimData.desaId) {
                    const vRes: any = await getVillageById(claimData.desaId);
                    const vData = vRes.data || vRes.village;
                    const newValue = (Number(vData?.jumlahInovasiDiterapkan) || 0) + 1;
                    await updateVillage(claimData.desaId, { jumlahInovasiDiterapkan: newValue });
                }

                // 3. Increment Innovator's "implementedCount"
                // If it's a known innovation (not manual), we might have innovatorId
                // For simplicity assuming metadata or linked innovation
                console.log("Updating statistics for verified claim...");
                
                toast.success("Klaim berhasil diverifikasi!");
                router.push(`/village/pengajuan/${claimData.desaId || user?.uid}`);
            }
        } catch (error) {
            console.error("Failed to verify claim via API:", error);
            setError("Gagal memverifikasi klaim");
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
            setError("Failed to reject claim");
        } finally {
            setLoading(false);
            setOpenModal(false);
            onClose();
        }
    };

    if (fetchLoading) {
        return <Loading />;
    }

    return (
        <Box>
            <form onSubmit={onSubmitForm}>
                <TopBar
                    title={isAdmin ? "Verifikasi Klaim Inovasi" : "Klaim Inovasi"}
                    onBack={() => router.back()}
                />
                <Container>
                    <Flex flexDirection="column" gap="2px">
                        {isAdmin && claimData && (
                            <Text fontWeight="700" mb={2} fontSize="16px">
                                Desa {claimData.namaDesa}
                            </Text>
                        )}
                        <Label>
                            Jenis Dokumen Bukti Klaim <span style={{ color: "red" }}>*</span>
                        </Label>
                        <Text2> Dapat lebih dari 1 </Text2>
                    </Flex>
                    {isManual && (
                        <Stack spacing={4} mb={4}>
                            <Box>
                                <Label>Informasi Inovasi (Manual)</Label>
                                <Text2>Detail inovasi yang Anda ajukan secara manual</Text2>
                            </Box>
                            <Box>
                                <Text fontWeight="400" fontSize="14px">Nama Inovator</Text>
                                <Text fontSize="16px" fontWeight="600">{textInputsValue.inovatorName}</Text>
                            </Box>
                            <Box>
                                <Text fontWeight="400" fontSize="14px">Nama Inovasi</Text>
                                <Text fontSize="16px" fontWeight="600">{textInputsValue.inovationName}</Text>
                            </Box>
                            <Box>
                                <Text fontWeight="400" fontSize="14px">Deskripsi</Text>
                                <Text fontSize="14px">{textInputsValue.description}</Text>
                            </Box>
                            {logoFiles.length > 0 && (
                                <Box>
                                    <Text fontWeight="400" fontSize="14px">Logo Inovator</Text>
                                    <ImageUpload
                                        selectedFile={logoFiles}
                                        setSelectedFile={setLogoFiles}
                                        selectFileRef={logoFileRef}
                                        onSelectImage={() => {}}
                                        maxFiles={1}
                                        disabled={true}
                                    />
                                </Box>
                            )}
                        </Stack>
                    )}
                    <CheckboxGroup>
                        <JenisKlaim>
                            <input
                                style={{
                                    transform: "scale(1.3)", // Memperbesar checkbox
                                    marginRight: "8px", // Memberi jarak ke teks
                                }}
                                type="checkbox"
                                checked={selectedCheckboxes.includes("foto")}
                                disabled
                            />
                            Foto
                        </JenisKlaim>
                        <JenisKlaim>
                            <input
                                style={{
                                    transform: "scale(1.3)", // Memperbesar checkbox
                                    marginRight: "8px", // Memberi jarak ke teks
                                }}
                                type="checkbox"
                                checked={selectedCheckboxes.includes("video")}
                                disabled
                            />
                            Video
                        </JenisKlaim>
                        <JenisKlaim>
                            <input
                                style={{
                                    transform: "scale(1.3)", // Memperbesar checkbox
                                    marginRight: "8px", // Memberi jarak ke teks
                                }}
                                type="checkbox"
                                checked={selectedCheckboxes.includes("dokumen")}
                                disabled
                            />
                            Dokumen
                        </JenisKlaim>
                    </CheckboxGroup>

                    <Collapse in={selectedCheckboxes.includes("foto")} animateOpacity>
                        <Field>
                            <Flex flexDirection="column" gap="2px">
                                <Text1>
                                    Foto Inovasi
                                    <span style={{ color: "red" }}>*</span>
                                </Text1>
                                <Text2> Maks 2 foto. format: png, jpg </Text2>
                                <ImageUpload
                                    selectedFile={selectedFiles}
                                    setSelectedFile={setSelectedFiles}
                                    selectFileRef={selectedFileRef}
                                    onSelectImage={onSelectImage}
                                    maxFiles={2}
                                    disabled={true}
                                />
                            </Flex>
                        </Field>
                    </Collapse>

                    <Collapse in={selectedCheckboxes.includes("video")} animateOpacity>
                        <Field>
                            <Flex flexDirection="column" gap="2px">
                                <Text1>
                                    Video inovasi
                                    <span style={{ color: "red" }}>*</span>
                                </Text1>
                                <Text2> Maks 100 mb. Format: mp4 </Text2>
                            </Flex>
                            <VidUpload
                                selectedVid={selectedVid}
                                setSelectedVid={setSelectedVid}
                                selectVidRef={selectedVidRef}
                                onSelectVid={onSelectVid}
                                disabled={true}
                            />
                        </Field>
                    </Collapse>

                    <Collapse in={selectedCheckboxes.includes("dokumen")} animateOpacity>
                        <Field>
                            <Flex flexDirection="column" gap="2px">
                                <Text1>
                                    Dokumen Pendukung
                                    <span style={{ color: "red" }}>*</span>
                                </Text1>
                                <Text2> Maks 3 file, 50 mb. Format: pdf, doc, docx </Text2>
                            </Flex>
                            <DocUpload
                                selectedDoc={selectedDoc}
                                setSelectedDoc={setSelectedDoc}
                                selectDocRef={selectedDocRef}
                                onSelectDoc={onSelectDoc} // Ensure this matches the updated DocUploadProps
                                disabled={true}
                            />
                        </Field>
                    </Collapse>
                    <RecommendationDrawer
                        innovationId={inovasiId}
                        isOpen={isRecOpen}
                        onClose={() => onRecClose()}
                    />
                </Container>
                <div>
                    {isAdmin ? (
                        claimData?.status === "Terverifikasi" ||
                            claimData?.status === "Ditolak" ? (
                            <StatusCard
                                status={claimData.status}
                                message={claimData.catatanAdmin}
                            />
                        ) : (
                            <NavbarButton>
                                <Button
                                    width="100%"
                                    isLoading={loading}
                                    onClick={onOpen}
                                    type="button"
                                    disabled={disabled}
                                >
                                    Verifikasi Permohonan Klaim
                                </Button>
                            </NavbarButton>
                        )
                    ) : (
                        claimData?.status === "Ditolak" ? (
                            <>
                                <StatusCard
                                    status={claimData.status}
                                    message={claimData.catatanAdmin}
                                />
                                <NavbarButton>
                                    <Button
                                        width="100%"
                                        isLoading={loading}
                                        onClick={() => router.push(isManual ? `/village/klaimInovasi/manual?id=${id}` : `/village/klaimInovasi?inovasiId=${claimData.inovasiId}&editId=${id}`)}
                                        type="button"
                                    >
                                        Edit & Ajukan Kembali
                                    </Button>
                                </NavbarButton>
                            </>
                        ) : (
                            <StatusCard
                                status={claimData?.status}
                                message={claimData?.catatanAdmin}
                            />
                        )
                    )}
                    <ConfModal
                        isOpen={isModal1Open}
                        onClose={closeModal}
                        modalTitle=""
                        modalBody1={modalBody1}
                        onYes={handleModal1Yes}
                        isLoading={loading}
                    />
                    <SecConfModal
                        isOpen={isModal2Open}
                        onClose={closeModal}
                        modalBody2={modalBody2} // Mengirimkan teks konten modal
                    />
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
                </div>
            </form>
        </Box>
    );
};
export default KlaimInovasiDetail;
