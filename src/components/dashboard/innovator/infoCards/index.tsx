import { useEffect, useState } from "react";
import { useAuthToken } from "Hooks/useAuthToken";
import { Box, Flex, Text } from "@chakra-ui/react";
import Image from "next/image";
import DateRangeFilter from "./dateFilter";


import {
  cardStyle,
  titleText,
  descriptionText,
  numberTextStyle,
  labelTextStyle,
  trendTextStyle,
} from "./_infoCardsStyle";

const InfoCards = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);

  const [inovasiCount, setInovasiCount] = useState(0);
  const [desaCount, setDesaCount] = useState(0);
  const [trendInovasi, setTrendInovasi] = useState(0);
  const [trendDesa, setTrendDesa] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { token, isLoaded: authLoaded } = useAuthToken();

  const calculateData = async (fromDate: Date, toDate: Date) => {
    if (!token) return;

    try {
      const response = await fetch('/api/innovator/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setInovasiCount(data.totalInovasi || 0);
        setDesaCount(data.totalKlienDesa || 0);
        setTrendInovasi(0);
        setTrendDesa(0);
      } else {
        const message = await response.text();
        setError(`Failed to fetch dashboard data: ${message}`);
        console.error("Failed to fetch dashboard data:", message);
      }
    } catch (err) {
      setError("Failed to calculate data.");
      console.error("Failed to calculate data:", err);
    }
  };

  useEffect(() => {
    if (!authLoaded) return;

    const now = new Date();
    const startOfYear = new Date(Date.UTC(now.getFullYear(), 0, 1));
    const endOfYear = new Date(Date.UTC(now.getFullYear(), 11, 31));
    setFrom(startOfYear);
    setTo(endOfYear);
    if (!token) {
      setError("User not authenticated.");
      return;
    }

    calculateData(startOfYear, endOfYear);
  }, [authLoaded, token]);

  const renderTrend = (value: number) => {
    const arrow = value >= 0 ? "↑" : "↓";
    const color = value >= 0 ? "green.500" : "red.500";
    return (
      <Text {...trendTextStyle} color={color}>
        {arrow} {Math.abs(value)} sejak periode sebelumnya
      </Text>
    );
  };

  return (
    <Box p={4} mt={3}>
      <Flex justify="space-between" align="flex-start" mb={3}>
        <Box>
          <Text {...titleText}>Informasi Umum</Text>
          {error ? (
            <Text color="red.500" mb={2}>
              {error}
            </Text>
          ) : null}
          <Text {...descriptionText}>
            Periode: {from?.toLocaleDateString()} - {to?.toLocaleDateString()}
          </Text>
        </Box>
        <Box as="div" onClick={() => setShowFilter(true)} cursor="pointer" mt={2}>
          <Image
            src="/icons/icon-filter.svg"
            alt="Filter"
            width={16}
            height={16}
            style={{ width: '16px', height: '16px' }}
          />
        </Box>
      </Flex>

      <Flex direction={{ base: "column", md: "row" }} gap={4}>
        <Box flex="1" {...cardStyle}>
          <Text {...numberTextStyle}>{inovasiCount}</Text>
          <Text {...labelTextStyle}>Inovasi</Text>
          {renderTrend(trendInovasi)}
        </Box>
        <Box flex="1" {...cardStyle}>
          <Text {...numberTextStyle}>{desaCount}</Text>
          <Text {...labelTextStyle}>Desa Digital</Text>
          {renderTrend(trendDesa)}
        </Box>
      </Flex>

      {showFilter && (
        <DateRangeFilter
          onClose={() => setShowFilter(false)}
          onApply={(fromDate, toDate) => {
            setFrom(fromDate);
            setTo(toDate);
            calculateData(fromDate, toDate);
            setShowFilter(false);
          }}
          initialFromDate={from}
          initialToDate={to}
        />
      )}
    </Box>
  );
};

export default InfoCards;