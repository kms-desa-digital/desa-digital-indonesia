"use client";

import { MinusIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Input, Stack, Text } from "@chakra-ui/react";
import Container from "Components/container";
import LogoUpload from "Components/form/LogoUpload";
import TopBar from "Components/topBar";
import { doc } from "firebase/firestore";
import React, { useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth, firestore } from "@/firebase/clientApp";

const MakeAds: React.FC = () => {
    const router = useRouter();
    const [user] = useAuthState(auth);
    // TODO: Buat backend untuk upload gambar
    const [selectedImg, setSelectedImg] = useState<string>("");
    const ImgRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [textInputsValue, setTextInputsValue] = useState({
        name: "",
        minDate: "",
        maxDate: "",
        link: "",
    });

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

    // TODO: Benerin fungsi onSubmitForm

    const onSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            const docRef = doc(firestore, "ads");
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };
    return (
        <Container page>
            <TopBar title="Tambah Iklan" onBack={() => router.back()} />
            <form>
                <Stack padding="0 14px" direction="column" mt={4} gap={4}>
                    <Box>
                        <Text fontSize="14px" fontWeight="400">
                            Pemesan Iklan <span style={{ color: "red" }}>*</span>
                        </Text>
                        <Input
                            placeholder="Nama Pemesan Iklan"
                            name="name"
                            fontSize="10pt"
                            _placeholder={{ color: "gray.500" }}
                            mt={2}
                            value={textInputsValue.name}
                            onChange={onTextChange}
                        />
                    </Box>
                    <Box>
                        <Text fontSize="14px" fontWeight="400">
                            Tanggal Iklan <span style={{ color: "red" }}>*</span>
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
                            />
                        </Flex>
                    </Box>
                    <Box>
                        <Text fontSize="14px" fontWeight="400">
                            Gambar Iklan <span style={{ color: "red" }}>*</span>
                        </Text>
                        <Text fontSize="10pt" color="gray.400">
                            Format gambar: .jpg, .jpeg, .png
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
                            Link Iklan <span style={{ color: "red" }}>*</span>
                        </Text>
                        <Input
                            placeholder="https://example.com"
                            name="link"
                            fontSize="10pt"
                            _placeholder={{ color: "gray.500" }}
                            mt={2}
                            type="link"
                            value={textInputsValue.link}
                            onChange={onTextChange}
                        />
                    </Box>
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
                    <Button width="100%" type="submit">
                        Kirim Iklan
                    </Button>
                </Flex>
            </form>
        </Container>
    );
};
export default MakeAds;
