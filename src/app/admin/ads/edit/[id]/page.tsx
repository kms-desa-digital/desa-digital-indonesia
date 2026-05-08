"use client";

import { MinusIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Input, Skeleton, Stack, Text, useToast } from "@chakra-ui/react";
import Container from "Components/container";
import LogoUpload from "Components/form/LogoUpload";
import TopBar from "Components/topBar";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateAd, getAdById } from "Services/adminServices";
import { useTranslations } from "next-intl";

const EditAds: React.FC = () => {
    const t = useTranslations("Admin");
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const toast = useToast();

    const [selectedImg, setSelectedImg] = useState<string>("");
    const ImgRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fetching, setFetching] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{
        name?: string;
        minDate?: string;
        maxDate?: string;
        link?: string;
    }>({});
    const [textInputsValue, setTextInputsValue] = useState({
        name: "",
        minDate: "",
        maxDate: "",
        link: "",
        status: "",
    });

    useEffect(() => {
        const fetchAd = async () => {
            if (!id) return;
            setFetching(true);
            try {
                const response: any = await getAdById(id);
                // axios interceptor returns response.data, so response = { message, data: adDoc }
                const ad = response?.data ?? response;
                if (ad) {
                    setTextInputsValue({
                        name: ad.name || "",
                        minDate: ad.minDate ? new Date(ad.minDate).toISOString().split("T")[0] : "",
                        maxDate: ad.maxDate ? new Date(ad.maxDate).toISOString().split("T")[0] : "",
                        link: ad.link || "",
                        status: ad.status || "Menunggu",
                    });
                    if (ad.image) setSelectedImg(ad.image);
                }
            } catch (err) {
                console.error("Error fetching ad:", err);
                setError("Gagal memuat data iklan.");
            } finally {
                setFetching(false);
            }
        };
        fetchAd();
    }, [id]);

    const onSelectImg = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImg(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onTextChange = ({
        target: { name, value },
    }: React.ChangeEvent<HTMLInputElement>) =>
        setTextInputsValue({ ...textInputsValue, [name]: value });

    const onSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setFieldErrors({});

        const trimmedName = textInputsValue.name.trim();
        const trimmedLink = textInputsValue.link.trim();
        const nextFieldErrors: typeof fieldErrors = {};

        if (!trimmedName) nextFieldErrors.name = t("adsErrorOrdererNameRequired");
        if (!textInputsValue.minDate) nextFieldErrors.minDate = t("adsErrorStartDateRequired");
        if (!textInputsValue.maxDate) nextFieldErrors.maxDate = t("adsErrorEndDateRequired");
        if (!trimmedLink) nextFieldErrors.link = t("adsErrorLinkRequired");

        if (textInputsValue.minDate && textInputsValue.maxDate) {
            const minDate = new Date(textInputsValue.minDate);
            const maxDate = new Date(textInputsValue.maxDate);
            if (minDate >= maxDate) {
                nextFieldErrors.minDate = t("adsErrorDateRangeStart");
                nextFieldErrors.maxDate = t("adsErrorDateRangeEnd");
            }
        }

        if (trimmedLink) {
            try {
                new URL(trimmedLink);
            } catch {
                nextFieldErrors.link = t("adsErrorInvalidLink");
            }
        }

        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors);
            setLoading(false);
            return;
        }

        try {
            await updateAd(id, {
                name: trimmedName,
                minDate: textInputsValue.minDate,
                maxDate: textInputsValue.maxDate,
                link: trimmedLink,
                image: selectedImg || undefined,
            });

            toast({
                title: "Iklan berhasil diperbarui",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top",
            });

            router.push("/admin/ads");
        } catch (submitError: any) {
            console.error("Error updating ad: ", submitError);
            setError(submitError?.message || "Gagal memperbarui iklan. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <Container page>
                <TopBar title="Edit Iklan" onBack={() => router.back()} />
                <Stack padding="0 14px" mt={4} gap={4}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Box key={i}>
                            <Skeleton height="16px" width="40%" mb={2} />
                            <Skeleton height="40px" borderRadius="md" />
                        </Box>
                    ))}
                </Stack>
            </Container>
        );
    }

    return (
        <Container page>
            <TopBar title="Edit Iklan" onBack={() => router.back()} />
            <form onSubmit={onSubmitForm}>
                <Stack padding="0 14px" direction="column" mt={4} gap={4}>
                    <Box>
                        <Text fontSize="14px" fontWeight="400">
                            {t("adsOrderer")} <span style={{ color: "red" }}>*</span>
                        </Text>
                        <Input
                            placeholder={t("adsOrdererNamePlaceholder")}
                            name="name"
                            fontSize="10pt"
                            _placeholder={{ color: "gray.500" }}
                            mt={2}
                            value={textInputsValue.name}
                            onChange={onTextChange}
                            isInvalid={!!fieldErrors.name}
                        />
                        {fieldErrors.name && (
                            <Text color="red.500" fontSize="12px" mt={1}>
                                {fieldErrors.name}
                            </Text>
                        )}
                    </Box>
                    <Box>
                        <Text fontSize="14px" fontWeight="400">
                            {t("adsDate")} <span style={{ color: "red" }}>*</span>
                        </Text>
                        <Flex align="center" justify="space-between">
                            <Input
                                placeholder="DD/MM/YYYY"
                                name="minDate"
                                fontSize="10pt"
                                _placeholder={{ color: "gray.500" }}
                                mt={2}
                                type="date"
                                maxW="150px"
                                value={textInputsValue.minDate}
                                onChange={onTextChange}
                                isInvalid={!!fieldErrors.minDate}
                            />
                            <MinusIcon fontSize="8pt" />
                            <Input
                                placeholder="DD/MM/YYYY"
                                name="maxDate"
                                fontSize="10pt"
                                _placeholder={{ color: "gray.500" }}
                                mt={2}
                                type="date"
                                maxW="150px"
                                value={textInputsValue.maxDate}
                                onChange={onTextChange}
                                isInvalid={!!fieldErrors.maxDate}
                            />
                        </Flex>
                        {(fieldErrors.minDate || fieldErrors.maxDate) && (
                            <Text color="red.500" fontSize="12px" mt={1}>
                                {fieldErrors.minDate || fieldErrors.maxDate}
                            </Text>
                        )}
                    </Box>
                    <Box>
                        <Text fontSize="14px" fontWeight="400">
                            {t("adsImage")} <span style={{ color: "red" }}>*</span>
                        </Text>
                        <Text fontSize="10pt" color="gray.400">
                            {t("adsImageFormat")}
                        </Text>
                        <Flex>
                            <LogoUpload
                                selectedLogo={selectedImg}
                                setSelectedLogo={setSelectedImg}
                                selectFileRef={ImgRef}
                                onSelectLogo={onSelectImg}
                            />
                        </Flex>
                    </Box>
                    <Box>
                        <Text fontSize="14px" fontWeight="400">
                            {t("adsLink")} <span style={{ color: "red" }}>*</span>
                        </Text>
                        <Input
                            placeholder="https://example.com"
                            name="link"
                            fontSize="10pt"
                            _placeholder={{ color: "gray.500" }}
                            mt={2}
                            type="url"
                            value={textInputsValue.link}
                            onChange={onTextChange}
                            isInvalid={!!fieldErrors.link}
                        />
                        {fieldErrors.link && (
                            <Text color="red.500" fontSize="12px" mt={2}>
                                {fieldErrors.link}
                            </Text>
                        )}
                    </Box>
                    {error && (
                        <Box px="14px">
                            <Text color="red.500" fontSize="12px">
                                {error}
                            </Text>
                        </Box>
                    )}
                </Stack>
                <Flex
                    align="center"
                    justify="center"
                    flexGrow={1}
                    padding="12px 18px"
                    borderTop="1px solid rgba(0, 0, 0, 0.1)"
                    position="fixed"
                    bottom="0"
                    width="100%"
                    maxW="360px"
                    boxShadow="0px -2px 4px 0px rgba(0, 0, 0, 0.06), 0px -4px 6px 0px rgba(0, 0, 0, 0.10)"
                    bg="white"
                >
                    <Button width="100%" type="submit" isLoading={loading}
                        backgroundColor="#347357"
                        color="white"
                        _hover={{ backgroundColor: "#2a5c46" }}
                    >
                        Simpan Perubahan
                    </Button>
                </Flex>
            </form>
        </Container>
    );
};

export default EditAds;
