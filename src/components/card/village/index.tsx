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
};

function CardVillage(props: CardVillageProps) {
  const t = useTranslations("Innovation");
  const { provinsi, kabupatenKota, logo, header, namaDesa, onClick, ranking, jumlahInovasiDiterapkan, isHome, highlightQuery } = props;

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
        <Description>{jumlahInovasiDiterapkan} {t("appliedInnovations")}</Description>
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
