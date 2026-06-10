import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
} from '@chakra-ui/react';
import getCroppedImg from '@/utils/cropImage';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  aspectRatio: number;
  onCropComplete: (croppedFile: File) => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  aspectRatio,
  onCropComplete,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const handleCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    try {
      setIsCropping(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (croppedBlob) {
        const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
        onCropComplete(file);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCropping(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent maxW="360px" w="95%" mx="auto">
        <ModalHeader>Sesuaikan Gambar</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box position="relative" width="100%" height="400px" bg="#333" borderRadius="md" overflow="hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={handleCropComplete}
              onZoomChange={setZoom}
            />
          </Box>
          <Box mt={4}>
            <Text mb={2} fontSize="sm" fontWeight="medium">Zoom</Text>
            <Slider
              aria-label="zoom"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(val) => setZoom(val)}
            >
              <SliderTrack>
                <SliderFilledTrack bg="green.500" />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Batal
          </Button>
          <Button
            bg="#244E3B"
            color="white"
            _hover={{ bg: "#1B5E20" }}
            onClick={handleConfirm}
            isLoading={isCropping}
          >
            Terapkan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImageCropperModal;
