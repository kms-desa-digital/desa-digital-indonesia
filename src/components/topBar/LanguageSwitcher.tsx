"use client";

import { Button, Menu, MenuButton, MenuList, MenuItem, Text, Flex, Box } from "@chakra-ui/react";
import { useLanguage } from "src/contexts/LanguageContext";
import Image from "next/image";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();

    const languages = [
        { code: "id", label: "ID", flag: "https://flagcdn.com/w40/id.png" },
        { code: "en", label: "EN", flag: "https://flagcdn.com/w40/gb.png" },
    ];

    return (
        <Menu>
            <MenuButton
                as={Button}
                variant="ghost"
                size="sm"
                px={1}
                _hover={{ bg: "transparent", opacity: 0.8 }}
                _active={{ bg: "transparent" }}
            >
                <Globe color="white" size={18} />
            </MenuButton>
            <MenuList minW="64px" bg="white" borderColor="gray.200" zIndex={1000} p={1}>
                {languages.map((lang) => (
                    <MenuItem
                        key={lang.code}
                        onClick={() => setLocale(lang.code as "id" | "en")}
                        _hover={{ bg: "gray.100" }}
                        borderRadius="4px"
                        py={1.5}
                        px={2}
                    >
                        <Flex align="center" gap={2}>
                            <Box borderRadius="1px" overflow="hidden" width="16px" height="11px">
                                <Image
                                    src={lang.flag}
                                    alt={lang.label}
                                    width={16}
                                    height={11}
                                    style={{ width: "16px", height: "11px", objectFit: "cover" }}
                                />
                            </Box>
                            <Text color="black" fontSize="12px" fontWeight="600">
                                {lang.label}
                            </Text>
                        </Flex>
                    </MenuItem>
                ))}
            </MenuList>
        </Menu>
    );
}
