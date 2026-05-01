import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerCloseButton,
} from "@chakra-ui/react";
import Instagram from "@public/icons/instagram.svg";
import Web from "@public/icons/web.svg";
import Whatsapp from "@public/icons/whatsapp.svg";
import JavascriptImage from "next/image";
import React from "react";
import { useTranslations } from "next-intl";
import {
  ButtonKontak,
  Icon
} from "src/app/village/detail/[id]/_styles";

const ROLE_TRANSLATION_KEYS = {
  inovator: "role.innovator",
  innovator: "role.innovator",
  desa: "role.village",
  village: "role.village",
} as const;

interface ContactData {
  whatsapp?: string;
  instagram?: string;
  website?: string;
}

interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean | null;
  loading?: boolean;
  onVerify?: () => void;
  setOpenModal?: (value: boolean) => void;
  role: string;
  contactData?: ContactData; // Menambahkan data kontak
}

const ActionDrawer: React.FC<ActionDrawerProps> = ({
  isOpen,
  onClose,
  isAdmin,
  loading,
  onVerify,
  setOpenModal,
  role,
  contactData, // Menerima contactData
}) => {
  const t = useTranslations("Innovator");

  const translatedRole = t(
    ROLE_TRANSLATION_KEYS[role?.trim().toLowerCase() as keyof typeof ROLE_TRANSLATION_KEYS] ??
      "role.innovator"
  );

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose} variant="purple">
      <DrawerOverlay />
      <DrawerContent
        sx={{
          borderRadius: "lg",
          width: "360px",
          my: "auto",
          mx: "auto",
        }}
      >
        {isAdmin ? (
          <>
            <DrawerHeader
              sx={{
                display: "flex",
                justifyContent: "center",
                color: "#1F2937",
                fontSize: "16px",
              }}
            >
              Apakah Anda ingin memverifikasi atau menolak permohonan ini?
            </DrawerHeader>
            <DrawerBody fontSize={12} color="#374151" paddingX={4} gap={4}>
              <Button
                colorScheme="green"
                width="100%"
                mb={4}
                onClick={onVerify}
                isLoading={loading}
              >
                Verifikasi
              </Button>
              <Button
                variant="outline"
                colorScheme="green"
                width="100%"
                onClick={() => setOpenModal?.(true)}
                _hover={{ bg: "red.500", color: "white", border: "none" }}
              >
                Tolak
              </Button>
            </DrawerBody>
          </>
        ) : (
          <>
            <DrawerHeader
              sx={{
                display: "flex",
                justifyContent: "center",
                color: "#1F2937",
                fontSize: "16px",
              }}
            >
              <DrawerCloseButton
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  color: "#1F2937",
                  paddingTop: "10px",
                }}
              />
              {t("contactRole", { role: translatedRole })}
            </DrawerHeader>
            <DrawerBody fontSize={12} color="#374151" paddingX={4} pt={2} pb={6}>
              <Box mb={2}>
                {t("contactDescription", { role: translatedRole })}
              </Box>

              {/* Tombol WA */}
              <ButtonKontak as="a" href={contactData?.whatsapp ? `https://wa.me/${contactData.whatsapp}` : "#"} target="_blank">
                <JavascriptImage src={Whatsapp} alt="WA" width={24} height={24} style={{ width: '24px', height: '24px' }} />
                WhatsApp
              </ButtonKontak>

              {/* Tombol ig */}
              <ButtonKontak as="a" href={contactData?.instagram || "#"} target="_blank">
                <JavascriptImage src={Instagram} alt="IG" width={24} height={24} style={{ width: '24px', height: '24px' }} />
                Instagram
              </ButtonKontak>

              {/* Tombol web */}
              <ButtonKontak as="a" href={contactData?.website || "#"} target="_blank">
                <JavascriptImage src={Web} alt="Web" width={24} height={24} style={{ width: '24px', height: '24px' }} />
                Website
              </ButtonKontak>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default ActionDrawer;
