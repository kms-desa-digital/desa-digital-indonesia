import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { Box, Flex, Text } from "@chakra-ui/react";
import Image from "next/image";
import DateRangeFilter from "./dateFilter";
import filterIcon from "@public/icons/icon-filter.svg";

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

  const calculateData = async (fromDate: Date, toDate: Date) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/innovator/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setInovasiCount(data.totalInovasi || 0);
        setDesaCount(data.totalKlienDesa || 0);
        
        // Data tren tidak disediakan oleh endpoint, diset ke 0
        setTrendInovasi(0);
        setTrendDesa(0);
      } else {
        console.error("Failed to fetch dashboard data:", await response.text());
      }
    } catch (err) {
      console.error("Failed to calculate data:", err);
    }
  };

  useEffect(() => {
    const now = new Date();
    const startOfYear = new Date(Date.UTC(now.getFullYear(), 0, 1));
    const endOfYear = new Date(Date.UTC(now.getFullYear(), 11, 31));
    setFrom(startOfYear);
    setTo(endOfYear);
    calculateData(startOfYear, endOfYear);
  }, []);

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
          <Text {...descriptionText}>
            Periode: {from?.toLocaleDateString()} - {to?.toLocaleDateString()}
          </Text>
        </Box>
        <Box as="div" onClick={() => setShowFilter(true)} cursor="pointer" mt={2}>
          <Image
            src={filterIcon}
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