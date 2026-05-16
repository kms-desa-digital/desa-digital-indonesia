import { Button, Flex, Icon, Image, Text, Progress, Box, Tag } from "@chakra-ui/react";
import React, { useState } from "react";
import Folder from "@public/icons/folder.svg";
import { DeleteIcon } from "@chakra-ui/icons";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../../firebase/clientApp";

type DocUploadProps = {
    selectedDoc: string[]; // Menyimpan URL file
    setSelectedDoc: (value: string[]) => void;
    selectDocRef: React.RefObject<HTMLInputElement | null>;
    onSelectDoc?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
};

const DocUpload: React.FC<DocUploadProps> = ({
    selectedDoc,
    setSelectedDoc,
    selectDocRef,
    onSelectDoc,
    disabled
}) => {
    const handleDeleteDoc = (index: number) => {
        const newDoc = [...selectedDoc];
        newDoc.splice(index, 1);
        setSelectedDoc(newDoc);
    };

    const getFileName = (url: string) => {
        if (!url) return "Dokumen";
        if (url.startsWith("data:")) {
            return "File baru dipilih";
        }
        try {
            const decodedUrl = decodeURIComponent(url);
            const parts = decodedUrl.split("/");
            const lastPart = parts[parts.length - 1];
            const fileNameWithTimestamp = lastPart.split("?")[0];
            if (fileNameWithTimestamp.includes("_")) {
                return fileNameWithTimestamp.split("_").slice(1).join("_");
            }
            return fileNameWithTimestamp;
        } catch (e) {
            return "Dokumen";
        }
    };

    return (
        <Flex direction="column" justifyContent="space-between" gap={2} alignItems={'stretch'}>
            {selectedDoc.map((url, index) => (
                <Flex justifyContent="space-between" key={index}>
                    <Flex
                        direction="row"
                        maxWidth="270px"
                        maxHeight="32px"
                        width="100%"
                        height="100%"
                        bg="#E5FFE4"
                        borderRadius="4px"
                        border="1px solid #347357"
                        paddingRight={2}
                        paddingLeft={2}
                        gap={4}
                        position="relative"
                    >
                        <Text
                            margin={1}
                            fontSize="sm"
                            color="gray.800"
                            maxWidth="95%"
                            whiteSpace="nowrap"
                            textOverflow="ellipsis"
                            overflow="hidden"
                            as={url.startsWith("data:") ? 'span' : 'a'}
                            cursor={url.startsWith("data:") ? 'default' : "pointer"}
                            onClick={() => {
                                if (!url.startsWith("data:")) {
                                    window.open(url, "_blank");
                                }
                            }}
                            title={url.startsWith("data:") ? "" : "Klik untuk mengunduh dokumen"}
                            _hover={url.startsWith("data:") ? {} : {
                                textDecoration: "underline",
                                color: "blue.500",
                            }}
                        >
                            {getFileName(url)}
                        </Text>
                        {url.startsWith("data:") && (
                            <Tag size="sm" colorScheme="orange" variant="subtle" fontSize="9px" borderRadius="full" ml={1}>
                                Menunggu Pengajuan
                            </Tag>
                        )}
                    </Flex>
                    <Button
                        bg="red.500"
                        _hover={{ bg: "red.600" }}
                        width="32px"
                        height="32px"
                        variant="solid"
                        size="md"
                        onClick={() => handleDeleteDoc(index)}
                        disabled={disabled}
                    >
                        <DeleteIcon />
                    </Button>
                </Flex>
            ))}

            {
                selectedDoc.length < 3 && !disabled && (
                    <Button
                        leftIcon={<img src={Folder.src} alt="folder" />}
                        _hover={{ bg: "DBFFE6" }}
                        size='xs'
                        variant='outline'
                        display="flex"
                        maxWidth="126px"
                        width="100%"
                        border="2px"
                        cursor="pointer"
                        borderRadius="4px"
                        borderColor="#347357"
                        onClick={() => selectDocRef.current?.click()}
                        fontSize="10pt" color="#347357" fontWeight="400"
                        justifyContent="left"
                    >
                        Pilih Dokumen
                        <input
                            id="file-upload"
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx"
                            ref={selectDocRef}
                            onChange={onSelectDoc}
                        />
                    </Button>
                )
            }
        </Flex >
    );
};
export default DocUpload;