import { Button, Flex, Icon, Image, Text, Progress, Box } from "@chakra-ui/react";
import React from "react";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../../firebase/clientApp";

type ImageUploadProps = {
  selectedFile: string[];
  disabled?: boolean;
  setSelectedFile: (value: string[]) => void;
  selectFileRef: React.RefObject<HTMLInputElement | null>;
  onSelectImage: (event: React.ChangeEvent<HTMLInputElement>, maxFiles: number) => void;
  maxFiles?: number;
  claimId?: string;
};

const ImageUpload: React.FC<ImageUploadProps> = ({
  selectedFile,
  setSelectedFile,
  selectFileRef,
  onSelectImage,
  disabled,
  maxFiles = 5,
  claimId,
}) => {
  const [uploadProgress, setUploadProgress] = React.useState<{ [key: number]: number }>({});

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !claimId) {
      onSelectImage(event, maxFiles);
      return;
    }

    Array.from(files).forEach((file, index) => {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `claimInnovations/${claimId}/images/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      const fileIndex = selectedFile.length + index;

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress((prev) => ({ ...prev, [fileIndex]: progress }));
        },
        (error) => console.error("Upload error:", error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setSelectedFile([...selectedFile, downloadURL]);
          setUploadProgress((prev) => {
            const newState = { ...prev };
            delete newState[fileIndex];
            return newState;
          });
        }
      );
    });
  };

  const handleDelete = (index: number) => {
    const newFiles = [...selectedFile];
    newFiles.splice(index, 1);
    setSelectedFile(newFiles);
  };
  return (
    <Flex direction="row" width="130" wrap="wrap" gap="10px">
      {selectedFile.map((file, index) => (
        <Flex
          key={index}
          direction="row"
          alignItems="center"
          position="relative"
          align-items="center"
          align-content="center"
          maxWidth="130px"
          maxHeight="130px"
          height="100%"
          width="100%"
          overflow="hidden"
        >
          <Image
            src={file}
            borderRadius="8px"
            height="130px"
            width="130px"
            objectFit="cover"
          />
          <Button
            bg="red.500"
            _hover={{ bg: "red.600" }}
            width="32px"
            height="32px"
            variant="solid"
            size="md"
            onClick={() => handleDelete(index)}
            position="absolute"
            bottom="8px" /* Atur posisi tombol */
            right="8px"
            disabled={disabled}
          >
            <DeleteIcon />
          </Button>
        </Flex>
      ))}

      {Object.keys(uploadProgress).map((key) => {
        const idx = parseInt(key);
        return (
          <Flex
            key={`progress-${idx}`}
            justify="center"
            align="center"
            border="1px dashed"
            direction="column"
            borderRadius="8px"
            width="128px"
            height="128px"
            borderColor="green.500"
            bg="green.50"
          >
            <Text fontSize="xs" color="green.600" mb={1}>Uploading...</Text>
            <Box width="80%">
              <Progress value={uploadProgress[idx]} size="xs" colorScheme="green" borderRadius="full" />
            </Box>
          </Flex>
        );
      })}
      {!disabled && selectedFile.length < maxFiles && (
        <Flex
          justify="center"
          align="center"
          padding="12px 8px"
          border="1px dashed "
          direction="column"
          cursor="pointer"
          borderRadius="8px"
          width="128px"
          height="128px"
          borderColor="gray.500"
          onClick={() => selectFileRef.current?.click()}
          _disabled={{ cursor: "not-allowed" }}
        >
          <Icon as={AddIcon} color="gray.300" fontSize="16px" />
          <Text fontSize="10pt" color="gray.500" mt={2}>
            Tambahkan foto
          </Text>
          <input
            id="file-upload"
            type="file"
            hidden
            accept="image/png,image/jpeg,image/jpg"
            ref={selectFileRef}
            onChange={handleImageChange}
            disabled={disabled}
          />
        </Flex>
      )}
    </Flex>
  );
};
export default ImageUpload;
