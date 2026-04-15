import {
  Button,
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
} from "@chakra-ui/react";
import QuestionRobot from "@public/icons/question-robot.svg";
import React from "react";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalTitle: string; // Prop untuk judul modal
  modalBody1: string; // Prop untuk konten modal
  onYes: () => void;
  isLoading?: boolean;
}

const ConfModal: React.FC<ClaimModalProps> = ({
  isOpen,
  onClose,
  modalTitle,
  modalBody1,
  onYes,
  isLoading,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xs" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalBody paddingTop={4}>
          <Flex direction={"column"} alignItems={"center"} fontSize="12px" textAlign={"center"}>
            <Image
              src={QuestionRobot.src}
              alt="question robot"
              boxSize={14}
              color="green.500"
            />
            {modalBody1}
          </Flex>
          <Flex alignItems={"center"} fontSize="11px" justifyContent={"center"}>
            Pastikan data yang anda masukkan sudah benar
          </Flex>
        </ModalBody>
        <ModalFooter paddingTop={2} justifyContent={"center"}>
          <Button
            borderRadius={4}
            variant={"outline"}
            mr={4}
            onClick={onClose}
            size={"xs"}
            paddingInline={4}
            fontWeight={500}
            fontSize="11px"
          >
            Tidak
          </Button>
          <Button
            borderRadius={4}
            onClick={onYes}
            size={"xs"}
            paddingInline={6}
            fontWeight={500}
            fontSize="11px"
            type="submit"
            isLoading={isLoading}
          >
            Ya
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfModal;
