import {
  Box,
  Flex,
  Stack,
  Text,
  Icon,
  Image,
  Grid,
  Button as ChakraButton,
} from "@chakra-ui/react";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { FaUsers } from "react-icons/fa";
import VillageActive from "@public/icons/village-active.svg";
import InnovationActive from "@public/icons/innovation3.svg";
import * as XLSX from "xlsx";
import { paths } from "Consts/path"; // Import paths from Consts/path

const InformasiUmum: React.FC = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [totalVillage, setTotalVillage] = useState(0);
  const [totalInnovators, setTotalInnovators] = useState(0);
  const [totalInnovation, setTotalInnovation] = useState(0);
  const [changeInnovator, setChangeInnovator] = useState(0);
  const [isIncreaseInnovator, setIsIncreaseInnovator] = useState(true);
  const [changeVillage, setChangeVillage] = useState(0);
  const [isIncreaseVillage, setIsIncreaseVillage] = useState(true);
  const [changeInnovation, setChangeInnovation] = useState(0);
  const [isIncreaseInnovation, setIsIncreaseInnovation] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        const response = await fetch('/api/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTotalVillage(data.totalVillages || 0);
          setTotalInnovators(data.totalInnovators || 0);
          setTotalInnovation(data.totalInnovations || 0);
        } else {
          console.error("Failed to fetch dashboard data:", await response.text());
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  const handleDownload = () => {
    const excelData = [
      {
        Kategori: "Desa Digital",
        Jumlah: totalVillage,
      },
      {
        Kategori: "Innovator",
        Jumlah: totalInnovators,
      },
      {
        Kategori: "Inovasi",
        Jumlah: totalInnovation,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Informasi Umum");
    XLSX.writeFile(workbook, "informasi_umum.xlsx");
  };

  const navigateToDashboard = (category: string) => {
    switch (category) {
      case "desa":
        router.push(paths.ADMIN_DASHBOARD_DESA); // Navigates to the correct path for Desa
        break;
      case "inovator":
        router.push(paths.ADMIN_DASHBOARD_INOVATOR); // Navigates to the correct path for Innovator
        break;
      case "inovasi":
        router.push(paths.ADMIN_DASHBOARD_INOVASI); // Navigates to the correct path for Inovasi
        break;
      default:
        break;
    }
  };

  return (
    <Stack>
      <Box p={4}>
        <Flex align="center" justify="space-between" mb={4}>
          <Text fontSize="md" fontWeight="bold">
            Informasi Umum
          </Text>
        </Flex>

        <Grid
          templateColumns={{
            base: "repeat(1, 1fr)",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap={3}
        >
          {[
            {
              label: "Desa Digital",
              icon: (
                <Image src={VillageActive.src} alt="Village Icon" w={6} h={6} />
              ),
              iconBg: "#C6D8D0",
              value: totalVillage,
              change: changeVillage,
              isIncrease: isIncreaseVillage,
              category: "desa",
            },
            {
              label: "Inovator",
              icon: <FaUsers size={25} color="#347357" />,
              iconBg: "#C6D8D0",
              value: totalInnovators,
              change: changeInnovator,
              isIncrease: isIncreaseInnovator,
              category: "inovator",
            },
            {
              label: "Inovasi",
              icon: (
                <Image
                  src={InnovationActive.src}
                  alt="Innovation Icon"
                  w={6}
                  h={6}
                />
              ),
              iconBg: "#C6D8D0",
              value: totalInnovation,
              change: changeInnovation,
              isIncrease: isIncreaseInnovation,
              category: "inovasi",
            },
          ].map((stat, index) => (
            <Box
              key={index}
              p={4}
              borderRadius="lg"
              boxShadow="md"
              border="1px solid"
              borderColor="gray.200"
              bg="white"
              minW={0}
              overflow="hidden"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              minH="100px"
              mb={0}
            >
              <Box
                bg={stat.iconBg}
                borderRadius="full"
                p={2}
                w="40px"
                h="40px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={2}
              >
                {stat.icon}
              </Box>

              <Text
                fontSize="22px"
                fontWeight="bold"
                color="green.700"
                lineHeight="1"
              >
                {stat.value}
              </Text>

              <Text fontSize="11px" color="gray.600" mt={1}>
                {stat.label}
              </Text>

              <Flex
                align="center"
                color={stat.isIncrease ? "green.500" : "red.500"}
                mt={1}
              >
                <Icon
                  as={stat.isIncrease ? ArrowUpRight : ArrowDownRight}
                  boxSize={3}
                  mr={1}
                />
                <Text fontSize="7px">
                  {Math.abs(stat.change)}{" "}
                  {stat.isIncrease ? "bertambah" : "berkurang"} dari bulan lalu
                </Text>
              </Flex>

              {/* Letakkan tombol di bagian bawah box */}
              <ChakraButton
                onClick={() => navigateToDashboard(stat.category)}
                variant="solid"
                bg="#347357"
                fontSize="8"
                fontWeight="regular"
                justifyContent="center"
                color="#FFFFFF"
                _hover={{ bg: "#C5D9D1", color: "#347357" }}
                mt={3}
                height="20px"
                display="flex"
                boxShadow="lg"
              >
                Lihat Data
                <Box
                  bg="#C5D9D1"
                  borderRadius="full"
                  height="10px"
                  width="10px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  ml={1}
                >
                  <ArrowRight size={8} color="#347357" />{" "}
                  {/* Ikon panah kanan dengan ukuran lebih kecil */}
                </Box>
              </ChakraButton>
            </Box>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
};

export default InformasiUmum;
