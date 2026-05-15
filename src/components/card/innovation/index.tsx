import React from "react";
import { useTranslations } from "next-intl";
import {
  Applied,
  Background,
  Category,
  CompanyContainer,
  Container,
  Content,
  Description,
  Icon,
  InnovatorName,
  Title,
} from "./_cardInnovationStyle";



type CardInnovationProps = {
  images?: string[];
  namaInovasi?: string;
  kategori?: string;
  deskripsi?: string;
  tahunDibuat?: string;
  innovatorLogo?: string | React.ReactNode;
  innovatorName?: string | React.ReactNode;
  onClick?: () => void;
  highlightQuery?: string;
  jumlahDesa?: number;
  style?: React.CSSProperties;
};

function CardInnovation(props: CardInnovationProps) {
  const t = useTranslations("Innovation");
  const { images, namaInovasi, kategori, deskripsi, tahunDibuat, innovatorLogo, innovatorName, onClick, highlightQuery, jumlahDesa, style } = props;

  const renderHighlightedText = (value?: string | React.ReactNode) => {
    if (typeof value !== "string") {
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
    <Container onClick={onClick} style={style}>
      <Background src={(images && images[0]) ? images[0] : "/images/default-header.svg"} alt={namaInovasi} />
      <Content>
        <div>
          <Title>{renderHighlightedText(namaInovasi)}</Title>
          <Category>{kategori}</Category>
          <Description>{renderHighlightedText(deskripsi)}</Description>
        </div>
        <div>
          <CompanyContainer>
            {typeof innovatorLogo === "string" ? (
              <Icon src={innovatorLogo} alt={namaInovasi} />
            ) : (
              <>{innovatorLogo}</>
            )}
            {typeof innovatorName === "string" ? (
              <InnovatorName>{renderHighlightedText(innovatorName)}</InnovatorName>
            ) : (
              <div>{innovatorName}</div>
            )}
          </CompanyContainer>
          <Applied>{t("appliedInnovationsVillages", { count: jumlahDesa || 0 })}</Applied>
        </div>
      </Content>
    </Container>
  );
}

export default CardInnovation;