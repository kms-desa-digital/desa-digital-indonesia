import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  Flex,
  Image,
  Button
} from "@chakra-ui/react";
import SmileRobot from "@public/icons/smile-robot.svg";


interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalBody2: string;    // Prop untuk konten modal
  onDone?: () => void;
}

const ConfModal: React.FC<ClaimModalProps> = ({
  isOpen,
  onClose,
  modalBody2,
  onDone,
}) => {
  const handleClose = () => {
    if (onDone) onDone();
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xs" isCentered>
      <ModalOverlay />
      <ModalContent maxWidth="360px" width="90%" mx="auto">
        <ModalBody paddingTop={4}>
          <Flex direction={'column'} alignItems={'center'} fontSize="12px" textAlign={'center'}>
            <Image src={SmileRobot} alt="question robot" boxSize={14} color="green.500" />
            {modalBody2}
          </Flex>
        </ModalBody>
        <ModalFooter paddingTop={2} justifyContent={'center'} >
          <Button borderRadius={4} onClick={onClose} size={'xs'} paddingInline={6} fontWeight={500} fontSize="11px">Oke</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfModal;
