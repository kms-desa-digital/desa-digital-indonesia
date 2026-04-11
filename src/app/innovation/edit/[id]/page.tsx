"use client";

import { AddIcon, DeleteIcon, MinusIcon } from "@chakra-ui/icons";
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
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
import BottomSheetSelector from "Components/form/BottomSheetSelector";
import Container from "Components/container";
import TopBar from "Components/topBar";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ImageUpload from "src/components/form/ImageUpload";
// import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth } from "src/firebase/clientApp";
// import { firestore, storage } from "src/firebase/clientApp";
import { storage } from "src/firebase/clientApp";
import { getInnovationById, updateInnovation, deleteInnovation } from "Services/innovationServices";
import { NavbarButton } from "./_styles";
import StatusCard from "Components/card/status/StatusCard";

const categories = [
    "E-Government",
    "E-Tourism",
    "Layanan Keuangan",
    "Layanan Sosial",
    "Pemasaran Agri-Food dan E-Commerce",
    "Pengembangan Masyarakat dan Ekonomi",
    "Pengelolaan Sumber Daya",
    "Pertanian Cerdas",
    "Sistem Informasi",
    "UMKM",
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

const EditInnovation: React.FC = () => {
    const router = useRouter();
    const toast = useToast();
    const params = useParams();
    const id = params.id as string;

    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const selectFileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
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
    const [category, setCategory] = useState("");
    const [requirements, setRequirements] = useState<string[]>([]);
    const [newRequirement, setNewRequirement] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedModels, setSelectedModels] = useState<(string | number)[]>([]);
    const [status, setStatus] = useState("");
    const [catatanAdmin, setCatatanAdmin] = useState("");
    const [otherBusinessModel, setOtherBusinessModel] = useState("");
    const [benefit, setBenefit] = useState([{ benefit: "", description: "" }]);
    const [isOpen, setIsOpen] = useState(false);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);

    useEffect(() => {
        const fetchInnovation = async () => {
            if (!id) {
                console.error("No ID found in the URL parameters");
                return;
            }
            try {
                console.log("Fetching innovation via API with ID:", id);
                /*
                const docRef = doc(firestore, "innovations", id);
                const docSnap = await getDoc(docRef);
                ... Firestore Logic ...
                */
                const res: any = await getInnovationById(id);
                const data = res.innovation;

                if (data) {
                    console.log("Fetched data from API:", data);
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
                    setCategory(data.kategori || "");
                    
                    const otherModel = (data.modelBisnis || []).find(
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
                        (data.manfaat || []).map((item: { judul: string; deskripsi: string }) => ({
                            benefit: item.judul || "",
                            description: item.deskripsi || "",
                        })) || [];

                    setBenefit(mappedManfaat);
                    setRequirements(data.infrastruktur || []);
                    setSelectedFiles(data.images || []);
                    setStatus(data.status || "");
                    setCatatanAdmin(data.catatanAdmin || "");
                } else {
                    console.log("No such Innovation found via API!");
                }
            } catch (error) {
                console.error("Error fetching innovation from API:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInnovation();
    }, [id]);

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

    const onTextChange = ({
        target: { name, value },
    }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setTextInputsValue((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const options = [
        { value: "1", label: "Masih diproduksi" },
        { value: "2", label: "Tidak diproduksi" },
    ];

    const splitModels = (models: string[], num: number) => {
        const midpoint = Math.ceil(models.length / num);
        return [models.slice(0, midpoint), models.slice(midpoint)];
    };

    const [firstColumn, secondColumn] = splitModels(predefinedModels, 2);

    const getVillagesWordCount = () => {
        return textInputsValue.villages.split(/\s+/).filter((word) => word !== "")
            .length;
    };

    const finalRequirements = [...requirements];
    if (
        newRequirement.trim() !== "" &&
        !finalRequirements.includes(newRequirement.trim())
    ) {
        finalRequirements.push(newRequirement.trim());
    }

    const onSelectCategory = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setCategory(event.target.value);
    };

    const onAddRequirement = () => {
        if (newRequirement.trim() !== "") {
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
            // Check if file is already a URL
            if (file.startsWith("http") || file.startsWith("https")) {
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
                        // progress
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

    const onUpdateInnovation = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        const { name, year, description, villages, priceMax, priceMin } = textInputsValue;

        if (!name || !year || !description || !category || !villages) {
            setError("Semua kolom harus diisi");
            setLoading(false);
            return;
        }
        try {
            const updateBody = {
                statusInovasi: selectedStatus,
                namaInovasi: name,
                kategori: category,
                tahunDibuat: year,
                inputDesaMenerapkan: villages,
                modelBisnis: selectedModels,
                deskripsi: description,
                hargaMinimal: priceMin,
                hargaMaksimal: priceMax,
                manfaat: benefit.map((item) => ({
                    judul: item.benefit,
                    deskripsi: item.description,
                })),
                infrastruktur: finalRequirements,
                images: selectedFiles // Assuming API handles Storage or we upload first then update
            };

            // If there are new base64 images, we still need to upload them to storage
            // OR if the API takes base64, we can send it directly. 
            // For now, let's stick to the current Firebase Storage upload and then update API
            
            const newImages = selectedFiles.filter(f => f.startsWith("data:"));
            if (newImages.length > 0) {
                const uploadedUrls = await uploadFiles(selectedFiles, id);
                updateBody.images = uploadedUrls;
            }

            await updateInnovation(id, updateBody);
            console.log("Innovation updated via API with ID: ", id);

            setLoading(false);
            setIsSuccessOpen(true);
        } catch (error) {
            console.error("Error updating innovation via API:", error);
            setError("Gagal mengubah inovasi");
            setLoading(false);
        }
    };

    const onDeleteInnovation = async () => {
        setLoading(true);
        try {
            /*
            const innovationDocRef = doc(firestore, "innovations", id);
            await deleteDoc(innovationDocRef);
            */
            await deleteInnovation(id);
            setLoading(false);
            toast({
                title: "Inovasi dihapus.",
                description: "Inovasi telah berhasil dihapus.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            router.push("/");
        } catch (error: any) {
            console.error("Error deleting innovation via API:", error);
            if (error.response?.data?.message === "ID tidak valid") {
                 setError("ID tidak valid (Database mismatch)");
            } else {
                 setError("Gagal menghapus inovasi");
            }
            setLoading(false);
        }
    };

    const handleDeleteClick = () => {
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleSuccessClose = () => {
        setIsSuccessOpen(false);
        router.push(`/innovation/detail/${id}`);
    };

    if (loading) {
        return (
            <Container page>
                <TopBar title="Edit Inovasi" onBack={() => router.back()} />
                <Text>Loading...</Text>
            </Container>
        );
    }

    return (
        <>
            <TopBar title="Edit Inovasi" onBack={() => router.back()} />
            <Box p="48px 16px 20px 16px">
                <form onSubmit={onUpdateInnovation} id="UpdateInnovation">
                    <Flex direction="column" marginTop="24px">
                        <Stack spacing={3} width="100%">
                            <Text fontWeight="400" fontSize="14px" mb="-2">
                                Status Inovasi <span style={{ color: "red" }}>*</span>
                            </Text>
                            <RadioGroup
                                defaultValue="Masih diproduksi"
                                name="status"
                                onChange={(value) => setSelectedStatus(value)}
                                value={selectedStatus}
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
                            <Text fontWeight="400" fontSize="14px">
                                Nama Inovasi <span style={{ color: "red" }}>*</span>
                            </Text>
                            <Input
                                name="name"
                                fontSize="10pt"
                                placeholder="Nama Inovasi"
                                _placeholder={{ color: "gray.500" }}
                                value={textInputsValue.name}
                                onChange={onTextChange}
                            />
                            <Text fontWeight="400" fontSize="14px">
                                Kategori Inovasi <span style={{ color: "red" }}>*</span>
                            </Text>
                            <BottomSheetSelector
                                options={categories.map(cat => ({ label: cat, value: cat }))}
                                value={category}
                                onChange={(value, label) => setCategory(value)}
                                placeholder="Pilih kategori"
                                title="Pilih Kategori Inovasi"
                                searchPlaceholder="Cari kategori inovasi di sini..."
                                disabled={loading || (status === "Menunggu")}
                            />
                            <Text fontWeight="400" fontSize="14px">
                                Tahun dibuat inovasi <span style={{ color: "red" }}>*</span>
                            </Text>
                            <Input
                                name="year"
                                fontSize="10pt"
                                placeholder="Ketik tahun"
                                value={textInputsValue.year}
                                onChange={onTextChange}
                            />
                            <Text fontWeight="400" fontSize="14px">
                                Deskripsi <span style={{ color: "red" }}>*</span>
                            </Text>
                            <Textarea
                                name="description"
                                fontSize="10pt"
                                placeholder="Ketik deskripsi inovasi"
                                height="100px"
                                value={textInputsValue.description}
                                onChange={onTextChange}
                            />
                            <Stack spacing={1}>
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
                                    onChange={onTextChange}
                                    required
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
                                            required
                                        />
                                    </InputGroup>
                                </Flex>
                            </Flex>
                            <Text fontWeight="400" fontSize="14px">
                                Foto inovasi <span style={{ color: "red" }}>*</span>
                            </Text>
                            <ImageUpload
                                selectedFile={selectedFiles}
                                setSelectedFile={setSelectedFiles}
                                selectFileRef={selectFileRef}
                                onSelectImage={onSelectImage}
                                maxFiles={5}
                            />
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
                                            required
                                            onChange={(e) => {
                                                const updatedBenefits = [...benefit];
                                                updatedBenefits[index].benefit = e.target.value;
                                                setBenefit(updatedBenefits);
                                            }}
                                        />
                                        {benefit.length > 1 && (
                                            <Button
                                                variant="none"
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
                                            required
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
                                                required
                                                onChange={(e) => {
                                                    const updatedRequirements = [...requirements];
                                                    updatedRequirements[index] = e.target.value;
                                                    setRequirements(updatedRequirements);
                                                }}
                                            />
                                            {requirements.length >= 1 && (
                                                <Button
                                                    variant="none"
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
                <Text color="red.500" fontSize="12px" mt="4px">
                    {error}
                </Text>
            )}
            {status === "Menunggu" ? (
                <StatusCard status={status} />
            ) : status === "Ditolak" ? (
                <>
                    <StatusCard status={status} message={catatanAdmin} />
                    <NavbarButton>
                        <Button
                            type="submit"
                            form="UpdateInnovation"
                            width="80%"
                            isLoading={loading}>
                            Update Inovasi
                        </Button>
                        <Button
                            type="button"
                            width="80%"
                            bg="red.500"
                            color="white"
                            _hover={{ bg: "red.600" }}
                            onClick={handleDeleteClick}
                        >
                            Delete Inovasi
                        </Button>
                    </NavbarButton>
                </>
            ) : status === "Terverifikasi" ? (
                <NavbarButton>
                    <Button
                        type="submit"
                        form="UpdateInnovation"
                        width="80%"
                        isLoading={loading}>
                        Update Inovasi
                    </Button>
                    <Button
                        type="button"
                        width="80%"
                        bg="red.500"
                        color="white"
                        _hover={{ bg: "red.600" }}
                        onClick={handleDeleteClick}
                    >
                        Delete Inovasi
                    </Button>
                </NavbarButton>
            ) : (
                <NavbarButton>
                    <Button
                        type="submit"
                        form="UpdateInnovation"
                        width="80%"
                        isLoading={loading}>
                        Update Inovasi
                    </Button>
                    <Button
                        type="button"
                        width="80%"
                        bg="red.500"
                        color="white"
                        _hover={{ bg: "red.600" }}
                        onClick={handleDeleteClick}
                    >
                        Delete Inovasi
                    </Button>
                </NavbarButton>
            )}
            <Box height="100px" />
            <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={handleClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Hapus Inovasi
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Apakah Anda yakin? Anda tidak dapat membatalkan tindakan ini
                            setelah inovasi dihapus.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={handleClose}>
                                Batal
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={onDeleteInnovation}
                                ml={3}
                                bg="red.500"
                                _hover={{ bg: "red.600" }}
                            >
                                Hapus
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
            <AlertDialog
                isOpen={isSuccessOpen}
                leastDestructiveRef={cancelRef}
                onClose={handleSuccessClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Sukses
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            Inovasi telah berhasil diperbarui.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={handleSuccessClose}>
                                OK
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
};

export default EditInnovation;
