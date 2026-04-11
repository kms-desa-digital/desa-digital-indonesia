"use client";

import {
    Alert,
    Box,
    Button,
    Flex,
    Stack,
    Text,
    useToast,
} from "@chakra-ui/react";
import { NavbarButton } from "../profile/[id]/_styles";
import MultiSellect from "Components/form/MultiSellect";
import TopBar from "Components/topBar";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "src/firebase/clientApp";
import FormSection from "Components/form/FormSection";
import HeaderUpload from "Components/form/HeaderUpload";
import ImageUpload from "Components/form/ImageUpload";
import LogoUpload from "Components/form/LogoUpload";
import LocationSelector from "Components/form/LocationSellector";
import { getVillageById, createVillage, updateVillage } from "Services/villageServices";
import {
    getDistricts,
    getProvinces,
    getRegencies,
    getVillages,
} from "src/services/locationServices";
import ConfModal from "Components/confirmModal/confModal";
import SecConfModal from "Components/confirmModal/secConfModal";
import {
    ref,
    uploadString,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { storage } from "src/firebase/clientApp";

interface Option {
    value: string;
    label: string;
}

const AddVillage: React.FC = () => {
    const router = useRouter();
    const [user] = useAuthState(auth);

    const [selectedLogo, setSelectedLogo] = useState<string>("");
    const [selectedHeader, setSelectedHeader] = useState<string>("");
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const selectedLogoRef = useRef<HTMLInputElement>(null);
    const selectedHeaderRef = useRef<HTMLInputElement>(null);
    const selectedFileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [isEditable, setIsEditable] = useState(true);
    const [isFormLocked, setIsFormLocked] = useState(false);
    const [confirmedSubmit, setConfirmedSubmit] = useState(false);
    const [submitEvent, setSubmitEvent] = useState<React.FormEvent<HTMLFormElement> | null>(null);
    const toast = useToast();
    const [textInputValue, setTextInputValue] = useState({
        name: "",
        description: "",
        geografis: "",
        infrastruktur: "",
        kesiapan: "",
        teknologi: "",
        pelayanan: "",
        sosial: "",
        resource: "",
        whatsapp: "",
        instagram: "",
        website: "",
    });
    const potensiDesa = [
        { value: "pertanian", label: "Pertanian" },
        { value: "perikanan", label: "Perikanan" },
        { value: "peternakan", label: "Peternakan" },
        { value: "pariwisata", label: "Pariwisata" },
        { value: "industri", label: "Industri" },
    ];
    const [provinces, setProvinces] = useState<Option[]>([]);
    const [regencies, setRegencies] = useState<Option[]>([]);
    const [districts, setDistricts] = useState<Option[]>([]);
    const [villages, setVillages] = useState<Option[]>([]);

    const [selectedProvince, setSelectedProvince] = useState<Option | null>(null);
    const [selectedRegency, setSelectedRegency] = useState<Option | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<Option | null>(null);
    const [selectedVillage, setSelectedVillage] = useState<Option | null>(null);

    type DropdownValue = {
        kondisijalan: string | null;
        jaringan: string | null;
        listrik: string | null;
        teknologi: string | null;
        kemampuan: string | null;
    };

    const [dropdownValue, setDropdownValue] = useState<DropdownValue>({
        kondisijalan: null,
        jaringan: null,
        listrik: null,
        teknologi: null,
        kemampuan: null,
    });

    const [selectedPotensi, setSelectedPotensi] = useState<
        { value: string; label: string }[]
    >([]);

    const [alertStatus, setAlertStatus] = useState<"info" | "warning" | "error">(
        "warning"
    );
    const [alertMessage, setAlertMessage] = useState(
        "Profil masih kosong. Silahkan isi data di bawah terlebih dahulu."
    );

    const modalBody1 = "Apakah anda yakin ingin mendaftarkan profil?";
    const modalBody2 = "Profil sudah didaftarkan. Admin sedang memverifikasi pengajuan daftar profil";

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
            textInputValue.name.trim() !== "" &&
            selectedProvince !== null &&
            selectedRegency !== null &&
            selectedDistrict !== null &&
            selectedVillage !== null &&
            selectedPotensi.length > 0 &&
            selectedLogo.trim() !== "" &&
            selectedHeader.trim() !== "" &&
            selectedFiles.length > 0 &&
            textInputValue.description.trim() !== "" &&
            textInputValue.geografis.trim() !== "" &&
            textInputValue.sosial.trim() !== "" &&
            textInputValue.resource.trim() !== "" &&
            textInputValue.whatsapp.trim() !== "" &&
            dropdownValue.kondisijalan !== null &&
            dropdownValue.jaringan !== null &&
            dropdownValue.listrik !== null &&
            dropdownValue.teknologi !== null &&
            dropdownValue.kemampuan !== null
        );
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
        }
    }

    const fetchProvinces = async () => {
        try {
            const provincesData = await getProvinces();
            setProvinces(
                provincesData.map((loc) => ({ value: loc.id, label: loc.name }))
            );
        } catch (error) {
            console.error("Error fetching provinces:", error);
        }
    };

    const fetchRegencies = async (provinceId: string) => {
        try {
            const regenciesData = await getRegencies(provinceId);
            setRegencies(
                regenciesData.map((loc) => ({ value: loc.id, label: loc.name }))
            );
        } catch (error) {
            console.error("Error fetching regencies:", error);
        }
    };

    const fetchDistricts = async (regencyId: string) => {
        try {
            const districtsData = await getDistricts(regencyId);
            setDistricts(
                districtsData.map((loc) => ({ value: loc.id, label: loc.name }))
            );
        } catch (error) {
            console.error("Error fetching districts:", error);
        }
    };

    const fetchVillages = async (districtId: string) => {
        try {
            const villagesData = await getVillages(districtId);
            setVillages(
                villagesData.map((loc) => ({ value: loc.id, label: loc.name }))
            );
        } catch (error) {
            console.error("Error fetching villages:", error);
        }
    };

    useEffect(() => {
        fetchProvinces();
    }, []);

    const handleProvinceChange = (selected: Option | null) => {
        setSelectedProvince(selected);
        setSelectedRegency(null);
        setSelectedDistrict(null);
        setSelectedVillage(null);
        setRegencies([]);
        setDistricts([]);
        setVillages([]);
        if (selected) fetchRegencies(selected.value);
    };

    const handleRegencyChange = (selected: Option | null) => {
        setSelectedRegency(selected);
        setSelectedDistrict(null);
        setSelectedVillage(null);
        setDistricts([]);
        setVillages([]);
        if (selected) fetchDistricts(selected.value);
    };

    const handleDistrictChange = (selected: Option | null) => {
        setSelectedDistrict(selected);
        setSelectedVillage(null);
        setVillages([]);
        if (selected) fetchVillages(selected.value);
    };

    const handleVillageChange = (selected: Option | null) => {
        setSelectedVillage(selected);
    };


    const onSelectImage = (
        event: React.ChangeEvent<HTMLInputElement>,
        maxFiles: number
    ) => {
        const files = event.target.files;
        if (files) {
            const imagesArray: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                    if (readerEvent.target?.result) {
                        imagesArray.push(readerEvent.target.result as string);

                        if (imagesArray.length === files.length) {
                            setSelectedFiles((prev: any) => {
                                // Cegah lebih dari maxFiles
                                if (prev.length + imagesArray.length > maxFiles) {
                                    const availableSlots = maxFiles - prev.length;
                                    return [...prev, ...imagesArray.slice(0, availableSlots)];
                                }
                                return [...prev, ...imagesArray];
                            });
                        }
                    }
                };
                reader.readAsDataURL(files[i]);
            }
        }
    };
    const onSelectLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedLogo(reader.result as string); // menyimpan data URL ke state
            };
            reader.readAsDataURL(file); // Membaca file sebagai data URL
        }
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
        if (
            textInputValue.name ||
            textInputValue.whatsapp ||
            textInputValue.instagram ||
            textInputValue.website
        ) {
            setTextInputValue((prev: any) => ({ ...prev, [name]: value }));
        } else if (textInputValue.description) {
            if (wordCount <= 100) {
                setTextInputValue((prev: any) => ({ ...prev, [name]: value }));
            }
        } else {
            if (wordCount <= 30) {
                setTextInputValue((prev: any) => ({ ...prev, [name]: value }));
            }
        }
    };

    const currentWordCount = (text: string) => {
        return text.split(/\s+/).filter((word) => word !== "").length;
    };

    const onSubmitForm = async (event: React.FormEvent<HTMLElement>) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        if (!user?.uid) {
            setError("User ID is not defined. Please make sure you are logged in.");
            setLoading(false);
            return;
        }

        try {
            const {
                name,
                description,
                geografis,
                infrastruktur,
                kesiapan,
                teknologi,
                pelayanan,
                sosial,
                resource,
                whatsapp,
                instagram,
                website,
            } = textInputValue;

            const { kondisijalan, jaringan, listrik, teknologi: teknologiDropdown, kemampuan } = dropdownValue;

            const userId = user.uid;
            let logoUrl = selectedLogo;
            let headerUrl = selectedHeader;
            let imageUrls = selectedFiles;

            // Upload Logo to Storage if it's base64
            if (selectedLogo && selectedLogo.startsWith("data:image")) {
                const logoRef = ref(storage, `villages/${userId}/logo`);
                await uploadString(logoRef, selectedLogo, "data_url");
                logoUrl = await getDownloadURL(logoRef);
                console.log("Logo uploaded to storage");
            }

            // Upload Header to Storage if it's base64
            if (selectedHeader && selectedHeader.startsWith("data:image")) {
                const headerRef = ref(storage, `villages/${userId}/header`);
                await uploadString(headerRef, selectedHeader, "data_url");
                headerUrl = await getDownloadURL(headerRef);
                console.log("Header uploaded to storage");
            }

            // Upload Gallery Images to Storage if they are base64
            const uploadedImageUrls = await Promise.all(
                selectedFiles.map(async (file, index) => {
                    if (file && file.startsWith("data:image")) {
                        const imageRef = ref(storage, `villages/${userId}/gallery/image_${index}`);
                        await uploadString(imageRef, file, "data_url");
                        return await getDownloadURL(imageRef);
                    }
                    return file; // Already URL
                })
            );
            imageUrls = uploadedImageUrls;

            const villagePayload = {
                namaDesa: name,
                userId: userId,
                deskripsi: description,
                potensiDesa: selectedPotensi.map((potensi: any) => potensi.value),
                geografisDesa: geografis,
                infrastrukturDesa: infrastruktur,
                kesiapanDigital: kesiapan,
                kesiapanTeknologi: teknologi,
                pemantapanPelayanan: pelayanan,
                sosialBudaya: sosial,
                sumberDaya: resource,
                whatsapp: whatsapp,
                instagram: instagram,
                website: website,
                lokasi: {
                    provinsi: selectedProvince,
                    kabupatenKota: selectedRegency,
                    kecamatan: selectedDistrict,
                    desaKelurahan: selectedVillage,
                },
                status: "Menunggu",
                kondisijalan: kondisijalan || "",
                jaringan: jaringan || "",
                listrik: listrik || "",
                teknologi: teknologiDropdown || "",
                kemampuan: kemampuan || "",
                logo: logoUrl,
                header: headerUrl,
                images: imageUrls
            };

            if (status === "Ditolak" || status === "Terverifikasi") {
                await updateVillage(userId, villagePayload);
                console.log("Village updated via API (Storage URLs stored)");
            } else {
                await createVillage(villagePayload);
                console.log("Village created via API (Storage URLs stored)");
            }
            setStatus("Menunggu");

            toast({
                title: "Profile berhasil disimpan",
                status: "success",
                duration: 5000,
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
                duration: 5000,
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
            if (!user) {
                setError("User is not logged in.");
                return;
            }
            try {
                const response: any = await getVillageById(user.uid);
                const data = response.village || response.data || response;
                if (data) {
                    // Set nilai form dengan data yang diambil dari API
                    setTextInputValue({
                        name: data.namaDesa || "",
                        description: data.deskripsi || "",
                        geografis: data.geografisDesa || "",
                        infrastruktur: data.infrastrukturDesa || "",
                        kesiapan: data.kesiapanDigital || "",
                        teknologi: data.kesiapanTeknologi || "",
                        pelayanan: data.pemantapanPelayanan || "",
                        sosial: data.sosialBudaya || "",
                        resource: data.sumberDaya || "",
                        whatsapp: data.whatsapp || "",
                        instagram: data.instagram || "",
                        website: data.website || "",
                    });

                    setDropdownValue({
                        kondisijalan: data.kondisijalan || null,
                        jaringan: data.jaringan || null,
                        listrik: data.listrik || null,
                        teknologi: data.teknologi || null,
                        kemampuan: data.kemampuan || null,
                    });

                    setSelectedPotensi(
                        (data.potensiDesa || []).map((potensi: string) => ({
                            value: potensi,
                            label: potensi.charAt(0).toUpperCase() + potensi.slice(1),
                        }))
                    );

                    setSelectedLogo(data.logo || "");
                    setSelectedHeader(data.header || "");
                    setSelectedFiles(data.images || []);

                    setSelectedProvince(data.lokasi?.provinsi);
                    setSelectedRegency(data.lokasi?.kabupatenKota);
                    setSelectedDistrict(data.lokasi?.kecamatan);
                    setSelectedVillage(data.lokasi?.desaKelurahan);

                    if (data.status === "Menunggu") {
                        setIsEditable(false);
                        setStatus("Menunggu");
                        setAlertStatus("info");
                        setAlertMessage(`Profil sudah didaftarkan. Menunggu verifikasi admin.`);
                    } else if (data.status === "Ditolak") {
                        setIsEditable(true);
                        setStatus("Ditolak");
                        setAlertStatus("error");
                        setAlertMessage(`Pengajuan ditolak dengan catatan: ${data.catatanAdmin || ""}`);
                    }
                }
            } catch (error) {
                console.error("Error fetching village data from API:", error);
            }
        };

        fetchData();

        // Polling for real time updates
        const intervalId = setInterval(async () => {
            const userId = user?.uid;
            if (!userId) return;
            try {
                const res: any = await getVillageById(userId);
                const data = res.village || res.data || res;
                if (data) {
                    setStatus((prevStatus) => {
                        if (prevStatus !== data.status) {
                            if (data.status === "Menunggu") {
                                setAlertStatus("info");
                                setIsEditable(false);
                                setAlertMessage(`Profil sudah didaftarkan. Menunggu verifikasi admin.`);
                            } else if (data.status === "Ditolak") {
                                setAlertStatus("error");
                                setIsEditable(true);
                                setAlertMessage(`Pengajuan ditolak dengan catatan: ${data.catatanAdmin || ""}`);
                            }
                            /*
                            else if (data.status === "Terverifikasi") {
                                router.push(`/village/profile/${userId}`);
                            }
                            */
                            return data.status;
                        }
                        return prevStatus;
                    });
                }
            } catch (err) {
                console.error("Polling error: ", err);
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, [user, router]);

    return (
        <>
            <TopBar title="Registrasi Profil Desa" onBack={() => router.back()} />
            <Box p="48px 16px 20px 16px" mb={16}>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (isFormValid()) {
                            setSubmitEvent(e); // Simpan event
                            setIsModal1Open(true); // Tampilkan modal
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    id="VillageForm">
                    <Flex direction="column" marginTop="24px">
                        <Stack spacing="12px" width="100%">
                            <Alert
                                status={alertStatus}
                                fontSize={12}
                                borderRadius={4}
                                padding="12px"
                                width="100%"
                                maxWidth="1000px"
                                mx="auto"
                            >
                                {alertMessage}
                            </Alert>

                            <FormSection
                                title="Nama Desa"
                                name="name"
                                placeholder="Nama Desa"
                                value={textInputValue.name}
                                onChange={onTextChange}
                                disabled={!isEditable || isFormLocked}
                                isRequired
                            />
                            <LocationSelector
                                label="Provinsi"
                                placeholder="Pilih Provinsi"
                                options={provinces}
                                value={selectedProvince}
                                onChange={handleProvinceChange}
                                isRequired
                                disabled={!isEditable || isFormLocked}
                            />

                            <LocationSelector
                                label="Kabupaten/Kota"
                                placeholder="Pilih Kabupaten/Kota"
                                options={regencies}
                                value={selectedRegency}
                                onChange={handleRegencyChange}
                                isDisabled={!selectedProvince}
                                isRequired
                                disabled={!isEditable || isFormLocked}
                            />
                            <LocationSelector
                                label="Kecamatan"
                                placeholder="Pilih Kecamatan"
                                options={districts}
                                value={selectedDistrict}
                                onChange={handleDistrictChange}
                                isDisabled={!selectedRegency}
                                isRequired
                                disabled={!isEditable || isFormLocked}
                            />
                            <LocationSelector
                                label="Desa/Kelurahan"
                                placeholder="Pilih Kelurahan"
                                options={villages}
                                value={selectedVillage}
                                onChange={handleVillageChange}
                                isDisabled={!selectedDistrict}
                                isRequired
                                disabled={!isEditable || isFormLocked}
                            />

                            <Box>
                                <Text fontWeight="400" fontSize="14px">
                                    Logo Desa <span style={{ color: "red" }}>*</span>
                                </Text>
                                <Text fontWeight="400" fontSize="10px" mb="6px" color="#9CA3AF">
                                    Maks 1 foto. format: png, jpg.
                                </Text>
                                <LogoUpload
                                    selectedLogo={selectedLogo}
                                    setSelectedLogo={setSelectedLogo}
                                    selectFileRef={selectedLogoRef}
                                    onSelectLogo={onSelectLogo}
                                    disabled={!isEditable || isFormLocked}
                                />
                            </Box>

                            <Box>
                                <Text fontWeight="400" fontSize="14px">
                                    Header Desa <span style={{ color: "red" }}>*</span>
                                </Text>
                                <Text fontWeight="400" fontSize="10px" mb="6px" color="#9CA3AF">
                                    Maks 1 foto. format: png, jpg.
                                </Text>
                                <HeaderUpload
                                    selectedHeader={selectedHeader}
                                    setSelectedHeader={setSelectedHeader}
                                    selectFileRef={selectedHeaderRef}
                                    onSelectHeader={onSelectHeader}
                                    disabled={!isEditable || isFormLocked}

                                />
                            </Box>

                            <Box>
                                <Text fontWeight="400" fontSize="14px">
                                    Foto Inovasi di Desa <span style={{ color: "red" }}>*</span>
                                </Text>
                                <Text fontWeight="400" fontSize="10px" mb="6px" color="#9CA3AF">
                                    Maks 5 foto. format: png, jpg.
                                </Text>
                                <ImageUpload
                                    selectedFile={selectedFiles}
                                    setSelectedFile={setSelectedFiles}
                                    selectFileRef={selectedFileRef}
                                    onSelectImage={onSelectImage}
                                    maxFiles={5}
                                    disabled={!isEditable || isFormLocked}
                                />
                            </Box>

                            <FormSection
                                isTextArea
                                title="Tentang Inovasi di Desa"
                                name="description"
                                placeholder="Masukkan deskripsi inovasi yang ada di desa"
                                value={textInputValue.description}
                                onChange={onTextChange}
                                wordCount={currentWordCount(textInputValue.description)}
                                maxWords={100}
                                disabled={!isEditable || isFormLocked}
                                isRequired
                            />

                            <Text fontWeight="700" fontSize="16px">
                                Potensi Desa
                            </Text>
                            <Box>
                                <Text fontWeight="400" fontSize="14px" mb="1">
                                    Potensi Desa <span style={{ color: "red" }}>*</span>
                                </Text>
                                <MultiSellect
                                    options={potensiDesa}
                                    value={selectedPotensi}
                                    onChange={setSelectedPotensi}
                                    placeholder="Pilih Potensi Desa"
                                    disabled={!isEditable || isFormLocked}
                                />
                            </Box>
                            <Text fontWeight="700" fontSize="16px">
                                Karakteristik Desa
                            </Text>
                            <FormSection
                                isTextArea
                                title="Geografis"
                                name="geografis"
                                placeholder="Jelaskan kondisi geografis desa"
                                value={textInputValue.geografis}
                                onChange={onTextChange}
                                disabled={!isEditable || isFormLocked}
                                isRequired
                            />
                            <Box>
                                <Text fontWeight="400" fontSize="14px" mb="1">
                                    Perkembangan Teknologi Digital <span style={{ color: "red" }}>*</span>
                                </Text>
                                <MultiSellect
                                    options={[
                                        { value: "Seluruhnya berkembang dengan baik", label: "Seluruhnya berkembang dengan baik" },
                                        { value: "Lebih dari 50% sudah dikembangkan", label: "Lebih dari 50% sudah dikembangkan" },
                                        { value: "Kurang dari 50% sudah dikembangkan", label: "Kurang dari 50% sudah dikembangkan" },
                                        { value: "Baru dimulai", label: "Baru dimulai" },
                                        { value: "Belum siap", label: "Belum siap" },
                                    ]}
                                    value={
                                        dropdownValue.teknologi
                                            ? [
                                                {
                                                    value: dropdownValue.teknologi,
                                                    label: dropdownValue.teknologi,
                                                },
                                            ]
                                            : []
                                    }
                                    onChange={(selected) =>
                                        setDropdownValue({
                                            ...dropdownValue,
                                            teknologi: selected?.[0]?.value || null,
                                        })
                                    }
                                    placeholder="Pilih"
                                    disabled={!isEditable || isFormLocked}
                                    isMulti={false}
                                />
                            </Box>

                            <Box>
                                <Text fontWeight="400" fontSize="14px" mb="1">
                                    Kemampuan Teknologi <span style={{ color: "red" }}>*</span>
                                </Text>
                                <MultiSellect
                                    options={[
                                        { value: "Kemampuan masyarakat sangat baik", label: "Kemampuan masyarakat sangat baik" },
                                        { value: "Kemampuan masyarakat cukup baik", label: "Kemampuan masyarakat cukup baik" },
                                        { value: "Hanya beberapa masyarakat yang cukup baik", label: "Hanya beberapa masyarakat yang cukup baik" },
                                        { value: "Kemampuan masyarakat terbatas", label: "Kemampuan masyarakat terbatas" },
                                        { value: "Masyarakat belum mampu memakai teknologi digital", label: "Masyarakat belum mampu memakai teknologi digital" },
                                    ]}
                                    value={
                                        dropdownValue.kemampuan
                                            ? [
                                                {
                                                    value: dropdownValue.kemampuan,
                                                    label: dropdownValue.kemampuan,
                                                },
                                            ]
                                            : []
                                    }
                                    onChange={(selected) =>
                                        setDropdownValue({
                                            ...dropdownValue,
                                            kemampuan: selected?.[0]?.value || null,
                                        })
                                    }
                                    placeholder="Pilih"
                                    disabled={!isEditable || isFormLocked}
                                    isMulti={false}
                                />
                            </Box>

                            <FormSection
                                isTextArea
                                title="Sosial dan Budaya"
                                name="sosial"
                                placeholder="Deskripsi sosial dan budaya desa"
                                value={textInputValue.sosial}
                                onChange={onTextChange}
                                disabled={!isEditable || isFormLocked}
                                isRequired
                            />
                            <FormSection
                                isTextArea
                                title="Sumber Daya Alam"
                                name="resource"
                                placeholder="Deskripsi sumber daya alam desa"
                                value={textInputValue.resource}
                                onChange={onTextChange}
                                disabled={!isEditable || isFormLocked}
                                isRequired
                            />

                            <Text fontWeight="700" fontSize="16px">
                                Infrastruktur
                            </Text>


                            <Box>
                                <Text fontWeight="400" fontSize="14px" mb="1">
                                    Kondisi Jalan <span style={{ color: "red" }}>*</span>
                                </Text>
                                <MultiSellect
                                    options={[
                                        { value: "Seluruh jalan beraspal", label: "Seluruh jalan beraspal" },
                                        { value: "Lebih dari 50% beraspal", label: "Lebih dari 50% beraspal" },
                                        { value: "Kurang dari 50% beraspal", label: "Kurang dari 50% beraspal" },
                                        { value: "Beraspal namun rusak", label: "Beraspal namun rusak" },
                                        { value: "Masih tanah dan bebatuan", label: "Masih tanah dan bebatuan" },
                                    ]}
                                    value={
                                        dropdownValue.kondisijalan
                                            ? [
                                                {
                                                    value: dropdownValue.kondisijalan,
                                                    label: dropdownValue.kondisijalan,
                                                },
                                            ]
                                            : []
                                    }
                                    onChange={(selected) =>
                                        setDropdownValue({
                                            ...dropdownValue,
                                            kondisijalan: selected?.[0]?.value || null,
                                        })
                                    }
                                    placeholder="Pilih"
                                    disabled={!isEditable || isFormLocked}
                                    isMulti={false}
                                />
                            </Box>

                            <Box>
                                <Text fontWeight="400" fontSize="14px" mb="1">
                                    Jaringan Internet <span style={{ color: "red" }}>*</span>
                                </Text>
                                <MultiSellect
                                    options={[
                                        {
                                            value: "Jaringan internet baik di seluruh tempat",
                                            label: "Jaringan internet baik di seluruh tempat"
                                        },
                                        {
                                            value: "Jaringan internet baik di beberapa tempat",
                                            label: "Jaringan internet baik di beberapa tempat"
                                        },
                                        {
                                            value: "Jaringan internet lemah",
                                            label: "Jaringan internet lemah"
                                        },
                                        {
                                            value: "Ada sinyal, namun tidak ada jaringan internet",
                                            label: "Ada sinyal, namun tidak ada jaringan internet"
                                        },
                                        {
                                            value: "Sinyal lemah, namun ada internet (wifi)",
                                            label: "Sinyal lemah, namun ada internet (wifi)"
                                        },
                                        {
                                            value: "Sinyal lemah / tidak ada, dan tidak ada internet",
                                            label: "Sinyal lemah / tidak ada, dan tidak ada internet",
                                        },
                                    ]}
                                    value={
                                        dropdownValue.jaringan
                                            ? [
                                                {
                                                    value: dropdownValue.jaringan,
                                                    label: dropdownValue.jaringan,
                                                },
                                            ]
                                            : []
                                    }
                                    onChange={(selected) =>
                                        setDropdownValue({
                                            ...dropdownValue,
                                            jaringan: selected?.[0]?.value || null,
                                        })
                                    }
                                    placeholder="Pilih"
                                    disabled={!isEditable || isFormLocked}
                                    isMulti={false}
                                />
                            </Box>

                            <Box>
                                <Text fontWeight="400" fontSize="14px" mb="1">
                                    Ketersediaan Listrik <span style={{ color: "red" }}>*</span>
                                </Text>
                                <MultiSellect
                                    options={[
                                        { value: "Listrik tersedia di seluruh tempat", label: "Listrik tersedia di seluruh tempat" },
                                        { value: "Listrik tersedia di beberapa tempat", label: "Listrik tersedia di beberapa tempat" },
                                        { value: "Listrik 24 jam hanya di beberapa tempat", label: "Listrik 24 jam hanya di beberapa tempat" },
                                        { value: "Listrik tersedia, namun waktu terbatas", label: "Listrik tersedia, namun waktu terbatas" },
                                        { value: "Listrik tidak tersedia", label: "Listrik tidak tersedia" },
                                    ]}
                                    value={
                                        dropdownValue.listrik
                                            ? [
                                                {
                                                    value: dropdownValue.listrik,
                                                    label: dropdownValue.listrik,
                                                },
                                            ]
                                            : []
                                    }
                                    onChange={(selected) =>
                                        setDropdownValue({
                                            ...dropdownValue,
                                            listrik: selected?.[0]?.value || null,
                                        })
                                    }
                                    placeholder="Pilih"
                                    disabled={!isEditable || isFormLocked}
                                    isMulti={false}
                                />
                            </Box>

                            <FormSection
                                isTextArea
                                title="Lain-lain"
                                name="infrastruktur"
                                placeholder="Masukkan hal-lain terkait infrastruktur"
                                value={textInputValue.infrastruktur}
                                onChange={onTextChange}
                                disabled={!isEditable || isFormLocked}
                                isRequired
                            />

                            <Text fontWeight="700" fontSize="16px">
                                Kontak Desa
                            </Text>
                            <FormSection
                                title="Nomor Whatsapp"
                                name="whatsapp"
                                placeholder="Masukkan nomor whatsapp"
                                value={textInputValue.whatsapp}
                                onChange={onTextChange}
                                disabled={!isEditable || isFormLocked}
                                isRequired
                            />
                            <FormSection
                                title="Akun Instagram"
                                name="instagram"
                                placeholder="Masukkan akun instagram (opsional)"
                                value={textInputValue.instagram}
                                onChange={onTextChange}
                                disabled={!isEditable || isFormLocked}
                            />
                            <FormSection
                                title="Website Desa"
                                name="website"
                                placeholder="Masukkan website desa (opsional)"
                                value={textInputValue.website}
                                onChange={onTextChange}
                                disabled={!isEditable || isFormLocked}
                            />
                        </Stack>
                        <Box height="100px" />
                    </Flex>
                    {status !== "Menunggu" && (
                        <>
                            <NavbarButton style={{ zIndex: 999 }}>
                                <Button
                                    type="submit"
                                    form="VillageForm"
                                    width="100%"
                                    isLoading={loading}
                                    isDisabled={loading || isFormLocked || (status === "Menunggu" && !isEditable)}
                                    onClick={(e) => {
                                        if (isFormValid()) {
                                            // Handled by form onSubmit
                                        } else {
                                            e.preventDefault();
                                            setAlertMessage("Harap isi semua data yang bertanda merah (*) terlebih dahulu.");
                                            setAlertStatus("error");
                                            window.scrollTo({ top: 0, behavior: "smooth" });
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
                                    {status === "Ditolak" || status === "Terverifikasi" ? "Edit Profile" : "Daftarkan Profil"}
                                </Button>
                            </NavbarButton>
                            <ConfModal
                                isOpen={isModal1Open}
                                onClose={closeModal}
                                modalTitle=""
                                modalBody1={modalBody1}
                                onYes={handleModal1Yes}
                            />
                            <SecConfModal
                                isOpen={isModal2Open}
                                onClose={closeModal}
                                modalBody2={modalBody2}
                            />
                        </>
                    )}
                </form>
            </Box>
        </>
    );
};

export default AddVillage;
