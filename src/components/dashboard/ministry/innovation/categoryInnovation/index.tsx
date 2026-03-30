import { Box, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import {
  pieChartWrapperStyle,
  containerStyle,
  legendItemStyle,
  legendColorStyle,
  legendTextStyle,
  svgStyle,
} from './_categoryInnovationStyle';

import { getInnovation } from 'Services/innovationServices';

const COLORS = ['#244E3B', '#347357', '#568A73', '#95C2AF', '#B1BFB9', '#91B495', '#6A9D8F'];

const PieChartInnovation = ({ onSliceClick }: { onSliceClick: (categoryName: string) => void }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleClick = (categoryName: string) => {
    onSliceClick(categoryName);
  };

  useEffect(() => {
    const fetchData = async () => {
    try {
        const responseData = await getInnovation();
        const innovationsData = responseData.innovations || [];
        
        const counts: Record<string, number> = {};

        innovationsData.forEach((item: any) => {
            const kategori = item?.kategori;

            if (kategori && kategori !== 'ND' && kategori !== '-') {
            counts[kategori] = (counts[kategori] || 0) + 1;
            }
        });

        const sortedEntries = Object.entries(counts).sort(([, a], [, b]) => b - a);

        const allData = sortedEntries.map(([name, value], index) => ({
            id: index + 1,
            name,
            value,
            color: COLORS[index % COLORS.length],
        }));

        setCategories(allData);
    } catch (error) {
        console.error("Error fetching innovations for pie chart:", error);
    } finally {
        setLoading(false);
    }
    };

    fetchData();
  }, []);

  const total = categories.reduce((sum, category) => sum + category.value, 0);

  let startAngle = 0;
  const pieSlices = categories.map(category => {
    const percentage = category.value / total;
    const angle = percentage * 360;
    const endAngle = startAngle + angle;

    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = 100 + 80 * Math.cos(startRad);
    const y1 = 100 + 80 * Math.sin(startRad);
    const x2 = 100 + 80 * Math.cos(endRad);
    const y2 = 100 + 80 * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    const midAngle = startAngle + angle / 2;
    const midRad = (midAngle - 90) * Math.PI / 180;

    const textRadius = 45;
    const textX = 100 + textRadius * Math.cos(midRad);
    const textY = 100 + textRadius * Math.sin(midRad);

    const displayName = percentage >= 0.3
      ? category.name
      : category.name.length > 5
        ? category.name.slice(0, 5) + '...'
        : category.name;

    const result = {
      ...category,
      path: pathData,
      percentage: `${Math.round(percentage * 100)}%`,
      textX,
      textY,
      displayName,
    };

    startAngle = endAngle;
    return result;
  });

  if (loading) return <Text p={4}>Loading innovation data...</Text>;
  if (!categories.length) return <Text p={4}>No innovation data found.</Text>;

  return (
    <Box {...containerStyle}>
      <Box {...pieChartWrapperStyle}>
        <svg {...svgStyle} viewBox="0 0 200 200">
          {pieSlices.map(slice => (
            <g key={slice.id} onClick={() => handleClick(slice.name)} style={{ cursor: 'pointer' }}>
              <path d={slice.path} fill={slice.color} />
              <text
                x={slice.textX}
                y={slice.textY - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontWeight="bold"
                fontSize="10"
              >
                {slice.percentage}
              </text>
              <text
                x={slice.textX}
                y={slice.textY + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="8"
              >
                {slice.displayName}
              </text>
            </g>
          ))}
        </svg>
      </Box>

      <Box display="flex" justifyContent="center" flexWrap="wrap">
        {categories.map(category => (
          <Box
            key={category.id}
            {...legendItemStyle}
            onClick={() => handleClick(category.name)}
            style={{ cursor: 'pointer' }}
          >
            <Box {...legendColorStyle} bg={category.color}></Box>
            <Text {...legendTextStyle}>{category.name}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PieChartInnovation;