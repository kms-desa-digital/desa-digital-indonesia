import { Box, Button, Fade, Flex, Image, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const defAds1 = "/images/default-ads-1.svg";
const defAds2 = "/images/default-ads-2.svg";

type AdItem = {
  _id: string;
  name: string;
  image?: string;
  link: string;
  status: string;
};

const Ads: React.FC = () => {
  const t = useTranslations("Components.ads");
  const [visibleBox, setVisibleBox] = useState(0);
  const [activeAds, setActiveAds] = useState<AdItem[]>([]);

  // Fetch active ads using native fetch (public endpoint — no auth needed)
  useEffect(() => {
    const fetchActiveAds = async () => {
      try {
        const res = await fetch("/api/ads");
        if (!res.ok) {
          console.error("[Ads] API error:", res.status, res.statusText);
          return;
        }
        const json = await res.json();
        const ads: AdItem[] = Array.isArray(json?.data) ? json.data : [];
        console.log("[Ads] Active ads loaded:", ads.length, ads);
        setActiveAds(ads);
      } catch (err) {
        console.error("[Ads] Failed to load active ads:", err);
      }
    };
    fetchActiveAds();
  }, []);

  // Total slides = 2 default + active ads count
  const totalSlides = 2 + activeAds.length;

  // Rotate slides every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleBox((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  return (
    <Flex position="relative" height="166px" width="161px">
      {/* ── Slide 0: Default banner 1 (always shown) ── */}
      <Fade in={visibleBox === 0}>
        <Box
          backgroundImage={defAds1}
          height="160px"
          width="160px"
          backgroundSize="cover"
          backgroundPosition="center"
          padding="12px"
          borderRadius="12px"
          position="absolute"
        >
          <Text fontSize="12px" fontWeight="700" lineHeight="140%" color="white">
            {t("findInno")}
          </Text>
          <Text fontSize="10px" fontWeight="500" lineHeight="140%" color="white">
            {t("presenting")} <br />{" "}
            <span style={{ fontSize: "28px", fontWeight: "700", lineHeight: "120%" }}>
              100+
            </span>
            <br />
            {t("infoInno")}
          </Text>
          <Flex justifyContent="flex-end" mt="12px">
            <Button
              variant="inverted"
              border="none"
              fontSize="8px"
              fontWeight="500"
              borderRadius="4px"
              width="84px"
              height="16px"
              padding="6px 20px"
            >
              {t("learnMore")}
            </Button>
          </Flex>
        </Box>
      </Fade>

      {/* ── Slide 1: Default banner 2 (always shown) ── */}
      <Fade in={visibleBox === 1}>
        <Box
          backgroundImage={defAds2}
          height="160px"
          width="160px"
          backgroundSize="cover"
          backgroundPosition="center"
          padding="12px"
          borderRadius="12px"
          position="absolute"
        >
          <Text fontSize="12px" fontWeight="700" lineHeight="140%" color="white">
            {t("findDesa")}
          </Text>
          <Text fontSize="10px" fontWeight="500" lineHeight="140%" color="white">
            {t("presenting")} <br />{" "}
            <span style={{ fontSize: "28px", fontWeight: "700", lineHeight: "120%" }}>
              50+
            </span>
            <br />
            {t("desaIndo")}
          </Text>
          <Flex justifyContent="flex-end" mt="10px">
            <Button
              variant="inverted"
              border="none"
              fontSize="8px"
              fontWeight="500"
              borderRadius="4px"
              width="84px"
              height="16px"
              padding="6px 20px"
            >
              {t("learnMore")}
            </Button>
          </Flex>
        </Box>
      </Fade>

      {/* ── Slides 2+: Active ads from API (appended after defaults) ── */}
      {activeAds.map((ad, idx) => (
        <Fade key={ad._id} in={visibleBox === 2 + idx}>
          <Box
            as="a"
            href={ad.link}
            target="_blank"
            rel="noopener noreferrer"
            display="block"
            height="160px"
            width="160px"
            borderRadius="12px"
            overflow="hidden"
            position="absolute"
            cursor="pointer"
            boxShadow="md"
          >
            {ad.image ? (
              <Image
                src={ad.image}
                alt={ad.name}
                width="100%"
                height="100%"
                objectFit="cover"
              />
            ) : (
              <Box
                backgroundImage={defAds1}
                height="100%"
                width="100%"
                backgroundSize="cover"
                backgroundPosition="center"
                padding="12px"
              >
                <Text fontSize="12px" fontWeight="700" color="white" noOfLines={3}>
                  {ad.name}
                </Text>
              </Box>
            )}
          </Box>
        </Fade>
      ))}
    </Flex>
  );
};

export default Ads;
