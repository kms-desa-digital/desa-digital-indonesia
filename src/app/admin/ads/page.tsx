"use client";

import { AddIcon, ChevronDownIcon, SearchIcon } from "@chakra-ui/icons";
import {
    Button,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Box,
} from "@chakra-ui/react";
import Container from "Components/container";
import TopBar from "Components/topBar";
import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { paths } from "Consts/path";

const AdminAdsPage: React.FC = () => {
    const t = useTranslations("Admin");
    const router = useRouter();

    return (
        <Container page>
            <TopBar title={t("adsTitle")} onBack={() => router.back()} />
            
            <Box padding="0 16px">
                <Flex justify="space-between" align="center" mt={8} gap={2}>
                    <Flex flexGrow={1}>
                        <InputGroup>
                            <InputLeftElement
                                pointerEvents="none"
                            >
                                <SearchIcon color="gray.400" />
                            </InputLeftElement>
                            <Input
                                placeholder={t("adsSearchPlaceholder")}
                                size="md"
                                bg="white"
                                borderRadius="full"
                                _placeholder={{ color: "gray.400" }}
                            />
                        </InputGroup>
                    </Flex>

                    <Menu>
                        <MenuButton
                            as={Button}
                            rightIcon={<ChevronDownIcon color="#347357" />}
                            borderRadius="8px"
                            backgroundColor="white"
                            border="1px solid"
                            borderColor="gray.200"
                            textColor={"gray.600"}
                            _hover={{ bg: "gray.50" }}
                            fontSize="12px"
                            fontWeight="normal"
                        >
                            Filter
                        </MenuButton>
                        <MenuList>
                            <MenuItem>Semua</MenuItem>
                            <MenuItem>Menunggu</MenuItem>
                            <MenuItem>Ditampilkan</MenuItem>
                            <MenuItem>Selesai</MenuItem>
                        </MenuList>
                    </Menu>
                </Flex>

                <Flex justify="center" mt={8}>
                    <Button
                        leftIcon={<AddIcon />}
                        fontSize="14px"
                        fontWeight="700"
                        width="100%"
                        colorScheme="brand"
                        backgroundColor="#347357"
                        color="white"
                        _hover={{ backgroundColor: "#2a5c46" }}
                        onClick={() => router.push(paths.MAKE_ADS)}
                    >
                        {t("adsAdd")}
                    </Button>
                </Flex>
            </Box>
        </Container>
    );
};

export default AdminAdsPage;
