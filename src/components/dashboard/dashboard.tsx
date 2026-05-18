import {
  Box,
  Flex,
  Text,
  Image,
  Link,
  Button,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCloseButton,
  Spinner
} from "@chakra-ui/react";

import { FaUsers, FaSeedling } from "react-icons/fa";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { paths } from "Consts/path";
import { getAuth } from "firebase/auth";
import { firestore } from "../../firebase/clientApp";
import { getInnovation } from "Services/innovationServices";

const Dashboard = () => {
  const [userRole, setUserRole] = useState(null);
  const [totalVillage, setTotalVillage] = useState(0);
  const [totalInnovators, setTotalInnovators] = useState(0);

  const t = useTranslations("Admin");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [topInnovation, setTopInnovation] = useState<any>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (currentUser) {
          const userRef = doc(firestore, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserRole(userSnap.data()?.role);
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    const fetchInnovatorCount = async () => {
      try {
        const db = getFirestore();
        const innovatorsRef = collection(db, "innovators");
        const snapshot = await getDocs(innovatorsRef);
        setTotalInnovators(snapshot.size);
      } catch (error) {
        console.error("Error fetching innovator count:", error);
      }
    };

    const fetchVillageCount = async () => {
      try {
        const db = getFirestore();
        const villageRef = collection(db, "villages");
        const snapshot = await getDocs(villageRef);
        const validVillages = snapshot.docs.filter((doc) => {
          const data = doc.data();
          return (
            data.namaDesa &&
            data.namaDesa.length > 1 &&
            data.jumlahInovasi !== 0
          );
        });
        setTotalVillage(validVillages.length);
      } catch (error) {
        console.error("Error fetching village count:", error);
      }
    };

    fetchUserRole();
    fetchInnovatorCount();
    fetchVillageCount();
  }, []);

  useEffect(() => {
    if (userRole === "village") {
      getInnovation({ status: "Terverifikasi" })
        .then((res) => {
          const list = res.innovations || [];
          const sorted = [...list].sort((a, b) => (b.jumlahDesa || 0) - (a.jumlahDesa || 0));
          if (sorted.length > 0) {
            setTopInnovation(sorted[0]);
          }
        })
        .catch((err) => console.error("Error fetching dashboard top innovation:", err))
        .finally(() => setLoadingRecommendation(false));
    }
  }, [userRole]);

  const getImageSrc = (item: any) => {
    if (!item) return "/images/default-logo.svg";
    if (item.fotoInovasi && item.fotoInovasi.length > 0) {
      return item.fotoInovasi[0];
    }
    if (item.images && item.images.length > 0) {
      return item.images[0];
    }
    return "/images/default-logo.svg";
  };

  const data = [
    {
      label: t("villageCountLabel"),
      value: totalVillage,
      icon: (
        <Box bg="#C6D8D0" borderRadius="full" p={2}>
          <Image src="/icons/village-active.svg" w={5} h={5} alt="Village Icon" />
        </Box>
      )
    },
    {
      label: t("innovatorCountLabel"),
      value: totalInnovators,
      icon: (
        <Box bg="#C6D8D0" borderRadius="full" p={2}>
          <FaUsers size={20} color="#347357" />
        </Box>
      )
    }
  ];

  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontSize="17" fontWeight="bold" color="gray.700">
          {t("trackInnovations")}
        </Text>
        <Link
          as={NextLink}
          href={
            userRole === "admin"
              ? paths.ADMIN_DASHBOARD
              : userRole === "village"
                ? paths.VILLAGE_DASHBOARD
                : paths.DASHBOARD_INNOVATOR_HOME
          }
          fontSize="sm"
          color="gray.500"
          textDecoration="underline"
        >
          {t("viewMore")}
        </Link>
      </Flex>

      <Flex gap={4}>
        {data.map((item, index) => (
          <Box
            key={index}
            p={4}
            bg="white"
            boxShadow="md"
            borderRadius="lg"
            flex="1"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            border="1px solid"
            borderColor="gray.200"
          >
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {item.value}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {item.label}
              </Text>
            </Box>
            {item.icon}
          </Box>
        ))}
      </Flex>

      {userRole === "village" && (
        <>
          {loadingRecommendation ? (
            <Flex justify="center" align="center" py={8} w="100%">
              <Spinner size="md" color="green.700" />
            </Flex>
          ) : topInnovation ? (
            <Box
              mt={4}
              p={6}
              pb={4}
              mx="auto"
              bg="white"
              backgroundImage="url('/images/background-recommendation.png')"
              backgroundSize="cover"
              backgroundPosition="center"
              boxShadow="md"
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.200"
              position="relative"
              overflow="hidden"
            >
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Inovasi digital terbaik untuk desamu
              </Text>

              <Flex alignItems="center" mb={1}>
                <Box borderRadius="full" p={1} mr={2}>
                  <FaSeedling color="green" size="30px" />
                </Box>
                <Box>
                  <Text fontSize="md" fontWeight="bold" color="green.700">
                    {topInnovation.namaInovasi}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Innovator: {topInnovation.namaInnovator || "Umum"}
                  </Text>
                </Box>
              </Flex>

              <Flex justifyContent="space-between" alignItems="center" mt={3} mb={2}>
                <Text fontSize="10px" color="gray.500">
                  Cek rekomendasi inovasi digital lainnya untuk desamu disini
                </Text>
                <Button
                  colorScheme="green"
                  size="xs"
                  fontSize="10px"
                  p={1}
                  borderRadius="4"
                  minW="auto"
                  h="22px"
                  w="180px"
                  onClick={onOpen}
                  boxShadow="md"
                  _hover={{ bg: "#16432D" }}
                >
                  Lihat Rekomendasi
                </Button>
              </Flex>
            </Box>
          ) : null}
        </>
      )}

      {topInnovation && (
        <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent
            sx={{
              borderTopRadius: "3xl",
              width: "360px",
              h: "675px",
              my: "auto",
              mx: "auto"
            }}
          >
            <DrawerHeader display="flex" justifyContent="space-between" alignItems="center">
              <Text fontSize="18px" fontWeight="bold" mt="4px" ml="4px">
                Rekomendasi Inovasi
              </Text>
              <DrawerCloseButton mt="10px" mr="4px" />
            </DrawerHeader>

            <DrawerBody p={0}>
              <Flex
                direction="column"
                align="center"
                justify="center"
                textAlign="center"
                height="100%"
                px={6}
                py={8}
              >
                <Text fontWeight="bold" fontSize="lg">
                  {topInnovation.namaInovasi}
                </Text>
                <Text fontSize="sm" mb={4}>
                  dari {topInnovation.namaInnovator || "Umum"}
                </Text>

                <Box my={6}>
                  <Image
                    src={getImageSrc(topInnovation)}
                    alt={topInnovation.namaInovasi}
                    mx="auto"
                    boxSize="80px"
                    borderRadius="full"
                    objectFit="cover"
                    fallbackSrc="/images/default-logo.svg"
                  />
                </Box>

                <Text fontWeight="bold" mb={1}>
                  Cocok dengan desamu!
                </Text>
                <Text fontSize="sm" color="gray.600" noOfLines={4}>
                  {topInnovation.deskripsi || "Saatnya desamu berinovasi! Terapkan inovasi dan buat perubahan besar di desamu."}
                </Text>
              </Flex>
            </DrawerBody>

            <DrawerFooter flexDirection="column" gap={3}>
              <Button
                bg="#347357"
                color="white"
                w="full"
                fontSize="sm"
                border="2px"
                _hover={{ bg: "#2e5e4b" }}
                onClick={() => router.push(`/innovation/detail/${topInnovation.id}`)}
              >
                Detail Inovasi
              </Button>
              <Button
                variant="outline"
                colorScheme="green"
                w="full"
                fontSize="sm"
                mb={3}
                onClick={() => {
                  onClose();
                  router.push(paths.VILLAGE_RECOMENDATION);
                }}
              >
                Rekomendasi Lainnya
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </Box>
  );
};

export default Dashboard;
