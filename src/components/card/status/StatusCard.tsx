import { CheckIcon, CloseIcon, InfoIcon } from "@chakra-ui/icons";
import { Flex, Box, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import React from "react";

type StatusCardProps = {
  message?: string;
  status: string;
};

const StatusCard: React.FC<StatusCardProps> = ({ message, status }) => {
  const t = useTranslations("StatusCard");

  return (
    <Flex justify="center">
      <Flex
        align="center"
        justify="center"
        flexGrow={1}
        padding="12px 16px"
        borderTop="1px solid rgba(0, 0, 0, 0.1)"
        position="fixed"
        bg="white"
        bottom="0"
        maxW="360px"
        width="100%"
        boxShadow="0px -2px 4px 0px rgba(0, 0, 0, 0.06), 0px -4px 6px 0px rgba(0, 0, 0, 0.10)"
        zIndex="1000"
      >
        {/* jika terverifikasi */}
        {status === "Terverifikasi" ? (
          <Flex align="center" bg="#DCFCE7" p={3} borderRadius="8px" width="100%" justify="center">
            <CheckIcon fontSize="14px" color="#347357" mr="8px" />
            <Text fontSize="14px" fontWeight="700" color="#347357">
              {t("verified")}
            </Text>
          </Flex>
        ) : status === "Ditolak" ? (
          <Box bg="#FEE2E2" p={3} borderRadius="8px" width="100%">
            <Flex align="center" justify='center'>
              <CloseIcon fontSize="12px" color="#EF4444" mr="8px" />
              <Text fontSize="14px" fontWeight="700" color="#EF4444">
                {t("rejected")}
              </Text>
            </Flex>
            {message && (
              <Text
                fontSize="12px"
                fontWeight="500"
                color="#EF4444"
                textAlign="center"
                mt={1}
              >
                {t("note", { message })}
              </Text>
            )}
          </Box>
        ) : status === "Menunggu" || status === "Dalam Verifikasi" ? (
          <Flex align="center" bg="#FEF9C3" p={3} borderRadius="8px" width="100%" justify="center">
            <InfoIcon fontSize="14px" color="#854D0E" mr="8px" />
            <Text fontSize="14px" fontWeight="700" color="#854D0E">
              {t("pending")}
            </Text>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
};
export default StatusCard;
