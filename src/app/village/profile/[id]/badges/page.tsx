"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Flex,
  Image,
  Stack,
  Text,
  Spinner,
  Tag,
  TagLabel,
} from "@chakra-ui/react";
import TopBar from "Components/topBar";
import Container from "Components/container";
import api from "Services/api";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress: number;
  target: number;
}

const GelarSayaDesa = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const t = useTranslations("Village");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeBadge, setActiveBadge] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [villageName, setVillageName] = useState<string>("Desa Saya");

  const fetchBadgesData = async () => {
    try {
      setLoading(true);
      // Fetch badges evaluation
      const res: any = await api.get(`/api/villages/${id}/badges`);
      setActiveBadge(res.activeBadge);
      setBadges(res.badges || []);

      // Fetch village profile to get village name
      const villageRes: any = await api.get(`/api/villages/${id}`);
      const villageData = villageRes.village || villageRes.data;
      if (villageData) {
        setVillageName(villageData.namaDesa || "Desa");
      }
    } catch (err: any) {
      console.error("Error fetching village badges:", err);
      toast.error(err?.message || "Gagal memuat data gelar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBadgesData();
    }
  }, [id]);

  const handleUseBadge = async (badgeId: string | null) => {
    try {
      setActionLoading(badgeId || "remove");
      const res: any = await api.patch(`/api/villages/${id}/badges`, { badgeId });
      setActiveBadge(res.activeBadge);
      toast.success(badgeId ? "Gelar berhasil diterapkan!" : "Gelar dilepas!");
      fetchBadgesData();
    } catch (err: any) {
      console.error("Error setting badge:", err);
      toast.error(err?.message || "Gagal menerapkan gelar");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh">
        <TopBar title="Gelar Saya" onBack={() => router.back()} />
        <Flex minH="calc(100vh - 70px)" align="center" justify="center">
          <Spinner size="lg" color="#347357" />
        </Flex>
      </Box>
    );
  }

  // Get active badge info
  const activeBadgeInfo = badges.find((b) => b.id === activeBadge);

  return (
    <Container page>
      <TopBar title="Gelar Saya" onBack={() => router.back()} />
      <Stack spacing={4} pb={12}>
        {/* Banner Area (Screen 2 style) */}
        <Box
          position="relative"
          bg="#347357"
          backgroundImage="url('/icons/digital_nudge/bg_digNud.svg')"
          backgroundSize="cover"
          backgroundPosition="center"
          borderRadius="0 0 24px 24px"
          pt="30px"
          pb="36px"
          px="20px"
          color="white"
          textAlign="center"
          mt="-2px"
        >
          <Text fontSize="20px" fontWeight="700" mb={4}>
            {villageName}
          </Text>

          {/* Circle Icon Container */}
          <Flex justify="center" mb={4}>
            <Box
              w="120px"
              h="120px"
              bg="rgba(255, 255, 255, 0.15)"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              backdropFilter="blur(5px)"
              border="2px solid rgba(255, 255, 255, 0.3)"
              shadow="md"
            >
              {activeBadgeInfo ? (
                <Image
                  src={activeBadgeInfo.icon}
                  alt={activeBadgeInfo.name}
                  boxSize="70px"
                />
              ) : (
                <Image
                  src="/icons/profile.svg"
                  alt="No Badge"
                  boxSize="60px"
                  filter="brightness(0) invert(1)"
                />
              )}
            </Box>
          </Flex>

          {/* Active Badge Label */}
          <Flex justify="center">
            <Tag
              size="lg"
              variant="subtle"
              colorScheme="whiteAlpha"
              borderRadius="full"
              px={5}
              py={2.5}
              bg="white"
              color="#347357"
              fontWeight="bold"
              boxShadow="sm"
            >
              <TagLabel fontSize="13px">
                {activeBadgeInfo ? activeBadgeInfo.name : "Belum Ada Gelar"}
              </TagLabel>
            </Tag>
          </Flex>

          {activeBadge && (
            <Button
              mt={3}
              size="xs"
              variant="link"
              color="white"
              fontWeight="medium"
              textDecoration="underline"
              onClick={() => handleUseBadge(null)}
              isLoading={actionLoading === "remove"}
            >
              Lepas Gelar
            </Button>
          )}
        </Box>

        {/* Title of Badge List */}
        <Box px="16px" mt={3}>
          <Text fontSize="15px" fontWeight="700" color="#1F2937" mb={3}>
            Gelar Anda untuk Ditampilkan
          </Text>

          {/* Badges List Container */}
          <Stack spacing={3}>
            {badges.map((badge) => {
              const isActive = activeBadge === badge.id;
              const isLocked = !badge.isUnlocked;

              return (
                <Box
                  key={badge.id}
                  p={4}
                  borderRadius="16px"
                  borderWidth="1px"
                  bg="white"
                  borderColor={isActive ? "#347357" : "gray.200"}
                  shadow="xs"
                  opacity={isLocked ? 0.6 : 1}
                  filter={isLocked ? "grayscale(10%)" : "none"}
                >
                  <Flex align="center">
                    {/* Badge Icon on Left */}
                    <Box
                      p={2.5}
                      bg={isLocked ? "gray.100" : "green.50"}
                      borderRadius="12px"
                      mr={4}
                    >
                      <Image
                        src={badge.icon}
                        alt={badge.name}
                        boxSize="36px"
                      />
                    </Box>

                    {/* Mid Text */}
                    <Stack spacing={0.5} flex={1}>
                      <Text fontSize="14px" fontWeight="700" color="#1F2937">
                        {badge.name}
                      </Text>
                      <Text fontSize="11px" color="#6B7280" lineHeight="1.3">
                        {badge.description}
                      </Text>
                    </Stack>

                    {/* Action Button / Progress on Right */}
                    <Box pl={2}>
                      {isActive ? (
                        <Tag
                          size="md"
                          variant="solid"
                          bg="#DCFCE7"
                          color="#15803D"
                          fontWeight="bold"
                          borderRadius="full"
                        >
                          <TagLabel fontSize="10px">Digunakan</TagLabel>
                        </Tag>
                      ) : isLocked ? (
                        <Text fontSize="11px" fontWeight="bold" color="#EF4444">
                          {badge.progress}/{badge.target}
                        </Text>
                      ) : (
                        <Button
                          size="sm"
                          bg="#347357"
                          color="white"
                          fontWeight="bold"
                          fontSize="11px"
                          borderRadius="8px"
                          px={4}
                          height="28px"
                          _hover={{ bg: "#2d6149" }}
                          isLoading={actionLoading === badge.id}
                          onClick={() => handleUseBadge(badge.id)}
                        >
                          Gunakan
                        </Button>
                      )}
                    </Box>
                  </Flex>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default GelarSayaDesa;
