import { Box, Fade, Flex, Image, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
const first = "/icons/first.svg";
const second = "/icons/seccond.svg";
const third = "/icons/third.svg";
const banner = "/images/banner-unggulan.svg";
import { DocumentData } from "firebase/firestore";
import { getVillages } from "Services/villageServices";
import { getInnovators } from "Services/innovatorServices";

const BestBanner: React.FC = () => {
  const t = useTranslations("Home");
  const [visibleBox, setVisibleBox] = useState(0);
  const [villages, setVillages] = useState<DocumentData[]>([]);
  const [innovators, setInnovators] = useState<DocumentData[]>([]);

  useEffect(() => {
    const fetchTopData = async () => {
      try {
        // Innovators from MongoDB API 
        const innovatorRes: any = await getInnovators({ status: "Terverifikasi" });
        const fetchedInnovators = innovatorRes?.data || innovatorRes?.innovators || [];
        const sortedInnovators = (Array.isArray(fetchedInnovators) ? fetchedInnovators : [])
          .sort((a: any, b: any) => {
            const desa = (b.jumlahDesaDampingan || 0) - (a.jumlahDesaDampingan || 0);
            if (desa !== 0) return desa;
            const inovasi = (b.jumlahInovasi || 0) - (a.jumlahInovasi || 0);
            if (inovasi !== 0) return inovasi;
            return (a.namaInovator || "").localeCompare(b.namaInovator || "");
          })
          .slice(0, 3);
        setInnovators(sortedInnovators);

        // Villages now use MongoDB API 
        const response: any = await getVillages("Terverifikasi");
        const fetchedVillages = response.villages || response.data || [];
        const sortedVillages = fetchedVillages
          .sort((a: any, b: any) => {
            const inovasi = (b.jumlahInovasiDiterapkan || 0) - (a.jumlahInovasiDiterapkan || 0);
            if (inovasi !== 0) return inovasi;
            return (a.namaDesa || "").localeCompare(b.namaDesa || "");
          })
          .slice(0, 3);
          
        setVillages(sortedVillages);
      } catch (error) {
        console.error("Error fetching Top Data for Banner:", error);
      }
    };
    fetchTopData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleBox((prev) => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box padding="0 14px" pos="relative">
      <Text
        fontSize="16px"
        fontWeight="700"
        lineHeight="140%"
        mb="16px"
        color="#1F2937"
      >
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
              <Flex justifyContent="space-between" alignItems="flex-start">
                {innovators[1] && (
                  <Box
                    width="82px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    mt="12px"
                  >
                    <Image
                      src={second}
                      width="40px"
                      height="40px"
                      objectFit="contain"
                    />

                    <Text
                      mt="3px"
                      fontSize="10px"
                      fontWeight="600"
                      lineHeight="115%"
                      textAlign="center"
                      width="78px"
                      whiteSpace="normal"
                      wordBreak="normal"
                      overflowWrap="break-word"
                      color="#1F2937"
                    >
                      {innovators[1].namaInovator}
                    </Text>
                  </Box>
                )}

                {innovators[0] && (
                  <Box
                    width="82px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                  >
                    <Image
                      src={first}
                      width="40px"
                      height="40px"
                      objectFit="contain"
                    />

                    <Text
                      mt="3px"
                      fontSize="10px"
                      fontWeight="600"
                      lineHeight="115%"
                      textAlign="center"
                      width="78px"
                      whiteSpace="normal"
                      wordBreak="normal"
                      overflowWrap="break-word"
                      color="#1F2937"
                    >
                      {innovators[0].namaInovator}
                    </Text>
                  </Box>
                )}

                {innovators[2] && (
                  <Box
                    width="82px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    mt="12px"
                  >
                    <Image
                      src={third}
                      width="40px"
                      height="40px"
                      objectFit="contain"
                    />

                    <Text
                      mt="3px"
                      fontSize="10px"
                      fontWeight="600"
                      lineHeight="115%"
                      textAlign="center"
                      width="78px"
                      whiteSpace="normal"
                      wordBreak="normal"
                      overflowWrap="break-word"
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
              <Flex justifyContent="space-between" alignItems="flex-start">
                {villages[1] && (
                  <Box
                    width="82px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    mt="12px"
                  >
                    <Image
                      src={second}
                      width="40px"
                      height="40px"
                      objectFit="contain"
                    />

                    <Text
                      mt="3px"
                      fontSize="10px"
                      fontWeight="600"
                      lineHeight="115%"
                      textAlign="center"
                      width="78px"
                      whiteSpace="normal"
                      wordBreak="normal"
                      overflowWrap="break-word"
                      color="#1F2937"
                    >
                      {villages[1].namaDesa}
                    </Text>
                  </Box>
                )}

                {villages[0] && (
                  <Box
                    width="82px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                  >
                    <Image
                      src={first}
                      width="40px"
                      height="40px"
                      objectFit="contain"
                    />

                    <Text
                      mt="3px"
                      fontSize="10px"
                      fontWeight="600"
                      lineHeight="115%"
                      textAlign="center"
                      width="78px"
                      whiteSpace="normal"
                      wordBreak="normal"
                      overflowWrap="break-word"
                      color="#1F2937"
                    >
                      {villages[0].namaDesa}
                    </Text>
                  </Box>
                )}

                {villages[2] && (
                  <Box
                    width="82px"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    mt="12px"
                  >
                    <Image
                      src={third}
                      width="40px"
                      height="40px"
                      objectFit="contain"
                    />

                    <Text
                      mt="3px"
                      fontSize="10px"
                      fontWeight="600"
                      lineHeight="115%"
                      textAlign="center"
                      width="78px"
                      whiteSpace="normal"
                      wordBreak="normal"
                      overflowWrap="break-word"
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
