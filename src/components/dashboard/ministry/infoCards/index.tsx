import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { Box, Flex, Text, Image } from "@chakra-ui/react";
import DateRangeFilter from "./dateFilter";
import filterIcon from "@public/icons/icon-filter.svg";
import {
  cardStyle, titleText, descriptionText,
  numberTextStyle, labelTextStyle, trendTextStyle
} from "./_infoCardsStyle";

const InfoCards = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);

  const [totals, setTotals] = useState({
    innovations: 0,
    innovators: 0,
    villages: 0,
    provinces: 0,
  });

  const [trends, setTrends] = useState({
    innovations: 0,
    innovators: 0,
    villages: 0,
    provinces: 0,
  });

  const calculateTrends = async (fromDate: Date, toDate: Date) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/ministry/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTotals({
          innovators: data.dashboard?.innovators?.total || 0,
          innovations: data.dashboard?.innovations?.total || 0,
          villages: data.dashboard?.villages?.total || 0,
          provinces: data.dashboard?.provinces || 0,
        });

        // API tidak menyediakan history/tren, diset ke 0
        setTrends({
          innovators: 0,
          innovations: 0,
          villages: 0,
          provinces: 0,
        });
      } else {
        console.error("Failed to fetch dashboard data:", await response.text());
      }
    } catch (err) {
      console.error("Failed to calculate trends:", err);
    }
  };

  useEffect(() => {
    // Default to current year Jan 1 - Dec 31
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), 0, 1);
    const defaultTo = new Date(now.getFullYear(), 11, 31);
    setFrom(defaultFrom);
    setTo(defaultTo);
    calculateTrends(defaultFrom, defaultTo);
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
        <Image
          onClick={() => setShowFilter(true)}
          src={filterIcon.src}
          alt="Filter"
          boxSize="16px"
          cursor="pointer"
          mt={2}
        />
      </Flex>

      <Flex direction={{ base: "column", md: "row" }} gap={4} mb={4}>
        <Box flex="1" {...cardStyle}>
          <Text {...numberTextStyle}>{totals.villages}</Text>
          <Text {...labelTextStyle}>Desa Digital</Text>
          {renderTrend(trends.villages)}
        </Box>
        <Box flex="1" {...cardStyle}>
          <Text {...numberTextStyle}>{totals.provinces}</Text>
          <Text {...labelTextStyle}>Provinsi</Text>
          {renderTrend(trends.provinces)}
        </Box>
      </Flex>

      <Flex direction={{ base: "column", md: "row" }} gap={4} mb={4}>
        <Box flex="1" {...cardStyle}>
          <Text {...numberTextStyle}>{totals.innovations}</Text>
          <Text {...labelTextStyle}>Inovasi</Text>
          {renderTrend(trends.innovations)}
        </Box>
        <Box flex="1" {...cardStyle}>
          <Text {...numberTextStyle}>{totals.innovators}</Text>
          <Text {...labelTextStyle}>Inovator</Text>
          {renderTrend(trends.innovators)}
        </Box>
      </Flex>

      {showFilter && (
        <DateRangeFilter
          isOpen={showFilter}
          onClose={() => setShowFilter(false)}
          onApply={(fromDate, toDate) => {
            setFrom(fromDate);
            setTo(toDate);
            calculateTrends(fromDate, toDate);
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