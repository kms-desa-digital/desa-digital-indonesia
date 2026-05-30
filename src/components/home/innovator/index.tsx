"use client";

import { Box } from "@chakra-ui/react";
import CardInnovator from "Components/card/innovator";
import { paths } from "Consts/path";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CardContainer, Horizontal, Title } from "./_innovatorStyle";
import { useTranslations } from "next-intl";
import { getInnovators } from "Services/innovatorServices";


interface InnovatorData {
  id: string;
  namaInovator: string;
  jumlahDesaDampingan: number;
  jumlahInovasi: number;
  header?: string;
  logo?: string;
  status?: string;
  activeBadge?: string | null;
}


function Innovator() {
  const t = useTranslations("Home");
  const router = useRouter();
  const [innovators, setInnovators] = useState<InnovatorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInnovators = async () => {
      try {
        const res: any = await getInnovators({
          status: "Terverifikasi",
        });
        const fetchedData = res?.data || res?.innovators || [];
        const innovatorsData: InnovatorData[] = (Array.isArray(fetchedData) ? fetchedData : [])
          .sort((a: any, b: any) => {
            const desa = (b.jumlahDesaDampingan || 0) - (a.jumlahDesaDampingan || 0);
            if (desa !== 0) return desa;
            const inovasi = (b.jumlahInovasi || 0) - (a.jumlahInovasi || 0);
            if (inovasi !== 0) return inovasi;
            return (a.namaInovator || "").localeCompare(b.namaInovator || "");
          })
          .slice(0, 5);

        setInnovators(innovatorsData);
      } catch (error) {
        console.error("Error fetching innovators from MongoDB API:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInnovators();
  }, []);

  return (
    <Box padding="0 14px">
      <Title>{t("featuredInnovators")}</Title>
      <CardContainer>
        <Horizontal>
          {loading ? (
            [1, 2, 3].map((i) => (
              <Box key={i} width="43%" flexShrink={0}>
                <Box height="150px" bg="gray.100" borderRadius="12px" />
              </Box>
            ))
          ) : (
            innovators.map((item: any, idx) => (
              <Link
                href={paths.INNOVATOR_PROFILE_PAGE.replace(':id', item.id)}
                key={item.id}
                style={{ textDecoration: 'none', width: '43%', flexShrink: 0, display: 'block' }}
              >
                <CardInnovator
                  id={item.id}
                  header={item.header || "/images/default-header.svg"}
                  logo={item.logo || "/images/default-logo.svg"}
                  namaInovator={item.namaInovator}
                  jumlahDesaDampingan={item.jumlahDesaDampingan}
                  jumlahInovasi={item.jumlahInovasi}
                  ranking={idx + 1}
                  activeBadge={item.activeBadge}
                />
              </Link>
            ))
          )}
        </Horizontal>
      </CardContainer>
    </Box>
  );
}

export default Innovator;
