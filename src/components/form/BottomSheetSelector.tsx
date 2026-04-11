import React, { useState } from "react";
import {
    Box,
    Button,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    Flex,
    Icon,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    Text,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { FiSearch, FiX, FiChevronDown } from "react-icons/fi";

interface Option {
    label: string;
    value: string;
    count?: number;
}

interface BottomSheetSelectorProps {
    options: Option[];
    value?: string;
    onChange: (value: string, label: string) => void;
    placeholder?: string;
    title: string;
    searchPlaceholder?: string;
    disabled?: boolean;
}

const BottomSheetSelector: React.FC<BottomSheetSelectorProps> = ({
    options,
    value,
    onChange,
    placeholder = "Pilih",
    title,
    searchPlaceholder = "Cari di sini...",
    disabled = false,
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [search, setSearch] = useState("");

    const selectedOption = options.find((opt) => opt.value === value || opt.label === value);

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (option: Option) => {
        onChange(option.value, option.label);
        setSearch("");
        onClose();
    };

    return (
        <Box width="100%">
            <Button
                variant="outline"
                width="100%"
                justifyContent="space-between"
                onClick={onOpen}
                disabled={disabled}
                fontWeight="400"
                fontSize="14px"
                height="40px"
                px={3}
                bg="white"
                borderColor="#E5E7EB"
                rightIcon={<Icon as={FiChevronDown} />}
                _active={{ bg: "white" }}
                _hover={{ borderColor: "gray.300" }}
            >
                <Text color={selectedOption ? "black" : "gray.400"} isTruncated>
                    {selectedOption ? selectedOption.label : placeholder}
                </Text>
            </Button>

            <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
                <DrawerOverlay />
                <DrawerContent borderTopRadius="20px" maxHeight="80vh">
                    <DrawerHeader borderBottomWidth="0px" pt={4} px={4}>
                        <Flex justify="space-between" align="center">
                            <Text fontSize="16px" fontWeight="700">
                                {title}
                            </Text>
                            <IconButton
                                variant="ghost"
                                icon={<FiX />}
                                onClick={onClose}
                                aria-label="Close"
                                size="sm"
                            />
                        </Flex>
                        <InputGroup mt={4}>
                            <InputLeftElement pointerEvents="none" height="full">
                                <Icon as={FiSearch} color="gray.400" />
                            </InputLeftElement>
                            <Input
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                borderRadius="full"
                                fontSize="14px"
                                bg="#F9FAFB"
                                border="none"
                            />
                        </InputGroup>
                    </DrawerHeader>

                    <DrawerBody px={4} pb={6}>
                        <VStack align="stretch" spacing={0} mt={2}>
                            {filteredOptions.map((option, idx) => (
                                <Box
                                    key={idx}
                                    py={4}
                                    borderBottomWidth={idx === filteredOptions.length - 1 ? "0px" : "1px"}
                                    borderColor="gray.100"
                                    cursor="pointer"
                                    onClick={() => handleSelect(option)}
                                    _hover={{ bg: "gray.50" }}
                                >
                                    <Text fontSize="14px" fontWeight={value === option.value || value === option.label ? "600" : "400"}>
                                        {option.label}
                                    </Text>
                                    {option.count !== undefined && (
                                        <Text fontSize="12px" color="gray.500" mt={1}>
                                            {option.count} Inovasi
                                        </Text>
                                    )}
                                </Box>
                            ))}
                            {filteredOptions.length === 0 && (
                                <Text textAlign="center" py={8} color="gray.500" fontSize="14px">
                                    Tidak ada opsi ditemukan
                                </Text>
                            )}
                        </VStack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </Box>
    );
};

export default BottomSheetSelector;
