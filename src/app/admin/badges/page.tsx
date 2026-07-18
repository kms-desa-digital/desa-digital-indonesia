"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Stack,
  Text,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  TagLabel,
  Image,
  Button,
  Grid,
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import TopBar from "Components/topBar";
import Container from "Components/container";
import Pagination from "Components/common/Pagination";
import { getBadgesAdminSummary } from "@/features/digital-nudge/services";
import {
  BADGE_STYLES,
  VILLAGE_BADGES_INFO,
  INNOVATOR_BADGES_INFO,
} from "@/features/digital-nudge/constants";


export default function AdminBadgesPage() {
  const router = useRouter();

  // Summary State
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const res = await getBadgesAdminSummary();
      setSummaryData(res);
    } catch (err) {
      console.error("Error loading summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <Container page>
      <TopBar title="Monitoring Gelar & Badge" onBack={() => router.push("/admin")} />
      
      <Box px="16px" pb={12} pt={4}>
        {summaryLoading ? (
          <Flex minH="250px" align="center" justify="center">
            <Spinner color="#347357" size="lg" />
          </Flex>
        ) : (
          <Stack spacing={8}>
            {/* Summary Overview Cards */}
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem bg="green.50" p={5} borderRadius="16px" border="1px solid" borderColor="green.200" shadow="xs">
                <Text fontSize="12px" fontWeight="700" color="#347357" textTransform="uppercase">Total Desa Terverifikasi</Text>
                <Text fontSize="28px" fontWeight="800" color="#1F2937" mt={1}>{summaryData?.totalVillages || 0}</Text>
              </GridItem>
              <GridItem bg="blue.50" p={5} borderRadius="16px" border="1px solid" borderColor="blue.200" shadow="xs">
                <Text fontSize="12px" fontWeight="700" color="blue.700" textTransform="uppercase">Total Inovator Terverifikasi</Text>
                <Text fontSize="28px" fontWeight="800" color="#1F2937" mt={1}>{summaryData?.totalInnovators || 0}</Text>
              </GridItem>
            </Grid>

            {/* Village Badges Section */}
            <Box>
              <Text fontSize="16px" fontWeight="800" color="#1F2937" mb={4}>Statistik Gelar Desa</Text>
              <Stack spacing={3}>
                {VILLAGE_BADGES_INFO.map((def) => {
                  const style = BADGE_STYLES[def.id] || {};
                  const count = summaryData?.villageBadgeCounts?.[def.id] || 0;
                  return (
                    <Flex
                      key={def.id}
                      p={4}
                      bg="white"
                      borderRadius="16px"
                      borderWidth="1px"
                      borderColor="gray.100"
                      shadow="xs"
                      align="center"
                      cursor="pointer"
                      _hover={{ bg: "gray.50", shadow: "sm" }}
                      transition="all 0.2s"
                      onClick={() => router.push(`/admin/badges/${def.id}?role=village`)}
                    >
                      <Box p={2.5} bg={style.bg} borderRadius="12px" mr={4}>
                        <Image src={style.icon} alt={def.name} boxSize="36px" />
                      </Box>
                      <Stack spacing={0.5} flex={1}>
                        <Text fontSize="14px" fontWeight="700" color="#1F2937">{def.name}</Text>
                        <Text fontSize="11px" color="#6B7280" lineHeight="1.3">{def.desc}</Text>
                      </Stack>
                      <Box textAlign="right" pl={2}>
                        <Tag size="md" variant="subtle" bg={style.bg} color={style.color} fontWeight="bold" borderRadius="full">
                           <TagLabel fontSize="11px">{count} Desa</TagLabel>
                        </Tag>
                      </Box>
                    </Flex>
                  );
                })}
              </Stack>
            </Box>

            {/* Innovator Badges Section */}
            <Box>
              <Text fontSize="16px" fontWeight="800" color="#1F2937" mb={4}>Statistik Gelar Inovator</Text>
              <Stack spacing={3}>
                {INNOVATOR_BADGES_INFO.map((def) => {
                  const style = BADGE_STYLES[def.id] || {};
                  const count = summaryData?.innovatorBadgeCounts?.[def.id] || 0;
                  return (
                    <Flex
                      key={def.id}
                      p={4}
                      bg="white"
                      borderRadius="16px"
                      borderWidth="1px"
                      borderColor="gray.100"
                      shadow="xs"
                      align="center"
                      cursor="pointer"
                      _hover={{ bg: "gray.50", shadow: "sm" }}
                      transition="all 0.2s"
                      onClick={() => router.push(`/admin/badges/${def.id}?role=innovator`)}
                    >
                      <Box p={2.5} bg={style.bg} borderRadius="12px" mr={4}>
                        <Image src={style.icon} alt={def.name} boxSize="36px" />
                      </Box>
                      <Stack spacing={0.5} flex={1}>
                        <Text fontSize="14px" fontWeight="700" color="#1F2937">{def.name}</Text>
                        <Text fontSize="11px" color="#6B7280" lineHeight="1.3">{def.desc}</Text>
                      </Stack>
                      <Box textAlign="right" pl={2}>
                        <Tag size="md" variant="subtle" bg={style.bg} color={style.color} fontWeight="bold" borderRadius="full">
                          <TagLabel fontSize="11px">{count} Inovator</TagLabel>
                        </Tag>
                      </Box>
                    </Flex>
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>
    </Container>
  );
}
