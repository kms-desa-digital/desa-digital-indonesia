import { Button, Flex, Icon, Image, Text, Progress, Box } from "@chakra-ui/react";
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
    disabled
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleSelectDoc = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setProgress(0);

        try {
            const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(p);
                },
                (error) => {
                    console.error("Upload failed", error);
                    setUploading(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setSelectedDoc([...selectedDoc, downloadURL]);
                    setUploading(false);
                    setProgress(0);
                }
            );
        } catch (error) {
            console.error("Error uploading document:", error);
            setUploading(false);
        }
    };

    const handleDeleteDoc = (index: number) => {
        const newDoc = [...selectedDoc];
        newDoc.splice(index, 1);
        setSelectedDoc(newDoc);
    };

    const getFileName = (url: string) => {
        try {
            const decodedUrl = decodeURIComponent(url);
            // Ambil bagian setelah nama folder terakhir dan sebelum query params
            const parts = decodedUrl.split("/");
            const lastPart = parts[parts.length - 1];
            // Hilangkan query params (alt=media...)
            const fileNameWithTimestamp = lastPart.split("?")[0];
            // Hilangkan timestamp (format: 123456789_filename.ext)
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
                            as='a'
                            cursor="pointer"
                            onClick={() => {
                                window.open(url, "_blank");
                            }}
                            title="Klik untuk mengunduh dokumen"
                            _hover={{
                                textDecoration: "underline",
                                color: "blue.500",
                            }}
                        >
                            {getFileName(url)}
                        </Text>
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

            {uploading && (
                <Box width="270px">
                    <Text fontSize="10px" color="gray.500">Mengunggah... {Math.round(progress)}%</Text>
                    <Progress value={progress} size="xs" colorScheme="green" borderRadius="4px" mt={1} />
                </Box>
            )}

            {
                selectedDoc.length < 3 && !uploading && !disabled && (
                    <Button
                        leftIcon={<img src={Folder} alt="folder" />}
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
                            onChange={handleSelectDoc}
                        />
                    </Button>
                )
            }
        </Flex >
    );
};
export default DocUpload;

// <Icon as={AddIcon} color="gray.300" fontSize="16px" />