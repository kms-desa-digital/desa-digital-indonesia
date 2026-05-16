import { DeleteIcon } from "@chakra-ui/icons";
import { Button, Flex, Text, Progress, Box, Tag } from "@chakra-ui/react";
import Video from "@public/icons/video-camera.svg";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import React, { useState } from "react";
import { storage } from "../../firebase/clientApp";


type VidUploadProps = {
  selectedVid: string; // Menyimpan URL video
  setSelectedVid: (value: string) => void;
  selectVidRef: React.RefObject<HTMLInputElement | null>;
  onSelectVid?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};

const VidUpload: React.FC<VidUploadProps> = ({
  selectedVid,
  setSelectedVid,
  selectVidRef,
  onSelectVid,
  disabled,
}) => {
  const handleDeleteVid = () => {
    setSelectedVid("");
  };

  const getFileName = (url: string) => {
    if (!url) return "Video";
    if (url.startsWith("data:")) {
      return "Video baru dipilih";
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
      return "Video";
    }
  };

  return (
    <Flex direction="column" gap={2}>
      {selectedVid ? (
        <Flex justifyContent="space-between" >
          <Flex
            direction="row"
            justifyContent="space-between"
            maxWidth="270px"
            maxHeight="32px"
            height="100%"
            width="100%"
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
              as={selectedVid.startsWith("data:") ? 'span' : 'a'}
              cursor={selectedVid.startsWith("data:") ? 'default' : "pointer"}
              onClick={() => {
                if (!selectedVid.startsWith("data:")) {
                  window.open(selectedVid, "_blank");
                }
              }}
              title={selectedVid.startsWith("data:") ? "" : "Klik untuk menonton video"}
              _hover={selectedVid.startsWith("data:") ? {} : {
                textDecoration: "underline",
                color: "blue.500",
              }}
            >
              {getFileName(selectedVid)}
            </Text>
            {selectedVid.startsWith("data:") && (
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
            onClick={handleDeleteVid}
            isDisabled={disabled}
          >
            <DeleteIcon />
          </Button>
        </Flex>
      ) : (
        <>
          {!disabled && (
            <Button
              leftIcon={<img src={Video.src} alt="video" />}
              _hover={{ bg: "DBFFE6" }}
              size='xs'
              variant='outline'
              display="flex"
              maxWidth="106px"
              width="100%"
              border="2px"
              cursor="pointer"
              borderRadius="4px"
              borderColor="#347357"
              onClick={() => selectVidRef.current?.click()}
              fontSize="10pt" color="#347357" fontWeight="400"
              justifyContent="left"
            >
              Pilih Video
              <input
                id="file-upload"
                type="file"
                hidden
                accept="video/mp4"
                ref={selectVidRef}
                onChange={onSelectVid}
              />
            </Button>
          )}
        </>
      )}
    </Flex>
  );
};
export default VidUpload;

