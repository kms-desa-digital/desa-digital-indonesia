import {
  Container,
  Background,
  CardContent,
  Title,
  Description,
  Logo,
  ContBadge,
} from "./_cardInnovatorStyle";

import React from "react";
import { useTranslations } from "next-intl";
import { Flex } from "@chakra-ui/react";


type CardInnovatorProps = {
  id: string;
  header: string;
  logo: string;
  namaInovator: string;
  jumlahDesaDampingan: number
  jumlahInovasi: number
  onClick?: () => void;
  ranking?: number;
  highlightQuery?: string;
  activeBadge?: string | null;
};

function CardInnovator(props: CardInnovatorProps) {
  const t = useTranslations("Innovator");
  const {
    header,
    logo,
    namaInovator,
    onClick,
    jumlahDesaDampingan,
    jumlahInovasi,
    ranking,
    highlightQuery,
    activeBadge,
  } = props;

  const renderHighlightedText = (value?: string) => {
    if (!value) {
      return value;
    }

    const query = highlightQuery?.trim();

    if (!query) {
      return value;
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = value.split(new RegExp(`(${escapedQuery})`, "ig"));

    return matches.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={`${part}-${index}`}
          style={{
            backgroundColor: "#bbf7d0",
            color: "inherit",
            borderRadius: "4px",
            padding: "0 2px",
          }}
        >
          {part}
        </mark>
      ) : (
        <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      )
    );
  };

  return (
    <Container onClick={onClick}>
      <Background src={header || "/images/default-header.svg"} alt={namaInovator} />
      <CardContent>
        <Logo src={logo || "/images/default-logo.svg"} alt={logo} />
        <ContBadge>
          {ranking == 1 && <img src="/icons/badge-1.svg" alt="badge" />}
          {ranking == 2 && <img src="/icons/badge-2.svg" alt="badge" />}
          {ranking == 3 && <img src="/icons/badge-3.svg" alt="badge" />}
        </ContBadge>
        <Title>{renderHighlightedText(namaInovator)}</Title>
        {activeBadge && (
          <Flex mt={1.5} mb={1.5}>
            {(() => {
              const configMap: Record<string, { name: string; icon: string; bg: string; border: string; color: string }> = {
                terus_berkembang: {
                  name: "Terus Berkembang",
                  icon: "/icons/digital_nudge/TerusBerkembang.svg",
                  bg: "#EFF6FF",
                  border: "#3B82F6",
                  color: "#1D4ED8"
                },
                si_inovatif: {
                  name: "Si Inovatif",
                  icon: "/icons/digital_nudge/SiInovatif.svg",
                  bg: "#FFF7ED",
                  border: "#F97316",
                  color: "#C2410C"
                },
                kolaborator_handal: {
                  name: "Kolaborator Handal",
                  icon: "/icons/digital_nudge/KolaboratorHandal.svg",
                  bg: "#F5F3FF",
                  border: "#8B5CF6",
                  color: "#6D28D9"
                },
                sahabat_desa: {
                  name: "Sahabat Desa",
                  icon: "/icons/digital_nudge/SahabatDesa.svg",
                  bg: "#FDF2F8",
                  border: "#EC4899",
                  color: "#BE185D"
                },
                pemimpin_pasar: {
                  name: "Pemimpin Pasar",
                  icon: "/icons/digital_nudge/PemimpinPasar.svg",
                  bg: "#FEF9C3",
                  border: "#EAB308",
                  color: "#A16207"
                }
              };
              const cfg = configMap[activeBadge];
              if (!cfg) return null;
              return (
                <Flex
                  alignItems="center"
                  gap="3px"
                  bg={cfg.bg}
                  border={`1px solid ${cfg.border}`}
                  color={cfg.color}
                  borderRadius="full"
                  px="6px"
                  py="1.5px"
                  fontSize="8px"
                  fontWeight="700"
                  boxShadow="xs"
                  width="fit-content"
                  whiteSpace="nowrap"
                >
                  <img src={cfg.icon} alt={cfg.name} style={{ width: "8px", height: "8px" }} />
                  {cfg.name}
                </Flex>
              );
            })()}
          </Flex>
        )}
        <Flex direction="column" marginTop="auto">
          <Description>{jumlahDesaDampingan} {t("companionVillages")}</Description>
          <Description>{jumlahInovasi} {t("innovations")}</Description>
        </Flex>
      </CardContent>
    </Container>
  );
}

export default CardInnovator;
