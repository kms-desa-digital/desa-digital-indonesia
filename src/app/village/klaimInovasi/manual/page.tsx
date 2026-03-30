"use client";

import {
    Box,
    Button,
    Collapse,
    Flex,
    Text,
    Textarea,
    Input,
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
// import { auth, firestore, storage } from "src/firebase/clientApp";
import { auth } from "src/firebase/clientApp";
import { getVillageById, claimInnovation, updateVillage, getClaimById } from "Services/villageServices";

import {
    CheckboxGroup,
    Container,
    Field,
    JenisKlaim,
    Label,
    NavbarButton,
    Text1,
    Text2,
} from "../_styles";

import StatusCard from "Components/card/status/StatusCard";
import RejectionModal from "Components/confirmModal/RejectionModal";
import ActionDrawer from "Components/drawer/ActionDrawer";
import Loading from "Components/loading";
// import { addDoc, collection, doc, getDoc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
// import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { useUser } from "src/contexts/UserContext";
// import RecommendationDrawer from "Components/drawer/RecommendationDrawer";

const KlaimInovasiManual: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
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
    // const {
    //   isOpen: isRecOpen,
    //   onOpen: onRecOpen,
    //   onClose: onRecClose,
    // } = useDisclosure();
    const [textInputsValue, setTextInputsValue] = useState({
        inovationName: "",
        inovatorName: "",
        description: "",
    });

    const inovasiId = searchParams.get("inovasiId");
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
        if (selectedCheckboxes.includes(checkbox)) {
            // Jika checkbox sudah dipilih, hapus dari array
            setSelectedCheckboxes(
                selectedCheckboxes.filter((item) => item !== checkbox)
            );
        } else {
            // Jika checkbox belum dipilih, tambahkan ke array
            setSelectedCheckboxes([...selectedCheckboxes, checkbox]);
        }
    };

    const handleAjukanKlaim = () => {
        if (selectedCheckboxes.length === 0) {
            toast.error(
                "Minimal pilih 1 jenis bukti klaim (Foto, Video, atau Dokumen)",
                {
                    position: "top-center",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                }
            );
            return;
        }

        let isValid = true;
        if (selectedCheckboxes.includes("foto") && selectedFiles.length === 0) {
            isValid = false;
        }
        if (selectedCheckboxes.includes("video") && selectedVid === "") {
            isValid = false;
        }
        if (selectedCheckboxes.includes("dokumen") && selectedDoc.length === 0) {
            isValid = false;
        }

        if (!isValid) {
            toast.error(
                "Mohon lengkapi semua bukti klaim yang dipilih (Foto, Video, atau Dokumen)",
                {
                    position: "top-center",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                }
            );
            return;
        }

        setIsModal1Open(true);
        setDisabled(true);
    };

    const onSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const imagesArray: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                    if (readerEvent.target?.result) {
                        imagesArray.push(readerEvent.target.result as string);
                        if (imagesArray.length === files.length) {
                            setSelectedFiles((prev) => [...prev, ...imagesArray]);
                        }
                    }
                };
                reader.readAsDataURL(files[i]);
            }
        }
    };

    const onSelectVid = (event: React.ChangeEvent<HTMLInputElement>) => {
        const reader = new FileReader();
        if (event.target.files?.[0]) {
            reader.readAsDataURL(event.target.files[0]);
        }
        reader.onload = (readerEvent) => {
            if (readerEvent.target?.result) {
                setSelectedVid(readerEvent.target?.result as string);
            }
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
        console.log("Submitting manual claim via API...");
        setLoading(true);
        if (!user?.uid) {
            setError("User tidak ditemukan");
            setLoading(false);
            return;
        }

        try {
            // Fetch village detail first for metadata
            const villageRes: any = await getVillageById(user.uid);
            const village = villageRes.data || villageRes.village;

            const formData = {
                desaId: user.uid,
                namaDesa: village?.namaDesa || "",
                namaInovator: textInputsValue.inovatorName,
                namaInovasi: textInputsValue.inovationName,
                deskripsiInovasi: textInputsValue.description,
                logoInovator: selectedFiles[0] || null, // Assuming first image is logo
                fotoInovasi: selectedFiles[1] || null, // Assuming second image is innovation photo
                buktiJenis: selectedCheckboxes,
                buktiFiles: {
                    foto: selectedCheckboxes.includes("foto") ? selectedFiles : [],
                    video: selectedCheckboxes.includes("video") ? [selectedVid] : [],
                    dokumen: selectedCheckboxes.includes("dokumen") ? selectedDoc : []
                },
                isManual: true
            };

            const response: any = await claimInnovation(formData);

            setIsModal1Open(false);
            toast.success("Klaim inovasi manual berhasil diajukan", {
                position: "top-center",
                autoClose: 2000,
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
        console.log("Modal 1 Yes clicked");
        await submitClaim();
    };

    const getDescriptionWordCount = () => {
        return textInputsValue.description
            .split(/\s+/)
            .filter((word) => word !== "").length;
    };

    const onTextChange = ({
        target: { name, value },
    }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const wordCount = value.split(/\s+/).filter((word) => word !== "").length;
        if (name === "description") {
            if (wordCount <= 80) {
                setTextInputsValue((prev) => ({
                    ...prev,
                    [name]: value,
                }));
            }
        } else if (name === "inovationName") {
            if (wordCount <= 5) {
                setTextInputsValue((prev) => ({
                    ...prev,
                    [name]: value,
                }));
            }
        } else if (name === "inovatorName") {
            if (wordCount <= 5) {
                setTextInputsValue((prev) => ({
                    ...prev,
                    [name]: value,
                }));
            }
        } else {
            setTextInputsValue((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    useEffect(() => {
        // Jika salah satu modal terbuka, sembunyikan scrollbar
        if (isModal1Open || isModal2Open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = ""; // Kembalikan scrollbar jika kedua modal tertutup
        }
    }, [isModal1Open, isModal2Open]);

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
                    const response: any = await getClaimById(id as string);
                    const claimData = response.data;

                    if (claimData) {
                        console.log("Claim data from API:", JSON.stringify(claimData, null, 2));
                        setClaimData(claimData);
                        setEditable(claimData.status === undefined || claimData.status === "" || claimData.status === "Menunggu");
                        setSelectedCheckboxes(claimData.jenisDokumen || claimData.buktiJenis || []);
                        setSelectedFiles(claimData.images || []);
                        setSelectedVid(claimData.video || "");
                        setSelectedDoc(claimData.dokumen || []);
                        setTextInputsValue({
                            inovationName: claimData.namaInovasi || "",
                            inovatorName: claimData.namaInovator || "",
                            description: claimData.deskripsi || claimData.deskripsiInovasi || ""
                        });
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

    // console.log("Claim Data:", JSON.stringify(claimData, null, 2));

    const handleVerify = async () => {
        setLoading(true);
        try {
            if (id) {
                /*
                const claimRef = doc(firestore, "claimInnovations", id);
                await updateDoc(claimRef, {
                    status: "Terverifikasi",
                });
                */
                // Assuming we use updateVillage or a cross-entity verify endpoint
                console.log("Claim verified locally (placeholder for API verify)");
            }
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
            if (id) {
                /*
                const claimRef = doc(firestore, "claimInnovations", id);
                await updateDoc(claimRef, {
                    status: "Ditolak",
                    catatanAdmin: modalInput,
                });
                */
                console.log("Claim rejected locally (placeholder for API reject)");
            }
        } catch (error) {
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
                    title={isAdmin ? "Verifikasi Klaim Inovasi" : "Klaim Penerapan Inovasi"}
                    onBack={() => router.back()}
                />
                <Container>
                    <Flex flexDirection="column" gap="2px">
                        <Label>
                            Informasi Inovasi
                        </Label>
                        <Text2> Silahkan masukkan informasi inovator dan inovasi yang akan anda klaim penerapannya </Text2>
                    </Flex>
                    <Text fontWeight="400" fontSize="14px" mb="-2">
                        Nama Inovator <span style={{ color: "red" }}>*</span>
                    </Text>
                    <Input
                        name="inovatorName"
                        fontSize="14px"
                        placeholder="Nama Inovator"
                        //isDisabled={!isEditable}
                        _placeholder={{ color: "#9CA3AF" }}
                        _focus={{
                            outline: "none",
                            bg: "white",
                            border: "none",
                        }}
                        value={textInputsValue.inovatorName}
                        onChange={onTextChange}
                        required
                    />
                    <Text fontWeight="400" fontSize="14px" mb="-2">
                        Nama Inovasi <span style={{ color: "red" }}>*</span>
                    </Text>
                    <Input
                        name="inovationName"
                        fontSize="14px"
                        placeholder="Nama Inovasi"
                        //isDisabled={!isEditable}
                        _placeholder={{ color: "#9CA3AF" }}
                        _focus={{
                            outline: "none",
                            bg: "white",
                            border: "none",
                        }}
                        value={textInputsValue.inovationName}
                        onChange={onTextChange}
                        required
                    />
                    <Text fontWeight="400" fontSize="14px" mb="-2">
                        Deskripsi Inovasi <span style={{ color: "red" }}>*</span>
                    </Text>
                    <Flex direction="column" alignItems="flex-start">
                        <Textarea
                            name="description"
                            fontSize="14px"
                            placeholder="Masukkan deskripsi singkat tentang inovasi"
                            //disabled={!isEditable}
                            _placeholder={{ color: "#9CA3AF" }}
                            _focus={{
                                outline: "none",
                                bg: "white",
                                border: "none",
                            }}
                            height="100px"
                            value={textInputsValue.description}
                            onChange={onTextChange}
                            required
                        />
                        <Text
                            fontWeight="400"
                            fontStyle="normal"
                            fontSize="10px"
                            color="gray.500"
                        >
                            {getDescriptionWordCount()}/80 kata
                        </Text>
                    </Flex>
                    <Field>
                        <Flex flexDirection="column" gap="2px">
                            <Text1>
                                Logo Inovator
                            </Text1>
                            <Text2> Maks 1 foto. format: png, jpg </Text2>
                            <ImageUpload
                                selectedFile={selectedFiles}
                                setSelectedFile={setSelectedFiles}
                                selectFileRef={selectedFileRef}
                                onSelectImage={onSelectImage}
                                maxFiles={1}
                            />
                        </Flex>
                    </Field>
                    <Field>
                        <Flex flexDirection="column" gap="2px">
                            <Text1>
                                Foto Inovasi
                            </Text1>
                            <Text2> Maks 1 foto. format: png, jpg </Text2>
                            <ImageUpload
                                selectedFile={selectedFiles}
                                setSelectedFile={setSelectedFiles}
                                selectFileRef={selectedFileRef}
                                onSelectImage={onSelectImage}
                                maxFiles={1}
                            />
                        </Flex>
                    </Field>


                    <Flex flexDirection="column" gap="2px">
                        <Label>
                            Bukti Klaim
                        </Label>
                        <Text2> Silahkan masukkan bukti klaim penerapan inovasi </Text2>
                    </Flex>
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
                                    transform: "scale(1.3)", // Memperbesar checkbox
                                    marginRight: "8px", // Memberi jarak ke teks
                                }}
                                type="checkbox"
                                onChange={() => handleCheckboxChange("foto")}
                                checked={selectedCheckboxes.includes("foto")}
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
                                onChange={() => handleCheckboxChange("video")}
                                checked={selectedCheckboxes.includes("video")}
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
                                onChange={() => handleCheckboxChange("dokumen")}
                                checked={selectedCheckboxes.includes("dokumen")}
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
                            />
                        </Field>
                    </Collapse>
                    {/* <RecommendationDrawer
            innovationId={inovasiId}
            isOpen={isRecOpen}
            onClose={() => onRecClose()}
          /> */}
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
                            <Button
                                width="100%"
                                isLoading={loading}
                                onClick={handleAjukanKlaim}
                                type="button"
                                disabled={disabled}
                            >
                                Ajukan Klaim
                            </Button>
                        </NavbarButton>
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
export default KlaimInovasiManual;
