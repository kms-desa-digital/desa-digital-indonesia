import { Flex } from "@chakra-ui/react";
import React from "react";
import { useTranslations } from "next-intl";
import { BADGE_STYLES } from "@/features/digital-nudge/constants";
import {
  Container,
  Background,
  CardContent,
  Title,
  ContBadge,
  Description,
  Logo,
  Location,
} from "./_cardVillageStyle";



type CardVillageProps = {
  provinsi?: string;
  kabupatenKota?: string;
  logo: string;
  header?: string;
  id: string;
  namaDesa: string;
  onClick?: () => void;
  ranking?: number;
  jumlahInovasiDiterapkan?: number
  isHome: boolean
  highlightQuery?: string;
  activeBadge?: string | null;
};

function CardVillage(props: CardVillageProps) {
  const t = useTranslations("Village");
  const { provinsi, kabupatenKota, logo, header, namaDesa, onClick, ranking, jumlahInovasiDiterapkan, isHome, highlightQuery, activeBadge } = props;

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
    <Container onClick={onClick} $isHome={isHome}>
      <Background src={header} alt="background" />
      <CardContent $isHome={isHome}>
        <Logo src={logo} alt={logo} />
        <ContBadge>
          {ranking == 1 && <img src="/icons/badge-1.svg" alt="badge" />}
          {ranking == 2 && <img src="/icons/badge-2.svg" alt="badge" />}
          {ranking == 3 && <img src="/icons/badge-3.svg" alt="badge" />}
        </ContBadge>
        <Title $isHome={isHome} $hasBadge={!!activeBadge}>{renderHighlightedText(namaDesa)}</Title>
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
        <Description>{t("appliedInnovationsCount", { count: jumlahInovasiDiterapkan ?? 0 })}</Description>
        <Flex direction="column" marginTop="auto">
          <Location>
            <img src="/icons/location.svg" alt="loc" />
            <Description>
              {renderHighlightedText(kabupatenKota || "")}, {renderHighlightedText(provinsi || "")}{" "}
            </Description>{" "}
          </Location>
        </Flex>
      </CardContent>
    </Container>
  );
}

export default CardVillage;
