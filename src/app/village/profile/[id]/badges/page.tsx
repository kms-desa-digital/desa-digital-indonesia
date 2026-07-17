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
import { useTranslations } from "next-intl";
import { useUser } from "src/contexts/UserContext";
import Forbidden from "src/components/Forbidden";
import { useBadge } from "@/features/digital-nudge/hooks/useBadge";
import BadgeCard from "@/features/digital-nudge/components/BadgeCard";

const GelarSayaDesa = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const t = useTranslations("Village");
  const { role, uid, firebaseUid, loading: userLoading } = useUser();

  const { badges, activeBadge, loading: badgesLoading, actionLoading, applyBadge } = useBadge(id, "village");
  const [villageName, setVillageName] = useState<string>("Desa Saya");
  const [nameLoading, setNameLoading] = useState(true);

  useEffect(() => {
    const fetchVillageName = async () => {
      if (!id) return;
      try {
        setNameLoading(true);
        const villageRes: any = await api.get(`/villages/${id}`);
        const villageData = villageRes.village || villageRes.data;
        if (villageData) {
          setVillageName(villageData.namaDesa || "Desa");
        }
      } catch (err: any) {
        console.error("Error fetching village name:", err);
      } finally {
        setNameLoading(false);
      }
    };
    fetchVillageName();
  }, [id]);

  const loading = userLoading || badgesLoading || nameLoading;

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

  const normalizedRole = (role || "").toLowerCase();
  const isAuthorized = normalizedRole === "admin" || uid === id || firebaseUid === id;

  if (!isAuthorized) {
    return <Forbidden />;
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
              onClick={() => applyBadge(null)}
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
            {badges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                isActive={activeBadge === badge.id}
                onApply={() => applyBadge(badge.id)}
                isLoading={actionLoading === badge.id}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default GelarSayaDesa;
