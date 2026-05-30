import { Flex } from "@chakra-ui/react";
import React from "react";
import { useTranslations } from "next-intl";
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
        <Title $isHome={isHome}>{renderHighlightedText(namaDesa)}</Title>
        {activeBadge && (
          <Flex mt={1.5} mb={1.5}>
            {(() => {
              const configMap: Record<string, { name: string; icon: string; bg: string; border: string; color: string }> = {
                penggerak_inovasi: {
                  name: "Penggerak Inovasi",
                  icon: "/icons/digital_nudge/PenggerakInovasi.svg",
                  bg: "#FFF7ED",
                  border: "#F97316",
                  color: "#C2410C"
                },
                penggiat_digital: {
                  name: "Penggiat Digital",
                  icon: "/icons/digital_nudge/PenggiatDigital.svg",
                  bg: "#EFF6FF",
                  border: "#3B82F6",
                  color: "#1D4ED8"
                },
                adopter_spesialis: {
                  name: "Adopter Spesialis",
                  icon: "/icons/digital_nudge/Adopter_Spesialis.svg",
                  bg: "#FDF2F8",
                  border: "#EC4899",
                  color: "#BE185D"
                },
                adopter_giat: {
                  name: "Adopter Giat",
                  icon: "/icons/digital_nudge/Adopter_Giat.svg",
                  bg: "#FEF9C3",
                  border: "#EAB308",
                  color: "#A16207"
                },
                sahabat_inovator: {
                  name: "Sahabat Inovator",
                  icon: "/icons/digital_nudge/Sahabat_Inovator.svg",
                  bg: "#F5F3FF",
                  border: "#8B5CF6",
                  color: "#6D28D9"
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
