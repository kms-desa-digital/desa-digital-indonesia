"use client";

import {
    Box, Button, Collapse, Flex, Text, Textarea, Input, useDisclosure,
} from "@chakra-ui/react";
import TopBar from "Components/topBar";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import ConfModal from "src/components/confirmModal/confModal";
import SecConfModal from "src/components/confirmModal/secConfModal";
import DocUpload from "src/components/form/DocUpload";
import ImageUpload from "src/components/form/ImageUpload";
import VidUpload from "src/components/form/VideoUpload";
import { auth } from "src/firebase/clientApp";
import { getVillageById, claimInnovation, updateVillage, getClaimById } from "Services/villageServices";
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
    const modalBody2 = "Inovasi sudah ditambahkan. Admin sedang memverifikasi pengajuan klaim inovasi. Silahkan cek pada halaman pengajuan klaim";
    const [openModal, setOpenModal] = useState(false);
    const [modalInput, setModalInput] = useState("");
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [disabled, setDisabled] = useState(false);
    const [editable, setEditable] = useState(false);
    const [textInputsValue, setTextInputsValue] = useState({
        inovationName: "",
        inovatorName: "",
        description: "",
    });

    const inovasiId = searchParams.get("inovasiId");

    const { role } = useUser();
    useEffect(() => {
        setIsAdmin(role === "admin");
    }, [role]);

    const handleCheckboxChange = (checkbox: string) => {
        if (selectedCheckboxes.includes(checkbox)) {
            setSelectedCheckboxes(selectedCheckboxes.filter((item) => item !== checkbox));
        } else {
            setSelectedCheckboxes([...selectedCheckboxes, checkbox]);
        }
    };

    const handleAjukanKlaim = () => {
        if (selectedCheckboxes.length === 0) {
            toast.error("Minimal pilih 1 jenis bukti klaim (Foto, Video, atau Dokumen)", {
                position: "top-center", autoClose: 2000, hideProgressBar: false,
                closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
            });
            return;
        }

        let isValid = true;
        if (selectedCheckboxes.includes("foto") && buktiFoto.length === 0) isValid = false;
        if (selectedCheckboxes.includes("video") && selectedVid === "") isValid = false;
        if (selectedCheckboxes.includes("dokumen") && selectedDoc.length === 0) isValid = false;

        if (!isValid) {
            toast.error("Mohon lengkapi semua bukti klaim yang dipilih (Foto, Video, atau Dokumen)", {
                position: "top-center", autoClose: 2000,
            });
            return;
        }

        if (logoFiles.length === 0 || innovationFiles.length === 0 || textInputsValue.inovationName.trim() === "" || textInputsValue.inovatorName.trim() === "" || textInputsValue.description.trim() === "") {
             toast.error("Mohon lengkapi seluruh informasi inovasi yang bertanda (*)", {
                position: "top-center", autoClose: 2000,
            });
            return;
        }

        setIsModal1Open(true);
        setDisabled(true);
    };

    const onSelectLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                if (readerEvent.target?.result) {
                    setLogoFiles([readerEvent.target.result as string]);
                }
            };
            reader.readAsDataURL(files[0]);
        }
    };

    const onSelectInnovationPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                if (readerEvent.target?.result) {
                    setInnovationFiles([readerEvent.target.result as string]);
                }
            };
            reader.readAsDataURL(files[0]);
        }
    };

    const onSelectBuktiFoto = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const imagesArray: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                    if (readerEvent.target?.result) {
                        imagesArray.push(readerEvent.target.result as string);
                        if (imagesArray.length === files.length) {
                            setBuktiFoto((prev) => [...prev, ...imagesArray].slice(0, 2));
                        }
                    }
                };
                reader.readAsDataURL(files[i]);
            }
        }
    };

    const onSelectVid = (event: React.ChangeEvent<HTMLInputElement>) => {
        const reader = new FileReader();
        if (event.target.files?.[0]) reader.readAsDataURL(event.target.files[0]);
        reader.onload = (readerEvent) => {
            if (readerEvent.target?.result) setSelectedVid(readerEvent.target?.result as string);
        };
    };

    const onSelectDoc = (event: React.ChangeEvent<HTMLInputElement>) => {
        const doc = event.target.files;
        if (doc) {
            const docArray: string[] = [];
            for (let i = 0; i < doc.length; i++) {
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                    if (readerEvent.target?.result) {
                        docArray.push(readerEvent.target.result as string);
                        if (docArray.length === doc.length) {
                            setSelectedDoc((prev) => [...prev, ...docArray]);
                        }
                    }
                };
                reader.readAsDataURL(doc[i]);
            }
        }
    };

    const onSubmitForm = async (event: React.FormEvent<HTMLElement>) => {
        event.preventDefault();
        submitClaim();
        setEditable(false);
    };

    const submitClaim = async () => {
        setLoading(true);
        if (!user?.uid) {
            setError("User tidak ditemukan");
            setLoading(false);
            return;
        }

        try {
            const villageRes: any = await getVillageById(user.uid);
            const village = villageRes.data || villageRes.village;

            const formData = {
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
                isManual: true
            };

            const response: any = await claimInnovation(formData);

            setIsModal1Open(false);
            toast.success("Klaim inovasi manual berhasil diajukan", {
                position: "top-center", autoClose: 2000,
            });

            const newClaimId = response.claimId || response.data?.claimId;
            if (newClaimId) {
                router.push(`/village/klaimInovasi/detail/${newClaimId}`);
            } else {
                router.push(`/village/pengajuan/${user?.uid}`);
            }
        } catch (error) {
            console.error("Error submitting manual claim:", error);
            setError("Gagal mengajukan klaim manual.");
            toast.error("Gagal mengajukan klaim");
        } finally {
            setLoading(false);
        }
    };

    const [isModal1Open, setIsModal1Open] = useState(false);
    const [isModal2Open, setIsModal2Open] = useState(false);
    const closeModal = () => {
        setIsModal1Open(false);
        setIsModal2Open(false);
    };

    const handleModal1Yes = async () => {
        await submitClaim();
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
    }, [isModal1Open, isModal2Open]);

    useEffect(() => {
        if (id) {
            const fetchClaim = async () => {
                setFetchLoading(true);
                try {
                    const response: any = await getClaimById(id as string);
                    const claimData = response.data;
                    if (claimData) {
                        setClaimData(claimData);
                        setEditable(claimData.status === undefined || claimData.status === "" || claimData.status === "Menunggu");
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
    }, [id]);

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
                    />
                    <Text fontWeight="400" fontSize="14px" mb="-2">
                        Nama Inovasi <span style={{ color: "red" }}>*</span>
                    </Text>
                    <Input
                        name="inovationName" fontSize="14px" placeholder="Nama Inovasi"
                        _placeholder={{ color: "#9CA3AF" }} _focus={{ outline: "none", bg: "white", border: "none" }}
                        value={textInputsValue.inovationName} onChange={onTextChange} required
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
                    <CheckboxGroup>
                        {["foto", "video", "dokumen"].map((type) => (
                            <JenisKlaim key={type}>
                                <input
                                    style={{ transform: "scale(1.3)", marginRight: "8px" }}
                                    type="checkbox"
                                    onChange={() => handleCheckboxChange(type)}
                                    checked={selectedCheckboxes.includes(type)}
                                />
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </JenisKlaim>
                        ))}
                    </CheckboxGroup>
                    <Collapse in={selectedCheckboxes.includes("foto")} animateOpacity>
                        <Field>
                            <Flex flexDirection="column" gap="2px">
                                <Text1>Foto Inovasi <span style={{ color: "red" }}>*</span></Text1>
                                <Text2>Maks 2 foto. format: png, jpg</Text2>
                                <ImageUpload
                                    selectedFile={buktiFoto} setSelectedFile={setBuktiFoto}
                                    selectFileRef={buktiFotoRef} onSelectImage={onSelectBuktiFoto} maxFiles={2}
                                    disabled={!editable || loading}
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
                                selectedVid={selectedVid} setSelectedVid={setSelectedVid}
                                selectVidRef={selectedVidRef} onSelectVid={onSelectVid}
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
                                selectedDoc={selectedDoc} setSelectedDoc={setSelectedDoc}
                                selectDocRef={selectedDocRef} onSelectDoc={onSelectDoc}
                                disabled={!editable || loading}
                            />
                        </Field>
                    </Collapse>
                    <Box height="100px" />
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
                            <Button width="100%" isLoading={loading} onClick={handleAjukanKlaim} type="button" disabled={disabled}>
                                Ajukan Klaim
                            </Button>
                        </NavbarButton>
                    )}
                    <ConfModal isOpen={isModal1Open} onClose={closeModal} modalTitle="" modalBody1={modalBody1} onYes={handleModal1Yes} isLoading={loading} />
                    <SecConfModal isOpen={isModal2Open} onClose={closeModal} modalBody2={modalBody2} />
                    <RejectionModal isOpen={openModal} onClose={() => setOpenModal(false)} onConfirm={handleReject} message={modalInput} setMessage={setModalInput} loading={loading} />
                    <ActionDrawer isOpen={isOpen} onClose={onClose} setOpenModal={setOpenModal} isAdmin={isAdmin} loading={loading} onVerify={handleVerify} role="admin" />
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