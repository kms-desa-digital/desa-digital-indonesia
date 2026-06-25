import { Box } from "@chakra-ui/react";
import CardVillage from "Components/card/village";
import { paths } from "Consts/path";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getVillages } from "Services/villageServices";
import { CardContainer, Horizontal, Title } from "./_villagesStyle";
import { useTranslations } from "next-intl";

const Village: React.FC = () => {
  const t = useTranslations("Home");
  const [villages, setVillages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: any = await getVillages("Terverifikasi");
        const fetched = response.villages || response.data || [];
        
        // Map data to ensure consistency across pages
        const mapped = fetched.map((item: any) => ({
          ...item,
          id: item.userId || item.id || item._id,
          provinsi: item.lokasi?.provinsi?.label || item.provinsi || "",
          kabupatenKota: item.lokasi?.kabupatenKota?.label || item.kabupatenKota || item.kabupaten || "",
          namaDesa: item.lokasi?.desaKelurahan?.label || item.namaDesa || item.desa || "",
        }));

        // Sort manually by valid "jumlahInovasiDiterapkan" descending
        const sortedVillages = [...mapped]
          .sort((a: any, b: any) => {
            const inovasi = (Number(b.jumlahInovasiDiterapkan) || 0) - (Number(a.jumlahInovasiDiterapkan) || 0);
            if (inovasi !== 0) return inovasi;
            return (a.namaDesa || "").localeCompare(b.namaDesa || "");
          })
          .slice(0, 5);
          
        setVillages(sortedVillages);
      } catch (error) {
        console.error("Error fetching Top Villages from API:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box padding="0 14px">
      <Title>{t("featuredVillages")}</Title>
      <CardContainer>
        <Horizontal>
          {loading ? (
             [1, 2, 3].map((i) => (
              <Box key={i} width="43%" flexShrink={0}>
                <Box height="150px" bg="gray.100" borderRadius="12px" />
              </Box>
            ))
          ) : (
            villages.map((item: any, idx: number) => (
              <Link
                href={paths.DETAIL_VILLAGE_PAGE.replace(':id', item.id)}
                key={item.id || idx}
                style={{ textDecoration: 'none', width: '43%', flexShrink: 0, display: 'block' }}
              >
                <CardVillage
                  isHome={true}
                  namaDesa={item.namaDesa}
                  logo={item.logo || "/images/default-logo.svg"}
                  header={item.header || "/images/default-header.svg"}
                  kabupatenKota={item.kabupatenKota}
                  provinsi={item.provinsi}
                  jumlahInovasiDiterapkan={item.jumlahInovasiDiterapkan}
                  ranking={idx + 1}
                  id={item.id}
                  activeBadge={item.activeBadge}
                />
              </Link>
            ))
          )}
        </Horizontal>
      </CardContainer>
    </Box>
  );
};

export default Village;
