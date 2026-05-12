import React, { useState, useEffect } from 'react';
import { Box, Text, Flex, Link } from '@chakra-ui/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import NextLink from 'next/link';
import { paths } from 'Consts/path';
import { getAuth } from 'firebase/auth';
import {
  ChartContainer,
  ChartWrapper,
  PieContainer,
  LegendContainer,
  titleText,
  linkText,
} from './_categoryVillageStyle';

const COLORS = ['#244E3B', '#347357', '#568A73', '#95C2AF', '#B1BFB9'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box bg="gray.700" color="white" p={1} borderRadius="md" fontSize="xs">
        <Text>
          {payload[0].name}: {payload[0].value}
        </Text>
      </Box>
    );
  }
  return null;
};

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="10px"
      fontWeight="bold"
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <LegendContainer>
      {payload.map((entry: any, index: number) => (
        <Box
          key={`item-${index}`}
          display="flex"
          alignItems="center"
          mb="1"
          title={entry.value}
        >
          <Box
            w="10px"
            h="10px"
            bg={entry.color}
            mr="2"
            borderRadius="50%"
            flexShrink={0}
          />
          <Text
            isTruncated
            fontSize="12px"
            maxW="100%"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {entry.value}
          </Text>
        </Box>
      ))}
    </LegendContainer>
  );
};

const PieChartVillage = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        const response = await fetch('/api/ministry/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        // Karena API tidak mereturn statistik berdasarkan kategori desa, kita kembalikan kosong.
        setChartData([]);
      } catch (error) {
        console.error("Error fetching village data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box p={4}>
        <Text>Loading chart data...</Text>
      </Box>
    );
  }

  if (chartData.length === 0) {
    return (
      <Box p={4}>
        <Text>No village data available.</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb="10px">
        <Text {...titleText}>Kategori Desa</Text>
        <Link
          as={NextLink}
          href={paths.DASHBOARD_MINISTRY_VILLAGE}
          {...linkText}
        >
          Lihat Dashboard
        </Link>
      </Flex>

      <ChartContainer>
        <ChartWrapper>
          <PieContainer>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={0}
                  dataKey="value"
                  label={renderCustomLabel}
                  labelLine={false}
                // onMouseEnter={onPieEnter}
                // activeIndex={activeIndex ?? undefined}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    // opacity={index === activeIndex ? 0.6 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </PieContainer>

          {renderLegend({
            payload: chartData.map((d, i) => ({
              value: d.name,
              color: COLORS[i % COLORS.length],
            })),
          })}
        </ChartWrapper>
      </ChartContainer>
    </Box>
  );
};

export default PieChartVillage;