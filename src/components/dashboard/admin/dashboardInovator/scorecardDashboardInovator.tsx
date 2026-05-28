import { Box, Flex, Grid, Text, Stack, Image } from "@chakra-ui/react";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { FaUsers } from "react-icons/fa";
import DesaIcon from "@public/icons/village-active.svg"; // sesuaikan path

const ScoreCardDashboardInovator: React.FC = () => {
  const [totalInovators, setTotalInovators] = useState(0);
  const [totalDesaDampingan, setTotalDesaDampingan] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const headers: Record<string, string> = {};
        if (currentUser) {
            const token = await currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }

        const [innovatorsRes, villagesRes] = await Promise.all([
          fetch("/api/innovator", { headers }),
          fetch("/api/villages", { headers })
        ]);

        const innovatorsDataRaw = await innovatorsRes.json();
        const villagesDataRaw = await villagesRes.json();

        const innovators = innovatorsDataRaw.data || [];
        const villages = villagesDataRaw.villages || [];

        const validInnovators = innovators.filter((inv: any) => inv.namaInovator && inv.namaInovator.trim() !== "");
        setTotalInovators(validInnovators.length);

        let desaCount = 0;
        villages.forEach((data: any) => {
          if (typeof data.jumlahInovasiDiterapkan === "number" && data.jumlahInovasiDiterapkan > 0) {
            desaCount++;
          }
        });
        setTotalDesaDampingan(desaCount);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      label: "Inovator",
      value: totalInovators,
      iconType: "react-icon",
      icon: FaUsers,
      iconBg: "#C6D8D0",
    },
    {
      label: "Dampingan",
      value: totalDesaDampingan,
      iconType: "image",
      icon: DesaIcon,
      iconBg: "#C6D8D0",
    },
  ];

  return (
    <Stack>
      <Box p={4}>
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          {stats.map((stat, index) => (
            <Box
              key={index}
              p={3}
              borderRadius="lg"
              boxShadow="md"
              border="1px solid"
              borderColor="gray.200"
              bg="white"
              minW={0}
              overflow="hidden"
              minH="90px"
              display="flex"
              alignItems="center"
            >
              <Flex align="center">
                <Box
                  bg={stat.iconBg}
                  borderRadius="full"
                  p={1}
                  w="35px"
                  h="35px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  mr={3}
                >
                  {stat.iconType === "react-icon" ? (
                    <stat.icon size={16} color="#357357" />
                  ) : (
                    <Image src={stat.icon.src} w={4} h={4} alt={`${stat.label} icon`} />
                  )}
                </Box>
                <Box>
                  <Text fontSize="20px" fontWeight="bold" color="green.700" lineHeight="1">
                    {stat.value}
                  </Text>
                  <Text fontSize="12px" color="gray.600">
                    {stat.label}
                  </Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
};

export default ScoreCardDashboardInovator;
