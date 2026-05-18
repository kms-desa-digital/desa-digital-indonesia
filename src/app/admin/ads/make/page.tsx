"use client";

import { MinusIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Input, Stack, Text, useDisclosure, useToast } from "@chakra-ui/react";
import Container from "Components/container";
import LogoUpload from "Components/form/LogoUpload";
import TopBar from "Components/topBar";
import ConfModal from "Components/confirmModal/confModal";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createAd } from "Services/adminServices";
import { useTranslations } from "next-intl";

const MakeAds: React.FC = () => {
    const t = useTranslations("Admin");
    const router = useRouter();
    const toast = useToast();
    const [selectedImg, setSelectedImg] = useState<string>("");
    const ImgRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState<boolean>(false);
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
    });

    const isFormValid = () => {
        const trimmedName = textInputsValue.name.trim();
        const trimmedLink = textInputsValue.link.trim();
        const { minDate, maxDate } = textInputsValue;

        let isUrlValid = false;
        if (trimmedLink) {
            try {
                new URL(trimmedLink);
                isUrlValid = true;
            } catch {
                isUrlValid = false;
            }
        }

        const isDateValid = !!minDate && !!maxDate && new Date(minDate) < new Date(maxDate);

        return (
            trimmedName !== "" &&
            isDateValid &&
            selectedImg !== "" &&
            isUrlValid
        );
    };

    // Confirmation modal
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [pendingSubmit, setPendingSubmit] = useState<null | {
        name: string;
        minDate: string;
        maxDate: string;
        link: string;
        image?: string;
    }>(null);

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

    // Step 1: validate, then open confirmation modal
    const onValidateAndConfirm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setFieldErrors({});

        const trimmedName = textInputsValue.name.trim();
        const trimmedLink = textInputsValue.link.trim();
        const nextFieldErrors: typeof fieldErrors = {};

        if (!trimmedName) nextFieldErrors.name = t("adsErrorOrdererNameRequired");
        if (!textInputsValue.minDate) nextFieldErrors.minDate = t("adsErrorStartDateRequired");
        if (!textInputsValue.maxDate) nextFieldErrors.maxDate = t("adsErrorEndDateRequired");
        if (!trimmedLink) nextFieldErrors.link = t("adsErrorLinkRequired");
        if (!selectedImg) {
            setError(t("adsErrorImageRequired") || "Harap unggah gambar iklan.");
            return;
        }

        if (textInputsValue.minDate && textInputsValue.maxDate) {
            const minDate = new Date(textInputsValue.minDate);
            const maxDate = new Date(textInputsValue.maxDate);
            if (minDate >= maxDate) {
                nextFieldErrors.minDate = t("adsErrorDateRangeStart");
                nextFieldErrors.maxDate = t("adsErrorDateRangeEnd");
            }
        }

        if (trimmedLink) {
            try { new URL(trimmedLink); } catch {
                nextFieldErrors.link = t("adsErrorInvalidLink");
            }
        }

        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors);
            return;
        }

        // Valid — store payload and open confirm modal
        setPendingSubmit({
            name: trimmedName,
            minDate: textInputsValue.minDate,
            maxDate: textInputsValue.maxDate,
            link: trimmedLink,
            image: selectedImg || undefined,
        });
        onOpen();
    };

    // Step 2: confirmed — do the actual API call
    const onSubmitConfirmed = async () => {
        if (!pendingSubmit) return;
        setLoading(true);
        onClose();
        try {
            await createAd(pendingSubmit);
            toast({
                title: "Iklan berhasil dikirim",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
            router.push("/admin/ads");
        } catch (submitError: any) {
            console.error("Error adding ad: ", submitError);
            setError(submitError?.message || t("adsErrorSubmit"));
        } finally {
            setLoading(false);
            setPendingSubmit(null);
        }
    };
    return (
        <Container page>
            <TopBar title={t("adsAdd")} onBack={() => router.back()} />
            <form onSubmit={onValidateAndConfirm}>
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
                            <Text color="red.500" fontSize="12px" mt={2}>
                                {fieldErrors.name}
                            </Text>
                        )}
                    </Box>
                    <Box>
                        <Text fontSize="14px" fontWeight="400">
                            {t("adsDate")} <span style={{ color: "red" }}>*</span>
                        </Text>
                        <Flex align="center" justify="space-between" gap={2}>
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
                            <MinusIcon fontSize="8pt" mt={2} />
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
                            <Text color="red.500" fontSize="12px" mt={2}>
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
                        {fieldErrors.link ? (
                            <Text color="red.500" fontSize="12px" mt={2}>
                                {fieldErrors.link}
                            </Text>
                        ) : null}
                    </Box>
                    {error ? (
                        <Box px="14px">
                            <Text color="red.500" fontSize="12px">
                                {error}
                            </Text>
                        </Box>
                    ) : null}
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
                    <Button
                        width="100%"
                        type="submit"
                        isLoading={loading}
                        isDisabled={!isFormValid() || loading}
                    >
                        {t("adsSubmit")}
                    </Button>
                </Flex>
            </form>

            {/* Submit Confirmation — ConfModal */}
            <ConfModal
                isOpen={isOpen}
                onClose={onClose}
                modalTitle="Tambah Iklan"
                modalBody1="Apakah anda yakin ingin menambah iklan?"
                onYes={onSubmitConfirmed}
                isLoading={loading}
            />
        </Container>
    );
};
export default MakeAds;
