"use client";

import {
    Box, Button, Collapse, Flex, Text, Textarea, Input, useDisclosure, IconButton,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

import TopBar from "Components/topBar";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import ConfModal from "src/components/confirmModal/confModal";
import SecConfModal from "src/components/confirmModal/secConfModal";
import DocUpload from "src/components/form/DocUpload";
import ImageUpload from "src/components/form/ImageUpload";
import VidUpload from "src/components/form/VideoUpload";
import { auth, storage } from "src/firebase/clientApp";
import { getDownloadURL, ref, uploadString, uploadBytesResumable } from "firebase/storage";
import { getVillageById, claimInnovation, updateVillage, getClaimById, updateClaim, deleteClaim } from "Services/villageServices";

import {
    CheckboxGroup, Container, Field, JenisKlaim, Label, NavbarButton, Text1, Text2,
} from "../_styles";
import StatusCard from "Components/card/status/StatusCard";
import RejectionModal from "Components/confirmModal/RejectionModal";
import ActionDrawer from "Components/drawer/ActionDrawer";
import Loading from "Components/loading";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { useUser } from "src/contexts/UserContext";

// Pisahkan semua logic ke komponen terpisah
const KlaimInovasiManualContent: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user] = useAuthState(auth);
    const params = useParams();
    const id = params.id as string;
    const [claimData, setClaimData] = useState<any>(null);
    const [logoFiles, setLogoFiles] = useState<string[]>([]);
    const [innovationFiles, setInnovationFiles] = useState<string[]>([]);
    const [buktiFoto, setBuktiFoto] = useState<string[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<string[]>([]);
    const [selectedVid, setSelectedVid] = useState<string>("");
    const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{ logo: number; innovation: number }>({ logo: 0, innovation: 0 });

    const generateObjectId = () => [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const [claimId] = useState(() => searchParams.get("editId") || generateObjectId());
    const logoFileRef = useRef<HTMLInputElement>(null);
    const innovationFileRef = useRef<HTMLInputElement>(null);
    const buktiFotoRef = useRef<HTMLInputElement>(null);
    const selectedVidRef = useRef<HTMLInputElement>(null);
    const selectedDocRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [error, setError] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const modalBody1 = "Apakah Anda yakin ingin mengajukan klaim?";
    const modalBody2 = "Inovasi sudah ditambahkan. Admin sedang memverifikasi pengajuan klaim inovasi.";
    const [openModal, setOpenModal] = useState(false);
    const [modalInput, setModalInput] = useState("");
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [disabled, setDisabled] = useState(false);
    const [editable, setEditable] = useState(true);
    const [textInputsValue, setTextInputsValue] = useState({
        inovationName: "",
        inovatorName: "",
        description: "",
    });
    const [isUploading, setIsUploading] = useState({
        foto: false,
        video: false,
        dokumen: false,
        logo: false,
        innovation: false
    });
    const [isRejectionVisible, setIsRejectionVisible] = useState(true);

    const editId = searchParams.get("editId");

    const inovasiId = searchParams.get("inovasiId");

    const [isModal1Open, setIsModal1Open] = useState(false);
    const [isModal2Open, setIsModal2Open] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const getDynamicModalBody = () => {
        if (editId && claimData?.status === "Terverifikasi") {
            return "Jika Anda mengeditnya, status akan kembali menjadi 'Menunggu'. Apakah Anda yakin?";
        }
        return modalBody1;
    };

    const { role } = useUser();
    useEffect(() => {
        setIsAdmin(role === "admin");
    }, [role]);

    const handleCheckboxChange = (checkbox: string) => {
        if (isUploading[checkbox as keyof typeof isUploading]) return;

        if (selectedCheckboxes.includes(checkbox)) {
            setSelectedCheckboxes(selectedCheckboxes.filter((item) => item !== checkbox));
        } else {
            setSelectedCheckboxes([...selectedCheckboxes, checkbox]);
        }
    };

    const isFormValid = () => {
        // Required basic info
        if (!textInputsValue.inovationName.trim() || !textInputsValue.inovatorName.trim() || !textInputsValue.description.trim() || logoFiles.length === 0 || innovationFiles.length === 0) return false;

        // Checklist must be selected
        if (selectedCheckboxes.length === 0) return false;

        // Checklist items must have content
        for (const item of selectedCheckboxes) {
            if (item === "foto" && buktiFoto.length === 0) return false;
            if (item === "video" && !selectedVid) return false;
            if (item === "dokumen" && selectedDoc.length === 0) return false;
        }

        return true;
    };

    const handleAjukanKlaim = () => {
        if (!isFormValid()) {
            toast.error("Harap lengkapi semua data dan bukti yang dipilih.", {
                position: "top-center", autoClose: 2000,
            });
            return;
        }

        setIsModal1Open(true);
        setDisabled(true);
    };

    const handleDeleteClaim = () => {
        if (!editId) return;
        setItemToDelete(editId);
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
            console.error("Error deleting manual claim:", err);
            toast.error("Gagal menghapus klaim");
        } finally {
            setLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    const onSelectLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsUploading(prev => ({ ...prev, logo: true }));
        const storageRef = ref(storage, `claimInnovations/${claimId}/logo/logo_${Date.now()}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on("state_changed",
            (snapshot: any) => {
                const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(prev => ({ ...prev, logo: p }));
            },
            (err: any) => {
                console.error(err);
                setIsUploading(prev => ({ ...prev, logo: false }));
            },
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setLogoFiles([url]);
                setIsUploading(prev => ({ ...prev, logo: false }));
                setUploadProgress(prev => ({ ...prev, logo: 0 }));
            }
        );
    };

    const onSelectInnovationPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsUploading(prev => ({ ...prev, innovation: true }));
        const storageRef = ref(storage, `claimInnovations/${claimId}/main/photo_${Date.now()}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on("state_changed",
            (snapshot: any) => {
                const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(prev => ({ ...prev, innovation: p }));
            },
            (err: any) => {
                console.error(err);
                setIsUploading(prev => ({ ...prev, innovation: false }));
            },
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setInnovationFiles([url]);
                setIsUploading(prev => ({ ...prev, innovation: false }));
                setUploadProgress(prev => ({ ...prev, innovation: 0 }));
            }
        );
    };

    const onSelectBuktiFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        setIsUploading(prev => ({ ...prev, foto: true }));
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const storageRef = ref(storage, `claimInnovations/${claimId}/evidence/images/foto_${Date.now()}_${i}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTask.on("state_changed", null, (err: any) => { console.error(err); setIsUploading(prev => ({ ...prev, foto: false })); }, async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setBuktiFoto(prev => [...prev, url].slice(0, 2));
                setIsUploading(prev => ({ ...prev, foto: false }));
            });
        }
    };

    const onSelectVid = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsUploading(prev => ({ ...prev, video: true }));
        const storageRef = ref(storage, `claimInnovations/${claimId}/evidence/videos/video_${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on("state_changed", null, (err: any) => { console.error(err); setIsUploading(prev => ({ ...prev, video: false })); }, async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setSelectedVid(url);
            setIsUploading(prev => ({ ...prev, video: false }));
        });
    };

    const onSelectDoc = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        setIsUploading(prev => ({ ...prev, dokumen: true }));
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const storageRef = ref(storage, `claimInnovations/${claimId}/evidence/documents/doc_${Date.now()}_${i}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTask.on("state_changed", null, (err: any) => { console.error(err); setIsUploading(prev => ({ ...prev, dokumen: false })); }, async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setSelectedDoc(prev => [...prev, url]);
                setIsUploading(prev => ({ ...prev, dokumen: false }));
            });
        }
    };

    const uploadFilesToStorage = async (
        claimId: string,
        data: {
            logoInovator: string | null,
            fotoInovasi: string | null,
            buktiFiles: {
                foto: string[],
                video: string[],
                dokumen: string[]
            }
        }
    ) => {
        const uploadResults: any = {
            logoInovator: data.logoInovator,
            fotoInovasi: data.fotoInovasi,
            buktiFiles: { foto: [], video: [], dokumen: [] }
        };

        // Upload Logo Inovator
        if (data.logoInovator?.startsWith('data:')) {
            const storageRef = ref(storage, `claimInnovations/${claimId}/logo/logo_${Date.now()}`);
            await uploadString(storageRef, data.logoInovator, 'data_url');
            uploadResults.logoInovator = await getDownloadURL(storageRef);
        }

        // Upload Foto Inovasi (Main)
        if (data.fotoInovasi?.startsWith('data:')) {
            const storageRef = ref(storage, `claimInnovations/${claimId}/main/photo_${Date.now()}`);
            await uploadString(storageRef, data.fotoInovasi, 'data_url');
            uploadResults.fotoInovasi = await getDownloadURL(storageRef);
        }

        // Upload Bukti Foto
        for (let i = 0; i < data.buktiFiles.foto.length; i++) {
            const file = data.buktiFiles.foto[i];
            if (file.startsWith('data:')) {
                const storageRef = ref(storage, `claimInnovations/${claimId}/evidence/images/foto_${Date.now()}_${i}`);
                await uploadString(storageRef, file, 'data_url');
                const url = await getDownloadURL(storageRef);
                uploadResults.buktiFiles.foto.push(url);
            } else {
                uploadResults.buktiFiles.foto.push(file);
            }
        }

        // Upload Bukti Video
        for (let i = 0; i < data.buktiFiles.video.length; i++) {
            const file = data.buktiFiles.video[i];
            if (file.startsWith('data:')) {
                const storageRef = ref(storage, `claimInnovations/${claimId}/evidence/videos/video_${Date.now()}_${i}`);
                await uploadString(storageRef, file, 'data_url');
                const url = await getDownloadURL(storageRef);
                uploadResults.buktiFiles.video.push(url);
            } else {
                uploadResults.buktiFiles.video.push(file);
            }
        }

        // Upload Bukti Dokumen
        for (let i = 0; i < data.buktiFiles.dokumen.length; i++) {
            const file = data.buktiFiles.dokumen[i];
            if (file.startsWith('data:')) {
                const storageRef = ref(storage, `claimInnovations/${claimId}/evidence/documents/doc_${Date.now()}_${i}`);
                await uploadString(storageRef, file, 'data_url');
                const url = await getDownloadURL(storageRef);
                uploadResults.buktiFiles.dokumen.push(url);
            } else {
                uploadResults.buktiFiles.dokumen.push(file);
            }
        }

        return uploadResults;
    };

    const onSubmitForm = async (event: React.FormEvent<HTMLElement>) => {
        event.preventDefault();
        submitClaim();
        setEditable(false);
    };

    const submitClaim = async () => {
        setLoading(true);
        setDisabled(true); // Disable buttons immediately

        if (!user?.uid) {
            setError("User tidak ditemukan");
            setLoading(false);
            setDisabled(false);
            return;
        }

        try {
            const villageRes: any = await getVillageById(user.uid);
            const village = villageRes.data || villageRes.village;

            const formData = {
                id: claimId, // Use pre-generated ID
                desaId: user.uid,
                namaDesa: village?.namaDesa || "",
                namaInovator: textInputsValue.inovatorName,
                namaInovasi: textInputsValue.inovationName,
                deskripsiInovasi: textInputsValue.description,
                logoInovator: logoFiles[0] || null,
                fotoInovasi: innovationFiles[0] || null,
                buktiJenis: selectedCheckboxes,
                buktiFiles: {
                    foto: selectedCheckboxes.includes("foto") ? buktiFoto : [],
                    video: selectedCheckboxes.includes("video") ? [selectedVid] : [],
                    dokumen: selectedCheckboxes.includes("dokumen") ? selectedDoc : []
                },
                isManual: true,
                status: "Menunggu"
            };

            const response: any = editId
                ? await updateClaim(editId as string, formData)
                : await claimInnovation(formData);

            console.log("Response from server:", response);

            setIsModal2Open(true);
            toast.success(editId ? "Klaim manual berhasil diperbarui" : "Klaim inovasi manual berhasil diajukan", {
                position: "top-center",
                autoClose: 3000
            });

            setTimeout(() => {
                if (!isModal2Open) {
                    handleSuccessRedirect(response);
                }
            }, 5000);
        } catch (error: any) {
            console.error("Error submitting manual claim:", error);
            const errMsg = error?.message || "Gagal mengajukan klaim manual.";
            setError(errMsg);
            toast.error(errMsg);
            setDisabled(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessRedirect = (response?: any) => {
        const newClaimId = editId || response?.claimId || response?.data?.claimId || (typeof response === 'string' ? response : "");
        if (newClaimId) {
            router.replace(`/village/klaimInovasi/detail/${newClaimId}`);
        } else {
            router.replace(`/village/pengajuan/${user?.uid}`);
        }
    };

    const handleModal2Close = () => {
        setIsModal2Open(false);
        handleSuccessRedirect();
    };


    const getDescriptionWordCount = () => {
        return textInputsValue.description.split(/\s+/).filter((word) => word !== "").length;
    };

    const onTextChange = ({
        target: { name, value },
    }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const wordCount = value.split(/\s+/).filter((word) => word !== "").length;
        if (name === "description" && wordCount > 80) return;
        if ((name === "inovationName" || name === "inovatorName") && wordCount > 5) return;
        setTextInputsValue((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        document.body.style.overflow = isModal1Open || isModal2Open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isModal1Open, isModal2Open]);

    useEffect(() => {
        if (editId) {
            const fetchClaim = async () => {
                setFetchLoading(true);
                try {
                    const response: any = await getClaimById(editId as string);
                    const claimData = response.data;
                    if (claimData) {
                        setClaimData(claimData);
                        setEditable(true);
                        setSelectedCheckboxes(claimData.jenisDokumen || claimData.buktiJenis || []);

                        setLogoFiles(claimData.logoInovator ? [claimData.logoInovator] : []);
                        setInnovationFiles(claimData.fotoInovasi ? [claimData.fotoInovasi] : []);
                        setBuktiFoto((claimData.buktiFiles?.foto || claimData.images || []));
                        setSelectedVid(claimData.buktiFiles?.video?.[0] || claimData.video || "");
                        setSelectedDoc(claimData.buktiFiles?.dokumen || claimData.dokumen || []);
                        setTextInputsValue({
                            inovationName: claimData.namaInovasi || "",
                            inovatorName: claimData.namaInovator || "",
                            description: claimData.deskripsi || claimData.deskripsiInovasi || ""
                        });
                    }
                } catch (error) {
                    console.error("Error fetching claim from API:", error);
                } finally {
                    setFetchLoading(false);
                }
            };
            fetchClaim();
        }
    }, [editId]);

    const handleVerify = async () => {
        setLoading(true);
        try {
            if (id) console.log("Claim verified locally (placeholder for API verify)");
        } catch (error) {
            setError("Failed to verify claim");
        } finally {
            setLoading(false);
            onClose();
        }
    };

    const handleReject = async () => {
        setLoading(true);
        try {
            if (id) console.log("Claim rejected locally (placeholder for API reject)");
        } catch (error) {
            setError("Failed to reject claim");
        } finally {
            setLoading(false);
            setOpenModal(false);
            onClose();
        }
    };

    if (fetchLoading) return <Loading />;

    return (
        <Box>
            <form onSubmit={onSubmitForm}>
                <TopBar
                    title={isAdmin ? "Verifikasi Klaim Inovasi" : "Klaim Penerapan Inovasi"}
                    onBack={() => router.back()}
                />
                <Container>
                    <Flex flexDirection="column" gap="2px">
                        <Label>Informasi Inovasi</Label>
                        <Text2>Silahkan masukkan informasi inovator dan inovasi yang akan anda klaim penerapannya</Text2>
                    </Flex>
                    <Text fontWeight="400" fontSize="14px" mb="-2">
                        Nama Inovator <span style={{ color: "red" }}>*</span>
                    </Text>
                    <Input
                        name="inovatorName" fontSize="14px" placeholder="Nama Inovator"
                        _placeholder={{ color: "#9CA3AF" }} _focus={{ outline: "none", bg: "white", border: "none" }}
                        value={textInputsValue.inovatorName} onChange={onTextChange} required
                        disabled={!editable || loading}
                    />
                    <Text fontWeight="400" fontSize="14px" mb="-2">
                        Nama Inovasi <span style={{ color: "red" }}>*</span>
                    </Text>
                    <Input
                        name="inovationName" fontSize="14px" placeholder="Nama Inovasi"
                        _placeholder={{ color: "#9CA3AF" }} _focus={{ outline: "none", bg: "white", border: "none" }}
                        value={textInputsValue.inovationName} onChange={onTextChange} required
                        disabled={!editable || loading}
                    />
                    <Text fontWeight="400" fontSize="14px" mb="-2">
                        Deskripsi Inovasi <span style={{ color: "red" }}>*</span>
                    </Text>
                    <Flex direction="column" alignItems="flex-start">
                        <Textarea
                            name="description" fontSize="14px"
                            placeholder="Masukkan deskripsi singkat tentang inovasi"
                            _placeholder={{ color: "#9CA3AF" }} _focus={{ outline: "none", bg: "white", border: "none" }}
                            height="100px" value={textInputsValue.description} onChange={onTextChange} required
                            disabled={!editable || loading}
                        />
                        <Text fontWeight="400" fontStyle="normal" fontSize="10px" color="gray.500">
                            {getDescriptionWordCount()}/80 kata
                        </Text>
                    </Flex>
                    <Field>
                        <Flex flexDirection="column" gap="2px">
                            <Text1>Logo Inovator <span style={{ color: "red" }}>*</span></Text1>
                            <Text2>Maks 1 foto. format: png, jpg</Text2>
                            <ImageUpload
                                selectedFile={logoFiles} setSelectedFile={setLogoFiles}
                                selectFileRef={logoFileRef} onSelectImage={onSelectLogo} maxFiles={1}
                                disabled={!editable || loading}
                            />
                        </Flex>
                    </Field>
                    <Field>
                        <Flex flexDirection="column" gap="2px">
                            <Text1>Foto Inovasi <span style={{ color: "red" }}>*</span></Text1>
                            <Text2>Maks 1 foto. format: png, jpg</Text2>
                            <ImageUpload
                                selectedFile={innovationFiles} setSelectedFile={setInnovationFiles}
                                selectFileRef={innovationFileRef} onSelectImage={onSelectInnovationPhoto} maxFiles={1}
                                disabled={!editable || loading}
                            />
                        </Flex>
                    </Field>
                    <Flex flexDirection="column" gap="2px">
                        <Label>Bukti Klaim</Label>
                        <Text2>Silahkan masukkan bukti klaim penerapan inovasi</Text2>
                    </Flex>
                    <Flex flexDirection="column" gap="2px">
                        {isAdmin && claimData && (
                            <Text fontWeight="700" mb={2} fontSize="16px">Desa {claimData.namaDesa}</Text>
                        )}
                        <Label>Jenis Dokumen Bukti Klaim <span style={{ color: "red" }}>*</span></Label>
                        <Text2>Dapat lebih dari 1</Text2>
                    </Flex>
                    {claimData?.status === "Menunggu" && (
                        <StatusCard status={claimData.status} />
                    )}
                    <CheckboxGroup>
                        {["foto", "video", "dokumen"].map((type) => (
                            <JenisKlaim key={type}>
                                <input
                                    style={{
                                        transform: "scale(1.3)",
                                        marginRight: "8px",
                                        cursor: (isUploading[type as keyof typeof isUploading] || !editable || loading || disabled) ? "not-allowed" : "pointer"
                                    }}
                                    type="checkbox"
                                    onChange={() => handleCheckboxChange(type)}
                                    checked={selectedCheckboxes.includes(type)}
                                    disabled={isUploading[type as keyof typeof isUploading] || !editable || loading || disabled}
                                />
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </JenisKlaim>
                        ))}
                    </CheckboxGroup>
                    <Collapse in={selectedCheckboxes.includes("foto")} animateOpacity>
                        <Field>
                            <Flex flexDirection="column" gap="2px">
                                <Text1>Foto Bukti Klaim <span style={{ color: "red" }}>*</span></Text1>
                                <Text2>Maks 2 foto. format: png, jpg</Text2>
                                <ImageUpload
                                    selectedFile={buktiFoto}
                                    setSelectedFile={setBuktiFoto}
                                    selectFileRef={buktiFotoRef}
                                    onSelectImage={onSelectBuktiFoto}
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
                                <Text1>Video inovasi <span style={{ color: "red" }}>*</span></Text1>
                                <Text2>Maks 100 mb. Format: mp4</Text2>
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
                                <Text1>Dokumen Pendukung <span style={{ color: "red" }}>*</span></Text1>
                                <Text2>Maks 3 file, 50 mb. Format: pdf, doc, docx</Text2>
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
                    {!editable && claimData?.status === "Menunggu" && (
                        <Box mt={4}>
                            <StatusCard status="Menunggu" />
                        </Box>
                    )}
                    <Box height="150px" />
                </Container>
                <div>
                    {isAdmin ? (
                        claimData?.status === "Terverifikasi" || claimData?.status === "Ditolak" ? (
                            <StatusCard status={claimData.status} message={claimData.catatanAdmin} />
                        ) : (
                            <NavbarButton>
                                <Button width="100%" isLoading={loading} onClick={onOpen} type="button" disabled={disabled}>
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
                                        modalBody1="Apakah Anda yakin ingin menghapus pengajuan klaim ini?"
                                        modalTitle="Hapus Klaim"
                                        isLoading={loading}
                                    />
                                    {editId && (
                                        <Button
                                            flex={1}
                                            isLoading={loading}
                                            onClick={handleDeleteClaim}
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

                    <SecConfModal
                        isOpen={isModal2Open}
                        onClose={handleModal2Close}
                        modalBody2={modalBody2}
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

// Komponen utama dengan Suspense
const KlaimInovasiManual: React.FC = () => {
    return (
        <Suspense fallback={<Loading />}>
            <KlaimInovasiManualContent />
        </Suspense>
    );
};

export default KlaimInovasiManual;