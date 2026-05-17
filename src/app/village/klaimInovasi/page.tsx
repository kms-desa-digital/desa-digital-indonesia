"use client";

import {
    Box,
    Button,
    Collapse,
    Flex,
    Text,
    useDisclosure,
    IconButton,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

import TopBar from "Components/topBar";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import ConfModal from "src/components/confirmModal/confModal";
import SecConfModal from "src/components/confirmModal/secConfModal";
import DocUpload from "src/components/form/DocUpload";
import ImageUpload from "src/components/form/ImageUpload";
import VidUpload from "src/components/form/VideoUpload";
import { getVillageById, claimInnovation, getClaimById, updateClaim, deleteClaim } from "Services/villageServices";
import { getInnovationById } from "Services/innovationServices";

import {
    CheckboxGroup,
    Container,
    Field,
    JenisKlaim,
    Label,
    NavbarButton,
    Text1,
    Text2,
} from "./_styles";

import StatusCard from "Components/card/status/StatusCard";
import RejectionModal from "Components/confirmModal/RejectionModal";
import ActionDrawer from "Components/drawer/ActionDrawer";
import Loading from "Components/loading";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { auth, storage } from "src/firebase/clientApp";
import { getDownloadURL, ref, uploadString, uploadBytesResumable } from "firebase/storage";
import { useUser } from "src/contexts/UserContext";
import RecommendationDrawer from "Components/drawer/RecommendationDrawer";

import Forbidden from "src/components/Forbidden";

const KlaimInovasiContent: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user] = useAuthState(auth);
    const { role, loading: userLoading } = useUser();

    const [claimData, setClaimData] = useState<any>(null);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<string[]>([]);
    const [selectedVid, setSelectedVid] = useState<string>("");
    const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
    
    // Persistent ID for structured storage
    const [claimId] = useState(() => searchParams.get("editId") || `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const selectedFileRef = useRef<HTMLInputElement>(null);
    const selectedVidRef = useRef<HTMLInputElement>(null);
    const selectedDocRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isUploading, setIsUploading] = useState({
        foto: false,
        video: false,
        dokumen: false
    });
    const modalBody1 = "Apakah Anda yakin ingin mengajukan klaim?";
    const modalBody2 =
        "Inovasi sudah ditambahkan. Admin sedang memverifikasi pengajuan klaim inovasi. Silahkan cek pada halaman pengajuan klaim";
    const [openModal, setOpenModal] = useState(false);
    const [modalInput, setModalInput] = useState("");
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [disabled, setDisabled] = useState(false);
    const [editable, setEditable] = useState(true);
    const {
        isOpen: isRecOpen,
        onOpen: onRecOpen,
        onClose: onRecClose,
    } = useDisclosure();

    const [isRejectionVisible, setIsRejectionVisible] = useState(true);
    const inovasiId = searchParams.get("inovasiId");
    const editId = searchParams.get("editId");

    useEffect(() => {
        if (role) {
            setIsAdmin(role === "admin" || role === "ADMIN");
        }
    }, [role]);

    if (userLoading) {
        return <Loading />;
    }

    const normalizedRole = (role || "").toLowerCase();
    const isAuthorized = normalizedRole === "village" || normalizedRole === "desa" || normalizedRole === "admin";

    if (!isAuthorized) {
        return <Forbidden />;
    }

    useEffect(() => {
        const fetchEditData = async () => {
            if (editId) {
                setFetchLoading(true);
                try {
                    const res: any = await getClaimById(editId);
                    const data = res.data;
                    if (data) {
                        setClaimData(data);
                        setSelectedCheckboxes(data.buktiJenis || []);
                        const files = data.buktiFiles || {};
                        setSelectedFiles(files.foto || data.images || []);
                        setSelectedVid(files.video?.[0] || data.video || "");
                        setSelectedDoc(files.dokumen || data.dokumen || []);
                        setEditable(true);
                    }

                } catch (err) {
                    console.error("Error fetching edit data:", err);
                } finally {
                    setFetchLoading(false);
                }
            } else {
                setFetchLoading(false);
            }
        };
        fetchEditData();
    }, [editId]);

    const handleCheckboxChange = (checkbox: string) => {
        if (isUploading[checkbox as keyof typeof isUploading]) return;

        if (selectedCheckboxes.includes(checkbox)) {
            setSelectedCheckboxes(
                selectedCheckboxes.filter((item) => item !== checkbox)
            );
        } else {
            setSelectedCheckboxes([...selectedCheckboxes, checkbox]);
        }
    };

    const isFormValid = () => {
        if (selectedCheckboxes.length === 0) return false;

        for (const item of selectedCheckboxes) {
            if (item === "foto" && selectedFiles.length === 0) return false;
            if (item === "video" && !selectedVid) return false;
            if (item === "dokumen" && selectedDoc.length === 0) return false;
        }

        return true;
    };

    const handleAjukanKlaim = () => {
        if (!user?.uid || !inovasiId) return;
        if (!isFormValid()) {
            toast.error("Harap lengkapi semua bukti yang dipilih.", {
                position: "top-center",
                autoClose: 2000,
            });
            return;
        }
        setIsModal1Open(true);
        setDisabled(true);
    };

    const handleDeleteClaim = (id: string) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteClaim = async () => {
        if (!itemToDelete) return;
        setLoading(true);
        try {
            await deleteClaim(itemToDelete);
            toast.success("Klaim berhasil dihapus");
            router.replace(`/village/pengajuan/${user?.uid}`);
        } catch (err) {
            console.error("Error deleting claim:", err);
            toast.error("Gagal menghapus klaim");
        } finally {
            setLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    const onSelectImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = `${Date.now()}_${file.name}`;
            const storageRef = ref(storage, `claimInnovations/${claimId}/images/${fileName}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on("state_changed", null, (error: any) => console.error(error), async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setSelectedFiles(prev => [...prev, url]);
            });
        }
    };

    const onSelectVid = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsUploading(prev => ({ ...prev, video: true }));
        const storageRef = ref(storage, `claimInnovations/${claimId}/videos/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on("state_changed", null, (err: any) => { console.error(err); setIsUploading(prev => ({ ...prev, video: false })); }, async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setSelectedVid(url);
            setIsUploading(prev => ({ ...prev, video: false }));
        });
    };

    const onSelectDoc = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        setIsUploading(prev => ({ ...prev, dokumen: true }));
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const storageRef = ref(storage, `claimInnovations/${claimId}/documents/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTask.on("state_changed", null, (err: any) => { console.error(err); setIsUploading(prev => ({ ...prev, dokumen: false })); }, async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setSelectedDoc(prev => [...prev, url]);
                setIsUploading(prev => ({ ...prev, dokumen: false }));
            });
        }
    };

    const onSubmitForm = async (event: React.FormEvent<HTMLElement>) => {
        event.preventDefault();
        submitClaim();
        setEditable(false);
    };

    const submitClaim = async () => {
        console.log("Submitting claim via API...");
        setLoading(true);
        setDisabled(true); 

        if (!user?.uid || !inovasiId) {
            setError("User atau ID inovasi tidak ditemukan");
            setLoading(false);
            setDisabled(false);
            return;
        }

        try {
            // Fetch metadata for consistency
            const [villageRes, innovationRes]: any = await Promise.all([
                getVillageById(user.uid),
                getInnovationById(inovasiId)
            ]);

            const villageMetadata = villageRes.data || villageRes.village;
            const innovationMetadata = innovationRes.data || innovationRes.innovation;

            const formData = {
                id: claimId, 
                desaId: user.uid,
                namaDesa: villageMetadata?.namaDesa || claimData?.namaDesa || "",
                inovasiId: inovasiId || null,
                namaInovasi: innovationMetadata?.namaInovasi || claimData?.namaInovasi || "",
                namaInovator: innovationMetadata?.namaInnovator || innovationMetadata?.namaInovator || claimData?.namaInovator || "",
                deskripsiInovasi: innovationMetadata?.deskripsi || innovationMetadata?.deskripsiInovasi || claimData?.deskripsiInovasi || "",
                buktiJenis: selectedCheckboxes,
                buktiFiles: {
                    foto: selectedCheckboxes.includes("foto") ? selectedFiles : [],
                    video: selectedCheckboxes.includes("video") ? [selectedVid] : [],
                    dokumen: selectedCheckboxes.includes("dokumen") ? selectedDoc : []
                },
                isManual: false,
                status: "Menunggu"
            };

            const response: any = editId
                ? await updateClaim(editId, formData)
                : await claimInnovation(formData);

            console.log("Response from server:", response);

            setIsModal2Open(true);

            toast.success(editId ? "Klaim berhasil diperbarui" : "Klaim inovasi berhasil diajukan", {
                position: "top-center",
                autoClose: 3000
            });

            setTimeout(() => {
                if (!isModal2Open) { 
                    handleSuccessRedirect(response);
                }
            }, 5000);

        } catch (error: any) {
            console.error("Error submitting claim:", error);
            const errMsg = error?.message || "Gagal mengajukan klaim. Inovasi ini mungkin sudah diajukan sebelumnya.";
            setError(errMsg);
            toast.error(errMsg);
            setDisabled(false);
        } finally {
            setLoading(false);
        }
    };

    const [isModal1Open, setIsModal1Open] = useState(false);
    const [isModal2Open, setIsModal2Open] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const getDynamicModalBody = () => {
        if (editId && claimData?.status === "Terverifikasi") {
            return "Klaim ini sudah terverifikasi. Jika Anda mengeditnya, status akan kembali menjadi 'Menunggu' dan memerlukan persetujuan ulang dari Admin. Apakah Anda yakin?";
        }
        return modalBody1;
    };
    const closeModal = () => {
        setIsModal1Open(false);
        setIsModal2Open(false);
    };

    const handleSuccessRedirect = (response?: any) => {
        const newClaimId = editId || response?.claimId || response?.data?.claimId || (typeof response === 'string' ? response : "");
        if (newClaimId) {
            router.push(`/village/klaimInovasi/detail/${newClaimId}`);
        } else {
            router.push(`/village/pengajuan/${user?.uid}`);
        }
    };

    const handleModal1Yes = async () => {
        setIsModal1Open(false);
        await submitClaim();
    };

    const handleModal2Close = () => {
        setIsModal2Open(false);
        handleSuccessRedirect();
    };

    useEffect(() => {
        if (isModal1Open || isModal2Open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [isModal1Open, isModal2Open]);


    const handleVerify = async () => {
        return;
    };

    const handleReject = async () => {
        return;
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
                    <CheckboxGroup>
                        <JenisKlaim>
                            <input
                                style={{
                                    transform: "scale(1.3)", 
                                    marginRight: "8px", 
                                    cursor: (isUploading.foto || !editable || loading || disabled) ? "not-allowed" : "pointer"
                                }}
                                type="checkbox"
                                onChange={() => handleCheckboxChange("foto")}
                                checked={selectedCheckboxes.includes("foto")}
                                disabled={isUploading.foto || !editable || loading || disabled}
                            />
                            Foto
                        </JenisKlaim>
                        <JenisKlaim>
                            <input
                                style={{
                                    transform: "scale(1.3)", 
                                    marginRight: "8px", 
                                    cursor: (isUploading.video || !editable || loading || disabled) ? "not-allowed" : "pointer"
                                }}
                                type="checkbox"
                                onChange={() => handleCheckboxChange("video")}
                                checked={selectedCheckboxes.includes("video")}
                                disabled={isUploading.video || !editable || loading || disabled}
                            />
                            Video
                        </JenisKlaim>
                        <JenisKlaim>
                            <input
                                style={{
                                    transform: "scale(1.3)", 
                                    marginRight: "8px", 
                                    cursor: (isUploading.dokumen || !editable || loading || disabled) ? "not-allowed" : "pointer"
                                }}
                                type="checkbox"
                                onChange={() => handleCheckboxChange("dokumen")}
                                checked={selectedCheckboxes.includes("dokumen")}
                                disabled={isUploading.dokumen || !editable || loading || disabled}
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
                                    claimId={claimId}
                                    maxFiles={2}
                                    disabled={!editable || loading || disabled}
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
                                claimId={claimId}
                                disabled={!editable || loading || disabled}
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
                                claimId={claimId}
                                disabled={!editable || loading || disabled}
                            />
                        </Field>
                    </Collapse>
                    <RecommendationDrawer
                        innovationId={inovasiId || ""}
                        isOpen={isRecOpen}
                        onClose={() => onRecClose()}
                    />
                    <Box height="150px" />
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
                        <NavbarButton>
                            <Flex direction="column" w="100%" gap={2}>
                                {claimData?.status === "Ditolak" && isRejectionVisible && (
                                    <Box bg="#FEE2E2" p={2} borderRadius="8px" mb={1} position="relative">
                                        <Flex align="center" justify='center'>
                                            <CloseIcon fontSize="10px" color="#EF4444" mr="8px" />
                                            <Text fontSize="12px" fontWeight="700" color="#EF4444">
                                                Pengajuan ditolak
                                            </Text>
                                        </Flex>
                                        {claimData.catatanAdmin && (
                                            <Text fontSize="10px" fontWeight="500" color="#EF4444" textAlign="center" mt={1}>
                                                Catatan: {claimData.catatanAdmin}
                                            </Text>
                                        )}
                                        <IconButton
                                            aria-label="Close"
                                            icon={<CloseIcon fontSize="8px" />}
                                            size="xs"
                                            position="absolute"
                                            right="4px"
                                            top="4px"
                                            variant="ghost"
                                            color="#EF4444"
                                            onClick={() => setIsRejectionVisible(false)}
                                        />
                                    </Box>
                                )}
                                <Flex gap={2} w="100%">
                                    <Button
                                        flex={1}
                                        isLoading={loading}
                                        onClick={handleAjukanKlaim}
                                        type="button"
                                        isDisabled={!isFormValid() || disabled || Object.values(isUploading).some(v => v)}
                                        colorScheme="green"
                                        fontSize="14px"
                                    >
                                        {claimData?.status === "Ditolak" ? "Ajukan Ulang" : editId ? "Perbarui Klaim" : "Ajukan Klaim"}
                                    </Button>
                                    {editId && (
                                        <Button
                                            flex={1}
                                            isLoading={loading}
                                            onClick={() => {
                                                setItemToDelete(editId);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            type="button"
                                            bg="red.500"
                                            color="white"
                                            _hover={{ bg: "red.600" }}
                                            fontSize="14px"
                                            disabled={disabled}
                                        >
                                            Delete Klaim
                                        </Button>
                                    )}
                                </Flex>
                            </Flex>
                        </NavbarButton>
                    )}

                    <ConfModal
                        isOpen={isModal1Open}
                        onClose={() => {
                            setIsModal1Open(false);
                            setDisabled(false);
                        }}
                        onYes={submitClaim}
                        modalBody1={getDynamicModalBody()}
                        modalTitle="Konfirmasi Klaim"
                        isLoading={loading}
                    />
                    <ConfModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onYes={confirmDeleteClaim}
                        modalBody1="Apakah Anda yakin ingin menghapus pengajuan klaim ini? Data yang sudah dihapus tidak dapat dikembalikan."
                        modalTitle="Hapus Klaim"
                        isLoading={loading}
                    />
                    <SecConfModal
                        isOpen={isModal2Open}
                        onClose={handleModal2Close}
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
const KlaimInovasi: React.FC = () => {
    return (
        <Suspense fallback={<Loading />}>
            <KlaimInovasiContent />
        </Suspense>
    );
};

export default KlaimInovasi;
