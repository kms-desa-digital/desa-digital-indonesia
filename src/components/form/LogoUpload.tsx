import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { Button, Flex, Icon, Image, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslations } from "next-intl";

type LogoUploadProps = {
  selectedLogo: string;
  disabled?: boolean;
  setSelectedLogo: (value: string) => void;
  selectFileRef: React.RefObject<HTMLInputElement | null>;
  onSelectLogo: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const LogoUpload: React.FC<LogoUploadProps> = ({
  selectedLogo,
  setSelectedLogo,
  selectFileRef,
  disabled,
  onSelectLogo,
}) => {
  const t = useTranslations("Common");

  return (
    <Flex direction="column" width="100%" wrap="wrap">
      {selectedLogo ? (
        <>
          <Flex
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Image
              src={selectedLogo}
              width="128px"
              height="128px"
              maxWidth="128px"
              maxHeight="128px"
              borderRadius="8px"
              _disabled={{ cursor: "not-allowed" }}
              mt={2}
            />
            <Button
              bg="red.500"
              _hover={{ bg: "red.600" }}
              width="32px"
              height="32px"
              variant="solid"
              size="md"
              disabled={disabled}
              onClick={() => setSelectedLogo("")}
            >
              <DeleteIcon />
            </Button>
          </Flex>
        </>
      ) : (
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
          mt={2}
        >
          <Icon as={AddIcon} color="gray.300" fontSize="16px" />
          <Text fontSize="10pt" color="gray.500" mt={2}>
            {t("uploadPhoto")}
          </Text>
          <input
            id="file-upload"
            type="file"
            hidden
            accept="image/png,image/jpeg,image/jpg"
            ref={selectFileRef}
            onChange={onSelectLogo}
          />
        </Flex>
      )}
    </Flex>
  );
};
export default LogoUpload;
