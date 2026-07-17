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
import { BADGE_STYLES } from "@/features/digital-nudge/constants";
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
        <Title $hasBadge={!!activeBadge}>{renderHighlightedText(namaInovator)}</Title>
        {activeBadge && (
          <Flex mt={1} mb={1}>
            {(() => {
              const cfg = BADGE_STYLES[activeBadge];
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
