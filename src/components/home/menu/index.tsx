"use client";

import { Box, Spinner, Text } from "@chakra-ui/react";
import Container from "Components/container";
import { paths } from "Consts/path";
import { useRouter } from "next/navigation";
import React from "react";
import { useQuery } from "react-query";
import { getCategories } from "Services/categoryServices";
import { GridContainer, GridItem, MenuContainer } from "./_menuStyle";
import { useTranslations } from "next-intl";

import AgriFoodIcon from "@public/icons/agri-food.svg";
import EGovernmentIcon from "@public/icons/e-government.svg";
import InformationSystemIcon from "@public/icons/information-system.svg";
import LocalInfrastructureIcon from "@public/icons/local-infrastructure.svg";
import MenuAllIcon from "@public/icons/menu-all.svg";
import SmartAgriIcon from "@public/icons/smart-agri.svg";

import PembuatanIklanIcon from "@public/icons/pembuatan-innovasi.svg";
import VerifDesaIcon from "@public/icons/verifikasi-desa.svg";
import VerifInnovatorIcon from "@public/icons/verifikasi-innovator.svg";
import VerifKlaimIcon from "@public/icons/verifikasi-klaim.svg";
import VerifTambahInnovasiIcon from "@public/icons/verifikasi-tambah-innovasi.svg";
import Image from "next/image";
import Link from "next/link";

type MenuProps = {
  isAdmin?: boolean;
};

// Data statis dipindah ke luar komponen untuk mencegah re-render tak terbatas (Infinite Loop)
const predefinedCategories = [
  { icon: SmartAgriIcon, title: "Pertanian Cerdas" },
  { icon: AgriFoodIcon, title: "Pemasaran Agri-Food dan E-Commerce" },
  { icon: EGovernmentIcon, title: "E-Government" },
  { icon: InformationSystemIcon, title: "Sistem Informasi" },
  { icon: LocalInfrastructureIcon, title: "Infrastruktur Lokal" },
  { icon: MenuAllIcon, title: "Semua Kategori Inovasi" },
];

const adminMenu = [
  { icon: VerifDesaIcon, title: "Verifikasi Desa" },
  { icon: VerifInnovatorIcon, title: "Verifikasi Inovator" },
  { icon: VerifKlaimIcon, title: "Verifikasi Klaim Inovasi" },
  { icon: VerifTambahInnovasiIcon, title: "Verifikasi Tambah Inovasi" },
  { icon: PembuatanIklanIcon, title: "Pembuatan Iklan" },
  { icon: MenuAllIcon, title: "Semua Kategori Inovasi" },
];

const LoadingSpinner = () => {
  return (
    <Box style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        size="lg"
        color="#347357"
      />
    </Box>
  );
};

const Menu: React.FC<MenuProps> = ({ isAdmin = false }) => {
  const t = useTranslations("Home");
  const tc = useTranslations("Categories");
  const { isLoading, isFetched } = useQuery("menu", getCategories);

  // Ambil menuItems secara langsung tanpa state tambahan
  const menuItems = isAdmin ? adminMenu : predefinedCategories;

  const getTranslatedTitle = (title: string) => {
    switch (title) {
      case "Pertanian Cerdas": return tc("smartAgri");
      case "Pemasaran Agri-Food dan E-Commerce": return tc("agriFood");
      case "E-Government": return tc("eGovernment");
      case "Sistem Informasi": return tc("infoSystem");
      case "Infrastruktur Lokal": return tc("localInfra");
      case "Semua Kategori Inovasi": return tc("allInno");
      case "Verifikasi Desa": return tc("verifDesa");
      case "Verifikasi Inovator": return tc("verifInno");
      case "Verifikasi Klaim Inovasi": return tc("verifClaim");
      case "Verifikasi Tambah Inovasi": return tc("verifAddInno");
      case "Pembuatan Iklan": return tc("adsMake");
      default: return title;
    }
  };

  return (
    <Container>
      <MenuContainer>
        {isLoading && <LoadingSpinner />}
        {!isAdmin && !isLoading && (
          <Text
            textAlign="center"
            mb="16px"
            fontSize="14px"
            fontWeight="700"
            color="brand.100"
          >
            {t("categories")}
          </Text>
        )}
        {isFetched && (
          <GridContainer>
            {menuItems?.map(({ icon, title }, idx) => (
              <GridItem
                key={idx}
                as={Link}
                href={
                  title === "Semua Kategori Inovasi"
                    ? paths.INNOVATION_PAGE
                    : isAdmin
                      ? title === "Pembuatan Iklan"
                        ? paths.ADMIN_ADS
                        : paths.VERIFICATION_PAGE.replace(":category", title)
                      : paths.INNOVATION_CATEGORY_PAGE.replace(":category", title)
                }
                style={{ textDecoration: 'none' }}
              >
                <Image src={icon} alt={title} width={40} height={40} style={{ width: '40px', height: '40px' }} />
                <Text
                  fontSize="12px"
                  fontWeight="400"
                  lineHeight="140%"
                  textAlign="center"
                  mt="8px"
                  width="90px"
                  height="auto"
                  color="black"
                >
                  {getTranslatedTitle(title)}
                </Text>
              </GridItem>
            ))}
          </GridContainer>
        )}
      </MenuContainer>
    </Container>
  );
};

export default Menu;
