"use client";

import {
    Alert,
    Box,
    Button,
    Select as ChakraSelect,
    Flex,
    Stack,
    Text,
    useToast,
} from "@chakra-ui/react";
import { NavbarButton } from "../../village/profile/[id]/_styles";
import Container from "Components/container";
import FormSection from "Components/form/FormSection";
import TopBar from "Components/topBar";
import { getInnovatorById, createInnovator, updateInnovator } from "Services/innovatorServices";
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadString,
} from "firebase/storage";
import React, { useEffect, useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import ReactSelect from "react-select";
import HeaderUpload from "Components/form/HeaderUpload";
import LogoUpload from "Components/form/LogoUpload";
import { auth, firestore, storage } from "src/firebase/clientApp";
import ConfModal from "Components/confirmModal/confModal";
import SecConfModal from "Components/confirmModal/secConfModal";

const categories = [
    "Agribisnis",
    "Akademisi",
    "Dibawah Pemerintah",
    "Layanan Finansial",
    "Lembaga Swadaya Masyarakat (LSM)",
    "Organisasi Pertanian",
    "Pemerintah Daerah",
    "Perusahaan",
    "Start Up",
    "UMKM",
];

const businessModels = [
    "Layanan Berbayar",
    "Layanan Gratis",
    "Layanan Subsidi",
];

const InnovatorForm: React.FC = () => {
    const router = useRouter();
    const [user] = useAuthState(auth);

    const [selectedCategory, setSelectedCategory] = useState<{
        label: string;
        value: string;
    } | null>(null);
    const [owner, setOwner] = useState(false);
    const [selectedLogo, setSelectedLogo] = useState<string>("");
    const [selectedHeader, setSelectedHeader] = useState<string>("");
    const selectLogoRef = useRef<HTMLInputElement>(null);
    const selectHeaderRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [textInputsValue, setTextInputsValue] = useState({
        name: "",
        description: "",
        instagram: "",
        website: "",
        whatsapp: "",
    });
    const toast = useToast();
    const [isEditable, setIsEditable] = useState(true);
    const [status, setStatus] = useState("");
    const [alertStatus, setAlertStatus] = useState<
        "info" | "warning" | "error" | undefined
    >("warning");
    const [alertMessage, setAlertMessage] = useState(
        "Profil masih kosong. Silahkan isi data di bawah terlebih dahulu"
    );

    const [submitEvent, setSubmitEvent] = useState<React.FormEvent<HTMLFormElement> | null>(null);
    const [isFormLocked, setIsFormLocked] = useState(false);
    const [confirmedSubmit, setConfirmedSubmit] = useState(false);
    const modalBody1 = "Apakah anda yakin ingin mendaftarkan profil?"; // Konten Modal
    const modalBody2 = "Profil sudah didaftarkan. Admin sedang memverifikasi pengajuan daftar profil"; // Konten Modal
    const [isModal1Open, setIsModal1Open] = useState(false);
    const [isModal2Open, setIsModal2Open] = useState(false);
    const closeModal = () => {
        setIsModal1Open(false);
        setIsModal2Open(false);
    };

    const handleModal1Yes = () => {
        setIsModal1Open(false); //tutup modal pertama
        setIsModal2Open(true);
        setConfirmedSubmit(true);
        if (submitEvent) {
            onSubmitForm(submitEvent); // Kirim data form
        }
    };

    useEffect(() => {
        if (confirmedSubmit) {
            setIsFormLocked(true);
            setIsModal2Open(true);
            setConfirmedSubmit(false);
        }
    }, [confirmedSubmit]);


    const isFormValid = () => {
        return (
            selectedCategory !== null &&
            selectedLogo.trim() !== "" &&
            selectedHeader.trim() !== "" &&
            textInputsValue.name.trim() !== "" &&
            textInputsValue.description.trim() !== "" &&
            textInputsValue.whatsapp.trim() !== ""
        );
    };

    const categoryOptions = categories.map((category) => ({
        label: category, // Label yang ditampilkan pada dropdown
        value: category.toLowerCase().replace(/\s+/g, "-"), // Menggunakan format value yang lebih aman
    }));

    const onSelectLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
        const reader = new FileReader();
        if (event.target.files?.[0]) {
            reader.readAsDataURL(event.target.files[0]);
        }
        reader.onload = (readerEvent) => {
            if (readerEvent.target?.result) {
                setSelectedLogo(readerEvent.target?.result as string);
            }
        };
    };

    const onSelectHeader = (event: React.ChangeEvent<HTMLInputElement>) => {
        const reader = new FileReader();
        if (event.target.files?.[0]) {
            reader.readAsDataURL(event.target.files[0]);
        }
        reader.onload = (readerEvent) => {
            if (readerEvent.target?.result) {
                setSelectedHeader(readerEvent.target?.result as string);
            }
        };
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
        } else if (name === "name") {
            if (wordCount <= 10) {
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

    const getNameWordCount = () => {
        return textInputsValue.name
            .split(/\s+/)
            .filter((word) => word !== "").length;
    };

    const getDescriptionWordCount = () => {
        return textInputsValue.description
            .split(/\s+/)
            .filter((word) => word !== "").length;
    };

    const handleCategoryChange = (
        selectedOption: { label: string; value: string } | null
    ) => {
        setSelectedCategory(selectedOption);
    };

    const onSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        // Ensure user and user.uid are defined
        if (!user?.uid) {
            setError("User ID is not defined. Please make sure you are logged in.");
            setLoading(false);
            return;
        }

        try {
            const { name, description, instagram, website, whatsapp } =
                textInputsValue;

            const userId = user.uid;
            let innovatorData: any = null;
            try {
                const res: any = await getInnovatorById(userId);
                innovatorData = res.data;
            } catch (err) {
                console.log("No existing innovator profile found for user:", userId);
            }

            if (status === "Ditolak") {
                let logoUrl = innovatorData?.logo;
                let headerUrl = innovatorData?.header;

                if (selectedLogo && selectedLogo !== innovatorData?.logo) {
                    if (innovatorData?.logo && innovatorData.logo.startsWith("http")) {
                        // Optional: Delete from storage if you want
                    }
                    const logoRef = ref(storage, `innovators/${userId}/logo`);
                    await uploadString(logoRef, selectedLogo, "data_url");
                    logoUrl = await getDownloadURL(logoRef);
                    console.log("Logo updated: ", logoUrl);
                }

                if (selectedHeader && selectedHeader !== innovatorData?.header) {
                    const headerRef = ref(storage, `innovators/${userId}/header`);
                    await uploadString(headerRef, selectedHeader, "data_url");
                    headerUrl = await getDownloadURL(headerRef);
                    console.log("Header updated: ", headerUrl);
                }

                const updatePayload = {
                    namaInovator: name,
                    deskripsi: description,
                    kategori: selectedCategory?.label,
                    instagram,
                    website,
                    whatsapp,
                    logo: logoUrl,
                    header: headerUrl,
                    status: "Menunggu",
                };

                await updateInnovator(userId, updatePayload);
                console.log("Innovator updated via API: ", userId);
                setStatus("Menunggu");
                setAlertStatus("info");
            } else {
                // Add new/Set
                let logoUrl = null;
                let headerUrl = null;

                if (selectedLogo) {
                    const logoRef = ref(storage, `innovators/${userId}/logo`);
                    await uploadString(logoRef, selectedLogo, "data_url");
                    logoUrl = await getDownloadURL(logoRef);
                } else {
                    setError("Logo harus diisi");
                    setLoading(false);
                    return;
                }

                if (selectedHeader) {
                    const headerRef = ref(storage, `innovators/${userId}/header`);
                    await uploadString(headerRef, selectedHeader, "data_url");
                    headerUrl = await getDownloadURL(headerRef);
                }

                const createPayload = {
                    userId,
                    namaInovator: name,
                    deskripsi: description,
                    kategori: selectedCategory?.label,
                    instagram,
                    website,
                    whatsapp,
                    logo: logoUrl,
                    header: headerUrl,
                    status: "Menunggu",
                };

                await createInnovator(createPayload);
                console.log("Innovator created via API: ", userId);
                setStatus("Menunggu");
                setAlertStatus("info");
            }
            toast({
                title: "Profile berhasil dibuat",
                status: "success",
                duration: 1000,
                isClosable: true,
                position: "top",
            });
        } catch (error) {
            console.error("Error adding document: ", error);
            setLoading(false);
            setError("Error adding document");
            toast({
                title: "Error",
                description: "Terjadi kesalahan saat menambahkan dokumen.",
                status: "error",
                duration: 1000,
                isClosable: true,
                position: "top",
            });
        }
        setLoading(false);
        setIsEditable(false);
        setAlertStatus("info");
    };

    useEffect(() => {
        const fetchData = async () => {
            const userId = user?.uid;
            if (userId) {
                try {
                    const res: any = await getInnovatorById(userId);
                    const data = res.data;
                    if (data) {
                        setTextInputsValue({
                            name: data.namaInovator || "",
                            description: data.deskripsi || "",
                            instagram: data.instagram || "",
                            website: data.website || "",
                            whatsapp: data.whatsapp || "",
                        });
                        setSelectedCategory({
                            label: data.kategori,
                            value: data.kategori ? data.kategori.toLowerCase().replace(/\s+/g, "-") : "",
                        });
                        setSelectedLogo(data?.logo || "");
                        setSelectedHeader(data?.header || "");
                        setStatus(data.status);

                        if (data.status === "Menunggu") {
                            setAlertStatus("info");
                            setIsEditable(false);
                            setStatus("Menunggu");
                            setAlertMessage(
                                `Profil sudah didaftarkan. Menunggu verifikasi admin.`
                            );
                        } else if (data.status === "Ditolak") {
                            setAlertStatus("error");
                            setIsEditable(true);
                            setStatus("Ditolak");
                            setAlertMessage(
                                `Profil ditolak dengan catatan: ${data.catatanAdmin || ""}`
                            );
                        }
                    }
                } catch (err) {
                    console.error("Error fetching data from API:", err);
                }
            }
        };
        fetchData();
    }, [user]);

    useEffect(() => {
        const checkIfOwner = async () => {
            if (user?.uid) {
                try {
                    const res: any = await getInnovatorById(user.uid);
                    if (res.data) {
                        setOwner(true);
                        // setStatus(res.data.status); 
                    } else {
                        setOwner(false);
                    }
                } catch (err) {
                    setOwner(false);
                }
            }
        };
        checkIfOwner();
    }, [user]);

    const customStyles = {
        control: (styles: any) => ({
            ...styles,
            fontSize: "14px",
            borderColor: "#none",
            boxShadow: "none",
            ":hover": {
                borderColor: "#3367D1",
            },
        }),
        menu: (base: any) => ({
            ...base,
            marginTop: 0,
            zIndex: 10,
        }),
        option: (base: any, state: { isFocused: any }) => ({
            ...base,
            fontSize: "14px",
            padding: "2px 10px",
            backgroundColor: state.isFocused ? "#E5E7EB" : "white",
            color: "black",
            cursor: "pointer",
            ":active": {
                backgroundColor: "#D1D5DB",
            },
        }),
        placeholder: (base: any) => ({
            ...base,
            color: "#9CA3AF",
        }),
    };

    return (
        <>
            <TopBar
                title={owner ? "Edit Profil Inovator" : "Register Inovator"}
                onBack={() => router.back()} />
            <Box p="16px">
                <form
                    id="InnovatorForm"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (isFormValid()) {
                            setSubmitEvent(e); // Simpan event
                            setIsModal1Open(true); // Tampilkan modal
                        }
                    }}
                >
                    <Flex direction="column" marginTop="50px" marginBottom={16}>
                        <Alert
                            status={alertStatus}
                            fontSize={12}
                            borderRadius={4}
                            padding="8px"
                            mb={4}
                        >
                            {alertMessage}
                        </Alert>
                        <Stack spacing="8px" width="100%">
                            <FormSection
                                title="Nama Inovator"
                                name="name"
                                placeholder="Nama Inovator"
                                value={textInputsValue.name}
                                onChange={onTextChange}
                                wordCount={getNameWordCount()}
                                maxWords={10}
                                disabled={!isEditable || isFormLocked}
                                isRequired
                            />
                            <Text fontWeight="400" fontSize="14px" mb="-2">
                                Kategori Inovator <span style={{ color: "red" }}>*</span>
                            </Text>

                            <ReactSelect
                                placeholder="Pilih kategori"
                                options={categoryOptions}
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                styles={customStyles}
                                isClearable
                                isSearchable
                                isDisabled={!isEditable || isFormLocked}
                            />

                            <FormSection
                                isTextArea
                                title="Deskripsi Inovator"
                                name="description"
                                placeholder="Deskripsi singkat tentang inovator"
                                value={textInputsValue.description}
                                onChange={onTextChange}
                                wordCount={getDescriptionWordCount()}
                                maxWords={80}
                                disabled={!isEditable || isFormLocked}
                                isRequired
                            />

                            <Text fontWeight="400" fontSize="14px" mb="-2">
                                Logo Inovator <span style={{ color: "red" }}>*</span>
                            </Text>
                            <Flex direction="column" alignItems="flex-start">
                                <Text
                                    fontWeight="400"
                                    fontStyle="normal"
                                    fontSize="10px"
                                    color="#9CA3AF"
                                    mb="-2"
                                >
                                    Maks 1 foto, format: png, jpg.
                                </Text>
                                <LogoUpload
                                    selectedLogo={selectedLogo}
                                    setSelectedLogo={setSelectedLogo}
                                    selectFileRef={selectLogoRef}
                                    onSelectLogo={onSelectLogo}
                                    disabled={!isEditable || isFormLocked}
                                />
                            </Flex>
                            <Text fontWeight="400" fontSize="14px" mb="-2">
                                Header Inovator <span style={{ color: "red" }}>*</span>
                            </Text>
                            <Flex direction="column" alignItems="flex-start">
                                <Text
                                    fontWeight="400"
                                    fontStyle="normal"
                                    fontSize="10px"
                                    color="#9CA3AF"
                                >
                                    Maks 1 foto, format: png, jpg.
                                </Text>
                                <HeaderUpload
                                    selectedHeader={selectedHeader}
                                    setSelectedHeader={setSelectedHeader}
                                    selectFileRef={selectHeaderRef}
                                    onSelectHeader={onSelectHeader}
                                    disabled={!isEditable || isFormLocked}

                                />
                            </Flex>

                            <Text fontWeight="700" fontSize="16px">
                                Kontak Inovator
                            </Text>
                            <FormSection
                                title="Nomor WhatsApp"
                                name="whatsapp"
                                placeholder="628123456789"
                                type="number"
                                value={textInputsValue.whatsapp}
                                onChange={onTextChange}
                                disabled={!isEditable || isFormLocked}
                                isRequired={true}
                            />
                            <FormSection
                                title="Instagram"
                                name="instagram"
                                placeholder="https://instagram.com/username"
                                type="url"
                                value={textInputsValue.instagram}
                                disabled={!isEditable || isFormLocked}
                                onChange={onTextChange}
                                isRequired={false}
                            />
                            <FormSection
                                title="Website"
                                name="website"
                                placeholder="https://website.com"
                                type="url"
                                value={textInputsValue.website}
                                disabled={!isEditable || isFormLocked}
                                onChange={onTextChange}
                                isRequired={false}
                            />
                        </Stack>
                    </Flex>
                </form >
            </Box>
            {error && (
                <Text color="red" fontSize="10pt" textAlign="center" mt={2}>
                    {error}
                </Text>
            )}
            {status !== "Menunggu" && (
                <>
                    <NavbarButton style={{ zIndex: 999 }}>
                        <Button
                            type="submit"
                            form="InnovatorForm"
                            width="100%"
                            isLoading={loading}
                            onClick={() => {
                                if (isFormValid()) {
                                    setIsModal1Open(true);
                                } else {
                                    toast({
                                        title: "Form belum lengkap!",
                                        description: "Harap isi semua field wajib.",
                                        status: "error",
                                        duration: 3000,
                                        position: "top",
                                        isClosable: true,
                                    });
                                }
                            }}
                        >
                            {user?.uid ? (
                                // Jika status sudah "Ditolak" dan pengguna adalah owner
                                status === "Ditolak"
                                    ? "Kirim Ulang"
                                    : owner
                                        ? "Update Inovator" // Jika owner, tombol berubah jadi "Update Inovator"
                                        : "Daftarkan Akun" // Jika bukan owner, tetap "Daftarkan Akun"
                            ) : (
                                "Daftarkan Akun" // Jika tidak ada user yang terautentikasi, tetap "Daftarkan Akun"
                            )}
                        </Button>
                    </NavbarButton>
                    <ConfModal
                        isOpen={isModal1Open}
                        onClose={closeModal}
                        modalTitle=""
                        modalBody1={modalBody1} // Mengirimkan teks konten modal
                        onYes={handleModal1Yes}
                    />
                    <SecConfModal
                        isOpen={isModal2Open}
                        onClose={closeModal}
                        modalBody2={modalBody2} // Mengirimkan teks konten modal
                    />
                </>
            )}
        </>
    );
};

export default InnovatorForm;
