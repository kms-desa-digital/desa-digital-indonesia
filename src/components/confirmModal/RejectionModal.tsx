import {
    Button,
    Flex,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay
} from "@chakra-ui/react";
import React from "react";

type RejectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  setMessage: (value: string) => void;
  loading: boolean;
};

const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  setMessage,
}) => {
  return (
    <Flex maxW="360px" justifyContent="center">
      <Modal isOpen={isOpen} onClose={onClose} size="xs" isCentered>
        <ModalOverlay />
        <ModalContent justifyContent="center" display="flex">
          <ModalHeader fontSize="12px" fontWeight="700" textAlign="center">
            Berikan Alasan Penolakan Anda
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Masukkan alasan penolakan"
            />
          </ModalBody>
          <ModalFooter justifyContent="center">
            <Button
              variant="outline"
              fontSize="10px"
              fontWeight="500"
              _hover={{ bg: "red.500", color: "white", border: "none" }}
              mr={3}
              onClick={onClose}
              height="23px"
              width="56px"
            >
              Batal
            </Button>
            <Button
              fontSize="10px"
              fontWeight="500"
              height="23px"
              width="56px"
              onClick={onConfirm}
            >
              Kirim
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};
export default RejectionModal;
