import { Box } from "@chakra-ui/react";
import CardInnovator from "Components/card/innovator";
import { paths } from "Consts/path";
import {
  DocumentData,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase/clientApp";
import { CardContainer, Horizontal, Title } from "./_innovatorStyle";
import { useTranslations } from "next-intl";


interface InnovatorData {
  id: string;
  namaInovator: string;
  jumlahDesaDampingan: number;
  jumlahInovasi: number;
  header?: string;
  logo?: string;
  status?: boolean;
}


function Innovator() {
  const t = useTranslations("Home");
  const router = useRouter();
  const [innovators, setInnovators] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInnovators = async () => {
      try {
        const innovatorsRef = collection(firestore, "innovators");
        const q = query(
          innovatorsRef,
          orderBy("jumlahDesaDampingan", "desc"),
          limit(5)
        );

        const innovatorsSnapshot = await getDocs(q);
        const innovatorsData = innovatorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setInnovators(innovatorsData);
      } catch (error) {
        console.error("Error fetching innovators:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInnovators();
  }, []); // Hapus dependency agar hanya jalan sekali

  console.log("Innovators:", innovators);
  return (
    <Box padding="0 14px">
      <Title>{t("featuredInnovators")}</Title>
      <CardContainer>
        <Horizontal>
          {loading ? (
            [1, 2, 3].map((i) => (
              <Box key={i} width="38%" flexShrink={0}>
                <Box height="150px" bg="gray.100" borderRadius="12px" />
              </Box>
            ))
          ) : (
            innovators.map((item: any, idx) => (
              <Link
                href={paths.INNOVATOR_PROFILE_PAGE.replace(':id', item.id)}
                key={item.id}
                style={{ textDecoration: 'none', width: '38%', flexShrink: 0, display: 'block' }}
              >
                <CardInnovator
                  id={item.id}
                  header={item.header || "/images/default-header.svg"}
                  logo={item.logo || "/images/default-logo.svg"}
                  namaInovator={item.namaInovator}
                  jumlahDesaDampingan={item.jumlahDesaDampingan}
                  jumlahInovasi={item.jumlahInovasi}
                  ranking={idx + 1}
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

