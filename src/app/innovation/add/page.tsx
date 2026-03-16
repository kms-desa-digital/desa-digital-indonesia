"use client";

import { AddIcon, DeleteIcon, MinusIcon } from "@chakra-ui/icons";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    CheckboxGroup,
    Flex,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    Radio,
    RadioGroup,
    Stack,
    Text,
    Textarea,
    useToast,
} from "@chakra-ui/react";
import TopBar from "Components/topBar";
// import {
//     addDoc,
//     collection,
//     doc,
//     getDoc,
//     increment,
//     serverTimestamp,
//     updateDoc,
//     getDocs,
//     where,
//     query
// } from "firebase/firestore";
import { getDoc, doc, updateDoc, increment } from "firebase/firestore"; // Masih dipakai untuk temp vendor check kl perlu
import { addInnovation, updateInnovation } from "Services/innovationServices";
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytesResumable,
    uploadString,
} from "firebase/storage";
import React, { useEffect, useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import Select from "react-select";
import ConfModal from "Components/confirmModal/confModal";
import SecConfModal from "Components/confirmModal/secConfModal";
import ImageUpload from "Components/form/ImageUpload";
import { auth, firestore, storage } from "src/firebase/clientApp";
import { NavbarButton } from "../../village/profile/[id]/_styles";

type OptionType = {
    value: string;
    label: string;
};

const categoryOptions = [
    { value: "E-Government", label: "E-Government" },
    { value: "E-Tourism", label: "E-Tourism" },
    { value: "Infrastruktur Lokal", label: "Infrastruktur Lokal" },
    { value: "Layanan Keuangan", label: "Layanan Keuangan" },
    { value: "Layanan Sosial", label: "Layanan Sosial" },
    {
        value: "Pemasaran Agri-Food dan E-Commerce",
        label: "Pemasaran Agri-Food dan E-Commerce",
    },
    {
        value: "Pengembangan Masyarakat dan Ekonomi",
        label: "Pengembangan Masyarakat dan Ekonomi",
    },
    { value: "Pengelolaan Sumber Daya", label: "Pengelolaan Sumber Daya" },
    { value: "Pertanian Cerdas", label: "Pertanian Cerdas" },
    { value: "Sistem Informasi", label: "Sistem Informasi" },
];

const predefinedModels = [
    "Gratis",
    "Layanan Berbayar",
    "Subsidi Parsial",
    "Pusat Multi-Layanan",
    "Koperasi",
    "Model Kemitraan",
    "Menciptakan Pasar",
    "Pengumpulan Data",
    "Pelatihan/Pendidikan",
    "Perusahaan Sosial",
    "Lain-lain",
];

const AddInnovation: React.FC = () => {
    const router = useRouter();
    const [user] = useAuthState(auth);

    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const selectFileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [textInputsValue, setTextInputsValue] = useState({
        name: "",
        year: "",
        description: "",
        otherBusinessModel: "",
        villages: "",
        priceMin: "",
        priceMax: "",
    });
    const [requirements, setRequirements] = useState<string[]>([]);
    const [newRequirement, setNewRequirement] = useState("");
    const [selectedModels, setSelectedModels] = useState<(string | number)[]>([]);
    const [otherBusinessModel, setOtherBusinessModel] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<OptionType | null>(
        null
    );
    const [benefit, setBenefit] = useState([{ benefit: "", description: "" }]);
    const [alertStatus, setAlertStatus] = useState<"info" | "warning" | "error">(
        "warning"
    );
    const [alertMessage, setAlertMessage] = useState(
        "Profil masih kosong. Silahkan isi data di bawah terlebih dahulu."
    );
    const [selectedStatus, setSelectedStatus] = useState("Masih diproduksi");
    const [status, setStatus] = useState("");
    const [isEditable, setIsEditable] = useState(true);
    const toast = useToast();
    const [innovationId, setInnovationId] = useState("");
    const modalBody1 = "Apakah anda yakin ingin menambah inovasi?";
    const modalBody2 =
        "Inovasi sudah ditambahkan. Admin sedang memverifikasi pengajuan tambah inovasi";

    const [isFormLocked, setIsFormLocked] = useState(false);
    const [confirmedSubmit, setConfirmedSubmit] = useState(false);
    const [submitEvent, setSubmitEvent] = useState<React.FormEvent<HTMLFormElement> | null>(null);
    const [isModal1Open, setIsModal1Open] = useState(false);
    const [isModal2Open, setIsModal2Open] = useState(false);
    const closeModal = () => {
        setIsModal1Open(false);
        setIsModal2Open(false);
    };

    const handleModal1Yes = () => {
        setIsModal2Open(true);
        setIsModal1Open(false);
        setConfirmedSubmit(true);
        if (submitEvent) {
            onSubmitForm(submitEvent);
        }
    };

    useEffect(() => {
        if (confirmedSubmit) {
            setIsFormLocked(true);
            setIsModal2Open(true);
            setConfirmedSubmit(false);
        }
    }, [confirmedSubmit]);

    const onSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const imagesArray: string[] = [];
            if (selectedFiles.length + files.length > 5) {
                alert("Maksimal 5 foto yang bisa diunggah.");
                return;
            }

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

    const onTextChange = ({
        target: { name, value },
    }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const wordCount = value.split(/\s+/).filter((word) => word !== "").length;
        if (name === "priceMin" || name === "priceMax") {
            if (/^\d*$/.test(value)) {
                setTextInputsValue((prev) => ({
                    ...prev,
                    [name]: value,
                }));
            }
        } else if (name === "description") {
            if (wordCount <= 80) {
                setTextInputsValue((prev) => ({
                    ...prev,
                    [name]: value,
                }));
            }
        } else if (name === "villages") {
            if (wordCount <= 20) {
                setTextInputsValue((prev) => ({
                    ...prev,
                    [name]: value,
                }));
            }
        } else if (name === "otherBusinessModel") {
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

    const getDescriptionWordCount = () => {
        return textInputsValue.description
            .split(/\s+/)
            .filter((word) => word !== "").length;
    };

    const getVillagesWordCount = () => {
        return textInputsValue.villages
            .toString()
            .split(/\s+/)
            .filter((word) => word !== "").length;
    };

    const onAddRequirement = () => {
        const wordCount = newRequirement
            .split(/\s+/)
            .filter((word) => word !== "").length;
        if (newRequirement.trim() !== "" && wordCount <= 5) {
            setRequirements((prev) => [...prev, newRequirement]);
            setNewRequirement("");
        }
    };

    const uploadFiles = async (
        files: string[],
        innovationId: string
    ): Promise<string[]> => {
        const promises: Promise<string>[] = [];
        files.forEach((file, index) => {
            if (file.startsWith("http")) { // Handle existing URLs
                promises.push(Promise.resolve(file));
                return;
            }
            const fileName = `image_${Date.now()}_${index}`;
            const storageRef = ref(
                storage,
                `innovations/${innovationId}/images/${fileName}`
            );

            const byteString = atob(file.split(",")[1]);
            const mimeString = file.split(",")[0].split(":")[1].split(";")[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });

            const uploadTask = uploadBytesResumable(storageRef, blob);
            const promise = new Promise<string>((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        // prog
                    },
                    (error) => {
                        console.log(error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    }
                );
            });
            promises.push(promise);
        });
        return Promise.all(promises);
    };

    const isFormValid = () => {
        // Implement full validation logic here if needed
        return true;
    };


    const onSubmitForm = async (event: React.FormEvent) => {
        event.preventDefault(); // In case it's called directly
        setLoading(true);
        setError("");

        const { name, year, description, villages, priceMax, priceMin } =
            textInputsValue;

        const modelBisnis = selectedModels.filter((model) => model !== "Lain-lain");
        if (
            selectedModels.includes("Lain-lain") &&
            otherBusinessModel.trim() !== ""
        ) {
            modelBisnis.push(otherBusinessModel);
        }

        if (!isFormValid()) {
            setLoading(false);
            return;
        }

        if (selectedModels.length === 0) {
            setError("Pilih setidaknya satu model bisnis digital.");
            return;
        }
        if (!user?.uid) {
            setError("User ID is not defined. Please make sure you are logged in.");
            setLoading(false);
            return;
        }

        const userId = user.uid;
        const innovatorDocRef = doc(firestore, "innovators", userId);
        const innovatorDocSnap = await getDoc(innovatorDocRef);

        if (!innovatorDocSnap.exists()) {
            console.error("Innovator document not found");
            setError("Gagal menambahkan inovasi");
            setLoading(false);
            toast({
                title: "Innovator document not found",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
            return;
        }

        const innovatorData = innovatorDocSnap.data();

        const finalRequirements = [...requirements];
        if (
            newRequirement.trim() !== "" &&
            !finalRequirements.includes(newRequirement.trim())
        ) {
            finalRequirements.push(newRequirement.trim());
        }

        try {
            // ==========================================
            // LOGIC MIGRASI: SEMUA KE MONGODB API
            // ==========================================
            const innovationPayload: any = {
                statusInovasi: selectedStatus,
                namaInovasi: name,
                kategori: selectedCategory?.label,
                tahunDibuat: year,
                inputDesaMenerapkan: villages,
                deskripsi: description,
                hargaMinimal: priceMin,
                hargaMaksimal: priceMax,
                manfaat: benefit.map((item) => ({
                    judul: item.benefit,
                    deskripsi: item.description,
                })),
                infrastruktur: finalRequirements,
                modelBisnis: modelBisnis,
                innovatorId: user.uid,
                namaInnovator: innovatorData.namaInovator,
                innovatorImgURL: innovatorData?.logo || null,
            };

            let newId = innovationId;

            if (status === "Ditolak") {
                // UPDATE / AJUKAN ULANG
                await updateInnovation(innovationId, innovationPayload);
                console.log("Inovasi diupdate (Mongo): ", innovationId);
            } else {
                // ADD BARU
                const res = await addInnovation(innovationPayload);
                newId = res.innovationId;
                setInnovationId(newId);
                console.log("Inovasi ditambahkan (Mongo): ", newId);
            }

            // Handle Image Upload (Masih via Firebase Storage)
            if (selectedFiles.length > 0) {
                const imageUrls = await uploadFiles(selectedFiles, newId);
                // Update record di MongoDB dengan image URLs yang baru
                await updateInnovation(newId, { images: imageUrls });
                console.log("Images uploaded & Mongo updated", imageUrls);
            }

            setStatus("Menunggu");
            setAlertStatus("info");
            setIsFormLocked(true);

            /*
            // FIREBASE LAMA (COMMENTED)
            if (status === "Ditolak") {
                // ... logic firebase update
            } else {
                // ... logic firebase add
            }
            */
            toast({
                title: "Pengajuan sedang diverifikasi admin.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
            setIsEditable(false);
            setLoading(false);
            setAlertStatus("info");
        } catch (error) {
            console.error("Submission error:", error);
            setError("Gagal menyimpan data inovasi ke database.");
            setLoading(false);
            toast({
                title: "Gagal menambahkan inovasi",
                status: "error",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
        }
    };

    useEffect(() => {
        if (!innovationId) return;

        const fetchInnovationData = async () => {
            const docRef = doc(firestore, "innovations", innovationId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTextInputsValue({
                    name: data.namaInovasi || "",
                    year: data.tahunDibuat || "",
                    description: data.deskripsi || "",
                    villages: data.inputDesaMenerapkan || "",
                    priceMin: data.hargaMinimal || "",
                    priceMax: data.hargaMaksimal || "",
                    otherBusinessModel: data.otherBusinessModel || "",
                });
                setSelectedStatus(data.statusInovasi || "");
                setSelectedCategory({
                    value: data.kategori || "",
                    label: data.kategori || "",
                });
                const otherModel = data.modelBisnis?.find(
                    (model: string) => !predefinedModels.includes(model)
                );

                if (otherModel) {
                    setOtherBusinessModel(otherModel);
                    setSelectedModels([
                        ...data.modelBisnis.filter((model: string) => model !== otherModel),
                        "Lain-lain",
                    ]);
                } else {
                    setSelectedModels(data.modelBisnis || []);
                }
                const mappedManfaat =
                    data.manfaat?.map((item: { judul: string; deskripsi: string }) => ({
                        benefit: item.judul || "",
                        description: item.deskripsi || "",
                    })) || [];

                setBenefit(mappedManfaat);
                setRequirements(data.infrastruktur || []);
                setSelectedFiles(data.images || []);

                if (data.status === "Menunggu") {
                    setIsEditable(false);
                    setStatus("Menunggu");
                    setAlertStatus("info");
                    setAlertMessage(
                        `Inovasi sudah didaftakan. Menunggu verifikasi admin.`
                    );
                } else if (data.status === "Ditolak") {
                    setIsEditable(true);
                    setStatus("Ditolak");
                    setAlertStatus("error");
                    setAlertMessage(
                        `Pengajuan ditolak dengan catatan: ${data.catatanAdmin || ""}`
                    );
                } else if (data.status === "Terverifikasi") {
                    const innovatorDocRef = doc(
                        firestore,
                        "innovators",
                        user?.uid as string
                    );
                    await updateDoc(innovatorDocRef, {
                        jumlahInovasi: increment(1),
                    });
                }
            }
        };
        fetchInnovationData();
    }, [innovationId, user]);

    const splitModels = (models: string[], num: number) => {
        const midpoint = Math.ceil(models.length / num);
        return [models.slice(0, midpoint), models.slice(midpoint)];
    };

    const [firstColumn, secondColumn] = splitModels(predefinedModels, 2);

    const options = [
        { value: "1", label: "Masih diproduksi" },
        { value: "2", label: "Tidak diproduksi" },
    ];

    const customStyles = {
        control: (base: any) => ({
            ...base,
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
            <TopBar title="Tambahkan Inovasi" onBack={() => router.back()} />
            <Box p="48px 16px 20px 16px">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (isFormValid()) {
                        setSubmitEvent(e);
                        setIsModal1Open(true);
                    }
                }}
                    id="innovationForm">
                    <Flex direction="column" marginTop="24px">
                        <Stack spacing={3} width="100%">
                            <Alert
                                status={alertStatus}
                                fontSize={12}
                                borderRadius={4}
                                padding="8px"
                            >
                                {alertMessage}
                            </Alert>
                            <Text fontWeight="400" fontSize="14px" mb="-2">
                                Status Inovasi <span style={{ color: "red" }}>*</span>
                            </Text>
                            <RadioGroup
                                defaultValue="Masih diproduksi"
                                name="status"
                                onChange={(value) => setSelectedStatus(value)}
                                isDisabled={!isEditable || isFormLocked}
                            >
                                <HStack spacing={4}>
                                    {options.map((option) => (
                                        <Radio
                                            key={option.value}
                                            value={option.label}
                                            size="md"
                                            colorScheme="green"
                                        >
                                            <Text fontSize="14px">{option.label}</Text>
                                        </Radio>
                                    ))}
                                </HStack>
                            </RadioGroup>

                            <Text fontWeight="400" fontSize="14px" mb="-2">
                                Nama Inovasi <span style={{ color: "red" }}>*</span>
                            </Text>
                            <Input
                                name="name"
                                fontSize="14px"
                                placeholder="Nama Inovasi"
                                disabled={!isEditable || isFormLocked}
                                value={textInputsValue.name}
                                onChange={onTextChange}
                                isRequired
                            />

                            <Text fontWeight="400" fontSize="14px" mb="-2">
                                Kategori Inovasi <span style={{ color: "red" }}>*</span>
                            </Text>
                            <Select
                                placeholder="Pilih kategori"
                                options={categoryOptions}
                                value={selectedCategory}
                                isDisabled={!isEditable || isFormLocked}
                                onChange={(selectedOption) =>
                                    setSelectedCategory(selectedOption)
                                }
                                styles={customStyles}
                                isClearable
                            />

                            <Text fontWeight="400" fontSize="14px" mb="-2">
                                Tahun dibuat inovasi <span style={{ color: "red" }}>*</span>
                            </Text>
                            <Input
                                name="year"
                                fontSize="14px"
                                placeholder="Ketik tahun"
                                disabled={!isEditable || isFormLocked}
                                value={textInputsValue.year}
                                onChange={onTextChange}
                                isRequired
                            />

                            <Text fontWeight="400" fontSize="14px" mb="-2">
                                Deskripsi <span style={{ color: "red" }}>*</span>
                            </Text>
                            <Flex direction="column" alignItems="flex-start">
                                <Textarea
                                    name="description"
                                    fontSize="14px"
                                    placeholder="Masukkan deskripsi singkat tentang inovasi"
                                    disabled={!isEditable || isFormLocked}
                                    height="100px"
                                    value={textInputsValue.description}
                                    onChange={onTextChange}
                                    isRequired
                                />
                                <Text fontWeight="400" fontSize="10px" color="gray.500">
                                    {getDescriptionWordCount()}/80 kata
                                </Text>
                            </Flex>

                            <Stack spacing={1}>
                                {/* Checkboxes for Business Model */}
                                <div>
                                    <Text fontWeight="400" fontSize="14px">
                                        Model Bisnis Digital <span style={{ color: "red" }}>*</span>
                                    </Text>
                                    <Text fontWeight="400" fontSize="10px" color="#9CA3AF">
                                        Dapat lebih dari 1
                                    </Text>
                                </div>
                                <CheckboxGroup
                                    colorScheme="green"
                                    value={selectedModels as string[]}
                                    onChange={(values) => setSelectedModels(values)}
                                    isDisabled={!isEditable || isFormLocked}
                                >
                                    <Flex gap={4}>
                                        {[firstColumn, secondColumn].map((column, colIndex) => (
                                            <Flex key={colIndex} direction="column" gap={1}>
                                                {column.map((model, index) => (
                                                    <Checkbox
                                                        key={index}
                                                        value={model}
                                                    >
                                                        <Text fontSize="12px">{model}</Text>
                                                    </Checkbox>
                                                ))}
                                            </Flex>
                                        ))}
                                    </Flex>
                                </CheckboxGroup>

                                {selectedModels.includes("Lain-lain") && (
                                    <Flex direction="column" alignItems="flex-start">
                                        <Input
                                            name="otherBusinessModel"
                                            placeholder="Silahkan tulis model bisnis lainnya"
                                            value={otherBusinessModel}
                                            disabled={!isEditable || isFormLocked}
                                            onChange={(e) => {
                                                const wordCount = e.target.value
                                                    .split(/\s+/)
                                                    .filter((word) => word !== "").length;
                                                if (wordCount <= 5) {
                                                    setOtherBusinessModel(e.target.value);
                                                }
                                            }}
                                            fontSize="14px"
                                        />
                                        <Text fontWeight="400" fontSize="10px" color="#9CA3AF">
                                            {otherBusinessModel.split(/\s+/).filter(w => w !== "").length}/5 kata
                                        </Text>
                                    </Flex>
                                )}
                            </Stack>

                            <Text fontWeight="400" fontSize="14px" mb="-2">
                                Desa yang menerapkan <span style={{ color: "red" }}>*</span>
                            </Text>
                            <Flex direction="column" alignItems="flex-start">
                                <Textarea
                                    name="villages"
                                    fontSize="14px"
                                    placeholder="Masukkan beberapa desa yang menerapkan"
                                    height="100px"
                                    value={textInputsValue.villages}
                                    disabled={!isEditable || isFormLocked}
                                    onChange={onTextChange}
                                    isRequired
                                />
                                <Text fontWeight="400" fontSize="10px" color="gray.500">
                                    {getVillagesWordCount()}/20 kata
                                </Text>
                            </Flex>

                            <Text fontWeight="400" fontSize="14px" mb="-2">
                                Kisaran harga
                            </Text>
                            <Flex direction="column" alignItems="flex-start">
                                <Flex direction="row" justifyContent="center">
                                    <InputGroup>
                                        <InputLeftElement
                                            pointerEvents="none"
                                            color="gray.300"
                                            fontSize="12px"
                                        >
                                            Rp.
                                        </InputLeftElement>
                                        <Input
                                            name="priceMin"
                                            fontSize="12px"
                                            placeholder="Harga minimal"
                                            value={textInputsValue.priceMin}
                                            onChange={onTextChange}
                                            disabled={!isEditable || isFormLocked}
                                        />
                                    </InputGroup>
                                    <MinusIcon mx="2" color="#9CA3AF" mt="3" />
                                    <InputGroup>
                                        <InputLeftElement
                                            pointerEvents="none"
                                            color="gray.300"
                                            fontSize="12px"
                                        >
                                            Rp.
                                        </InputLeftElement>
                                        <Input
                                            name="priceMax"
                                            fontSize="12px"
                                            placeholder="Harga maksimal"
                                            value={textInputsValue.priceMax}
                                            onChange={onTextChange}
                                            disabled={!isEditable || isFormLocked}
                                        />
                                    </InputGroup>
                                </Flex>
                            </Flex>

                            <Text fontWeight="400" fontSize="14px" mb="-2">
                                Foto inovasi <span style={{ color: "red" }}>*</span>
                            </Text>
                            <Flex direction="column" alignItems="flex-start">
                                <Text fontWeight="400" fontSize="10px" color="#9CA3AF" mb="0">
                                    Maks 5 foto, format: png, jpg.
                                </Text>
                                <ImageUpload
                                    selectedFile={selectedFiles}
                                    setSelectedFile={setSelectedFiles}
                                    selectFileRef={selectFileRef}
                                    onSelectImage={onSelectImage}
                                    maxFiles={5}
                                    disabled={!isEditable || isFormLocked}
                                />
                            </Flex>

                            <Text fontWeight="700" fontSize="16px" mb="-2" mt="2">
                                Manfaat Inovasi <span style={{ color: "red", fontSize: "14px", fontWeight: "400" }}>*</span>
                            </Text>

                            {benefit.map((item, index) => (
                                <Flex key={index} direction="column" mb={2}>
                                    <Text fontWeight="400" fontSize="14px">
                                        Manfaat {index + 1} <span style={{ color: "red" }}>*</span>
                                    </Text>
                                    <Flex alignItems="center" position="relative" gap={2} mt={1}>
                                        <Input
                                            fontSize="14px"
                                            placeholder="Masukkan manfaat singkat inovasi"
                                            value={item.benefit}
                                            disabled={!isEditable || isFormLocked}
                                            onChange={(e) => {
                                                const updatedBenefits = [...benefit];
                                                updatedBenefits[index].benefit = e.target.value;
                                                setBenefit(updatedBenefits);
                                            }}
                                        />
                                        {benefit.length > 1 && (
                                            <Button
                                                variant="none"
                                                disabled={!isEditable || isFormLocked}
                                                onClick={() => {
                                                    setBenefit((prev) =>
                                                        prev.filter((_, i) => i !== index)
                                                    );
                                                }}
                                            >
                                                <DeleteIcon color="red.500" />
                                            </Button>
                                        )}
                                    </Flex>
                                    <Text fontWeight="400" fontSize="14px" mt={2}>
                                        Deskripsi Manfaat <span style={{ color: "red" }}>*</span>
                                    </Text>
                                    <Flex direction="column" position="relative" mt={1}>
                                        <Textarea
                                            fontSize="14px"
                                            placeholder="Masukkan deskripsi manfaat"
                                            value={item.description}
                                            disabled={!isEditable || isFormLocked}
                                            isRequired
                                            onChange={(e) => {
                                                const updatedBenefits = [...benefit];
                                                updatedBenefits[index].description = e.target.value;
                                                setBenefit(updatedBenefits);
                                            }}
                                        />
                                    </Flex>
                                </Flex>
                            ))}

                            <Button
                                mt={-3}
                                variant="outline"
                                leftIcon={<AddIcon />}
                                disabled={!isEditable || isFormLocked}
                                onClick={() => {
                                    setBenefit([...benefit, { benefit: "", description: "" }]);
                                }}
                            >
                                Tambah Manfaat Lain
                            </Button>

                            <Text fontWeight="700" fontSize="16px" mb="-2" mt="2">
                                Persiapan Infrastruktur <span style={{ color: "red" }}>*</span>
                            </Text>

                            <Flex direction="column" mt={0}>
                                {requirements.map((requirement, index) => (
                                    <Flex key={index} direction="column" mb={3}>
                                        <Flex alignItems="center" position="relative" gap={2}>
                                            <Input
                                                fontSize="14px"
                                                value={requirement}
                                                disabled={!isEditable || isFormLocked}
                                                onChange={(e) => {
                                                    const updatedRequirements = [...requirements];
                                                    updatedRequirements[index] = e.target.value;
                                                    setRequirements(updatedRequirements);
                                                }}
                                            />
                                            {requirements.length >= 1 && (
                                                <Button
                                                    variant="none"
                                                    disabled={!isEditable}
                                                    onClick={() => {
                                                        setRequirements((prev) =>
                                                            prev.filter((_, i) => i !== index)
                                                        );
                                                    }}
                                                >
                                                    <DeleteIcon color="red.500" />
                                                </Button>
                                            )}
                                        </Flex>
                                    </Flex>
                                ))}

                                <Flex direction="column" mt={2}>
                                    <Input
                                        name="newRequirement"
                                        fontSize="14px"
                                        placeholder="Masukkan persiapan infrastruktur"
                                        value={newRequirement}
                                        disabled={!isEditable}
                                        onChange={(e) => setNewRequirement(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                onAddRequirement();
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={onAddRequirement}
                                        leftIcon={<AddIcon />}
                                        disabled={!isEditable}
                                        mt={2}
                                    >
                                        Tambah Infrastruktur Lain
                                    </Button>
                                </Flex>
                            </Flex>
                        </Stack>
                    </Flex>
                </form>
            </Box>
            {error && (
                <Text color="red.500" fontSize="12px" mt="4px" textAlign="center">
                    {error}
                </Text>
            )}
            {status !== "Menunggu" && (
                <>
                    <NavbarButton>
                        <Button
                            type="submit"
                            form="innovationForm"
                            isLoading={loading}
                            width="100%"
                            onClick={(e) => {
                                if (isFormValid()) {
                                    // The form submit handler will be called
                                } else {
                                    e.preventDefault();
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
                            {status === "Ditolak" ? "Ajukan Ulang" : "Ajukan Inovasi"}
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
        </>
    );
};

export default AddInnovation;
