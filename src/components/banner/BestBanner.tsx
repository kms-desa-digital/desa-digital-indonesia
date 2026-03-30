import { Box, Fade, Flex, Image, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
const first = "/icons/first.svg";
const second = "/icons/seccond.svg";
const third = "/icons/third.svg";
const banner = "/images/banner-unggulan.svg";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "../../firebase/clientApp";
import { getVillages } from "Services/villageServices";

const BestBanner: React.FC = () => {
  const t = useTranslations("Home");
  const [visibleBox, setVisibleBox] = useState(0);
  const [villages, setVillages] = useState<DocumentData[]>([]);
  const [innovators, setInnovators] = useState<DocumentData[]>([]);

  useEffect(() => {
    const fetchTopData = async () => {
      try {
        // Innovators still use Firebase as API is not ready
        const innovatorQuery = query(
          collection(firestore, "innovators"),
          orderBy("jumlahDesaDampingan", "desc"),
          limit(3)
        );

        const innovatorSnapshot = await getDocs(innovatorQuery);
        const innovatorsData = innovatorSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInnovators(innovatorsData);

        // Villages now use MongoDB API to synchronize with the cards below
        const response: any = await getVillages("Terverifikasi");
        const fetchedVillages = response.villages || response.data || [];
        const sortedVillages = fetchedVillages
          .sort((a: any, b: any) => (b.jumlahInovasiDiterapkan || 0) - (a.jumlahInovasiDiterapkan || 0))
          .slice(0, 3);
          
        setVillages(sortedVillages);
      } catch (error) {
        console.error("Error fetching Top Data for Banner:", error);
      }
    };
    fetchTopData();
  }, []);

  console.log("Innovators:", innovators);
  console.log("Villages:", villages);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleBox((prev) => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box padding="0 14px" pos="relative" >
      <Text fontSize="16px" fontWeight="700" lineHeight="140%" mb="16px" color="#1F2937">
        {t("bestTitle")}
      </Text>
      <Box>
        <Flex position="relative">
          <Fade in={visibleBox === 0}>
            <Box
              backgroundImage={banner}
              backgroundSize="100%"
              width="332px"
              height="142px"
              padding="23px 23px 14px 23px"
              position="absolute"
            >
              <Flex justifyContent="space-between">
                {innovators[1] && (
                  <Box justifyItems="center" mt="21px">
                    <Image src={second} />
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      lineHeight="140%"
                      textAlign="center"
                      width="90px"
                      height="auto"
                      color="#1F2937"
                    >
                      {innovators[1].namaInovator}
                    </Text>
                  </Box>
                )}

                {innovators[0] && (
                  <Box justifyItems="center">
                    <Image src={first} />
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      lineHeight="140%"
                      textAlign="center"
                      width="90px"
                      color="#1F2937"
                    >
                      {innovators[0].namaInovator}
                    </Text>
                  </Box>
                )}

                {innovators[2] && (
                  <Box justifyItems="center" mt="21px">
                    <Image src={third} />
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      lineHeight="140%"
                      textAlign="center"
                      width="90px"
                      color="#1F2937"
                    >
                      {innovators[2].namaInovator}
                    </Text>
                  </Box>
                )}
              </Flex>
            </Box>
          </Fade>

          <Fade in={visibleBox === 1}>
            <Box
              backgroundImage={banner}
              backgroundSize="100%"
              width="332px"
              height="142px"
              padding="23px 23px 15px 23px"
              position="absolute"
            >
              <Flex justifyContent="space-between">
                {villages[1] && (
                  <Box justifyItems="center" mt="21px">
                    <Image src={second} />
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      lineHeight="140%"
                      textAlign="center"
                      width="90px"
                      color="#1F2937"
                    >
                      {villages[1].namaDesa}
                    </Text>
                  </Box>
                )}

                {villages[0] && (
                  <Box justifyItems="center">
                    <Image src={first} />
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      lineHeight="140%"
                      textAlign="center"
                      width="90px"
                      color="#1F2937"
                    >
                      {villages[0].namaDesa}
                    </Text>
                  </Box>
                )}

                {villages[2] && (
                  <Box justifyItems="center" mt="21px">
                    <Image src={third} />
                    <Text
                      fontSize="12px"
                      fontWeight="600"
                      lineHeight="140%"
                      textAlign="center"
                      width="90px"
                      color="#1F2937"
                    >
                      {villages[2].namaDesa}
                    </Text>
                  </Box>
                )}
              </Flex>
            </Box>
          </Fade>
        </Flex>
      </Box>
    </Box>
  );

};

export default BestBanner;
