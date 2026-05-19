import { Box, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { getVillages } from 'Services/villageServices';
import {
  pieChartWrapperStyle,
  containerStyle,
  legendItemStyle,
  legendColorStyle,
  legendTextStyle,
  svgStyle,
} from './_categoryVillageStyle';

const PieChartVillage = ({ onSliceClick }: { onSliceClick: (categoryName: string) => void }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleClick = (categoryName: string) => {
    onSliceClick(categoryName);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseData = await getVillages();
        const villages = (responseData as any).villages || [];

        const counts: Record<string, number> = {};

        const resolveKesiapanDigital = (item: any) => {
          let kategori = item.kesiapanDigital || item.kategori || item.kategoriDesa;
          if (kategori && kategori !== 'ND' && kategori !== '-' && kategori.trim() !== '') {
            return kategori;
          }
          let score = 0;
          const jar = String(item.jaringan || '').toLowerCase();
          if (jar.includes('seluruh') || jar.includes('baik')) score += 3;
          else if (jar.includes('sebagian') || jar.includes('cukup')) score += 2;
          else if (jar.includes('tidak') || jar.includes('belum')) score += 1;

          const lis = String(item.listrik || '').toLowerCase();
          if (lis.includes('seluruh') || lis.includes('tersedia')) score += 3;
          else if (lis.includes('sebagian')) score += 2;
          else if (lis.includes('belum') || lis.includes('tidak')) score += 1;

          const tek = String(item.teknologi || '').toLowerCase();
          if (tek.includes('seluruh') || tek.includes('baik') || tek.includes('berkembang')) score += 3;
          else if (tek.includes('sebagian')) score += 2;
          else if (tek.includes('belum') || tek.includes('tidak')) score += 1;

          const kem = String(item.kemampuan || '').toLowerCase();
          if (kem.includes('sangat') || kem.includes('baik')) score += 3;
          else if (kem.includes('cukup')) score += 2;
          else if (kem.includes('belum') || kem.includes('tidak')) score += 1;

          if (score >= 10) return "Sangat Siap";
          if (score >= 8) return "Siap";
          if (score >= 6) return "Cukup Siap";
          if (score >= 4) return "Kurang Siap";
          return "Belum Siap";
        };

        villages.forEach((item: any) => {
          let kategori = resolveKesiapanDigital(item);
          if (!kategori || kategori === 'ND' || kategori === '-') {
            const idmVal = parseFloat(String(item.idm || '0').replace(',', '.'));
            if (!isNaN(idmVal) && idmVal > 0) {
              if (idmVal > 0.815) kategori = "Mandiri";
              else if (idmVal > 0.707) kategori = "Maju";
              else if (idmVal > 0.599) kategori = "Berkembang";
              else if (idmVal > 0.491) kategori = "Tertinggal";
              else kategori = "Sangat Tertinggal";
            }
          }

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
        console.error("Error fetching village categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#244E3B', '#347357', '#568A73', '#95C2AF', '#B1BFB9', '#91B495', '#6A9D8F'];

  const splitText = (text: string, maxLength = 12): string[] => {
    if (text.length <= maxLength) return [text];

    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      if ((currentLine + ' ' + words[i]).length <= maxLength) {
        currentLine += ' ' + words[i];
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }

    lines.push(currentLine);
    return lines;
  };

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

    const textRadius = angle < 45 ? 50 : 40;
    const textX = 100 + textRadius * Math.cos(midRad);
    const textY = 100 + textRadius * Math.sin(midRad);

    const textLines = splitText(category.name);

    const result = {
      ...category,
      path: pathData,
      percentage: `${Math.round(percentage * 100)}%`,
      textX,
      textY,
      textLines,
    };

    startAngle = endAngle;
    return result;
  });

  if (loading) return <Text p={4}>Loading village data...</Text>;
  if (!categories.length) return <Text p={4}>No village data found.</Text>;

  return (
    <Box {...containerStyle}>
      <Box {...pieChartWrapperStyle}>
        <svg {...svgStyle} viewBox="0 0 200 200">
          {pieSlices.map((slice) => (
            <g key={slice.id} onClick={() => handleClick(slice.name)} style={{ cursor: 'pointer' }}>
              <path d={slice.path} fill={slice.color} />
              <text
                x={slice.textX}
                y={slice.textY - slice.textLines.length * 6}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontWeight="bold"
                fontSize="10"
              >
                {slice.percentage}
              </text>
              {slice.textLines.map((line: string, i: number) => (
                <text
                  key={`${slice.id}-line-${i}`}
                  x={slice.textX}
                  y={slice.textY - slice.textLines.length * 6 + 12 + i * 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="8"
                >
                  {line}
                </text>
              ))}
            </g>
          ))}
        </svg>
      </Box>

      <Box display="flex" justifyContent="center" flexWrap="wrap">
        {categories.map(category => (
          <Box key={category.id} {...legendItemStyle} onClick={() => handleClick(category.name)} style={{ cursor: 'pointer' }}>
            <Box {...legendColorStyle} bg={category.color}></Box>
            <Text {...legendTextStyle}>{category.name}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PieChartVillage;