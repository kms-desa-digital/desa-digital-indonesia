import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Text,
    Button as ChakraButton,
    Link as ChakraLink
} from "@chakra-ui/react";
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { paths } from 'Consts/path';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

interface LeaderboardItem {
    name: string;
    value: number;
    valueAsli: number;
    rank: string;
}

// 🔹 Custom label untuk Chart
const CustomLabel: React.FC<{ x: number; y: number; width: number; value: string }> = ({ x, y, width, value }) => {
    return (
        <text
            x={x + width / 2}
            y={y + 25} // Padding dari atas
            fill="#FFFFFF"
            fontSize={14}
            textAnchor="middle"
            fontWeight="bold"
        >
            {value}
        </text>
    );
};

// 🔹 Custom Tooltip untuk menampilkan "Total"
const CustomTooltip = ({
    active,
    payload,
    label,
    category,
}: {
    active?: boolean;
    payload?: any[];
    label?: string;
    category: string;
}) => {
    if (active && payload && payload.length > 0) {
        const data = payload[0].payload;
        const labelMap: Record<string, string> = {
            desa: 'Total Inovasi Diterapkan',
            inovasi: 'Total Desa Menerapkan',
            inovator: 'Total Inovasi'
        };

        return (
            <div style={{ background: "white", padding: "10px", border: "1px solid #ccc" }}>
                <p style={{ margin: 0, fontWeight: "bold" }}>{data.name}</p>
                <p style={{ margin: 0 }}>{labelMap[category] || 'Total'}: {data.valueAsli}</p>
            </div>
        );
    }

    return null;
};

const Leaderboard: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<'desa' | 'inovator' | 'inovasi'>('desa');
    const [data, setData] = useState<LeaderboardItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const getCategoryText = () => {
        switch (selectedCategory) {
            case 'desa':
                return 'Top 5 Desa Digital';
            case 'inovator':
                return 'Top 5 Inovator';
            case 'inovasi':
                return 'Top 5 Inovasi';
            default:
                return 'Top 5';
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                let token = '';
                if (user) {
                    token = await user.getIdToken();
                }

                const response = await fetch('/api/admin/dashboard', {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined
                });

                if (!response.ok) throw new Error('Failed to fetch dashboard data');
                const result = await response.json();

                let apiData: any[] = [];
                if (selectedCategory === 'desa') {
                    apiData = result.top5Villages || [];
                } else if (selectedCategory === 'inovator') {
                    apiData = result.top5Innovators || [];
                } else if (selectedCategory === 'inovasi') {
                    apiData = result.top5Innovations || [];
                }

                const items: LeaderboardItem[] = apiData.map(item => ({
                    name: item.name || "",
                    value: item.totalInovasi ?? item.totalKlaim ?? 0,
                    valueAsli: item.totalInovasi ?? item.totalKlaim ?? 0,
                    rank: ""
                })).sort((a, b) => b.value - a.value).slice(0, 5);

                const customOrder = [3, 1, 0, 2, 4];
                const customHeights = selectedCategory === 'inovator' ? [20, 38, 44, 35, 15] : [20, 40, 50, 35, 15];
                const customRanks = ["4th", "2nd", "1st", "3rd", "5th"];

                const rankedData = customOrder.map((index, rankIndex) => ({
                    name: items[index]?.name || "",
                    value: customHeights[rankIndex],
                    valueAsli: items[index]?.valueAsli || 0,
                    rank: customRanks[rankIndex],
                }));

                setData(rankedData);
            } catch (error) {
                console.error('Error fetching data: ', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedCategory]);

    const getDashboardPath = () => {
        switch (selectedCategory) {
            case 'desa':
                return paths.ADMIN_DASHBOARD_DESA;
            case 'inovator':
                return paths.ADMIN_DASHBOARD_INOVATOR;
            case 'inovasi':
                return paths.ADMIN_DASHBOARD_INOVASI;
            default:
                return '#';
        }
    };

    return (
        <>
            {/* 🔹 Header */}
            <Flex justify="space-between" align="center" mb={3} mt={1}>
                <Text fontSize="md" fontWeight="bold" ml={4}>
                    {getCategoryText()}
                </Text>
            </Flex>
            <Flex gap={2}>
                <ChakraButton
                    onClick={() => setSelectedCategory('desa')}
                    variant={selectedCategory === 'desa' ? 'outline' : 'solid'}
                    fontSize="10"
                    ml={4}
                    height={8}
                    boxShadow={selectedCategory === 'desa' ? 'none' : 'md'}
                    bg={selectedCategory === 'desa' ? 'transparent' : '#347357'}
                    borderColor={selectedCategory === 'desa' ? '#347357' : 'transparent'}
                    color={selectedCategory === 'desa' ? '#347357' : 'white'}
                    _hover={{
                        bg: selectedCategory === 'desa' ? 'transparent' : '#C5D9D1', // Hover background
                        borderColor: selectedCategory === 'desa' ? '#347357' : '#347357', // Hover border color menjadi #347357
                        color: selectedCategory === 'desa' ? '#347357' : '#347357', // Warna teks berubah menjadi hijau saat hover
                    }}
                    _active={{
                        bg: '#347357', // Background when clicked (active)
                        boxShadow: 'none', // No shadow when button is clicked
                    }}
                >
                    Top 5 Desa Digital
                </ChakraButton>
                <ChakraButton
                    onClick={() => setSelectedCategory('inovator')}
                    variant={selectedCategory === 'inovator' ? 'outline' : 'solid'}
                    fontSize="10"
                    height={8}
                    boxShadow={selectedCategory === 'inovator' ? 'none' : 'md'}
                    bg={selectedCategory === 'inovator' ? 'transparent' : '#347357'}
                    borderColor={selectedCategory === 'inovator' ? '#347357' : 'transparent'}
                    color={selectedCategory === 'inovator' ? '#347357' : 'white'}
                    _hover={{
                        bg: selectedCategory === 'inovator' ? 'transparent' : '#C5D9D1', // Hover background
                        borderColor: selectedCategory === 'inovator' ? '#347357' : '#347357', // Hover border color
                        color: selectedCategory === 'inovator' ? '#347357' : '#347357', // Warna teks berubah menjadi hijau saat hover
                    }}
                    _active={{
                        bg: '#347357', // Background when clicked (active)
                        boxShadow: 'none', // No shadow when button is clicked
                    }}
                >
                    Top 5 Inovator
                </ChakraButton>
                <ChakraButton
                    onClick={() => setSelectedCategory('inovasi')}
                    variant={selectedCategory === 'inovasi' ? 'outline' : 'solid'}
                    fontSize="10"
                    mr={4}
                    height={8}
                    boxShadow={selectedCategory === 'inovasi' ? 'none' : 'md'}
                    bg={selectedCategory === 'inovasi' ? 'transparent' : '#347357'}
                    borderColor={selectedCategory === 'inovasi' ? '#347357' : 'transparent'}
                    color={selectedCategory === 'inovasi' ? '#347357' : 'white'}
                    _hover={{
                        bg: selectedCategory === 'inovasi' ? 'transparent' : '#C5D9D1', // Hover background
                        borderColor: selectedCategory === 'inovasi' ? '#347357' : '#347357', // Hover border color
                        color: selectedCategory === 'inovasi' ? '#347357' : '#347357', // Warna teks berubah menjadi hijau saat hover
                        boxShadow: 'md', // Hover shadow effect
                    }}
                    _active={{
                        bg: '#347357', // Background when clicked (active)
                        boxShadow: 'none', // No shadow when button is clicked
                    }}
                >
                    Top 5 Inovasi
                </ChakraButton>
            </Flex>

            {/* 🔹 Chart Container */}
            <Box
                bg="white"
                borderRadius="xl"
                pt="10px"
                pb="1px"
                mx="15px"
                boxShadow="md"
                border="2px solid"
                borderColor="gray.200"
                mt={4}
                overflow="visible"
            >
                {loading ? (
                    <Text textAlign="center">Loading...</Text>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                            <Tooltip content={<CustomTooltip category={selectedCategory} />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#1E5631">
                                <LabelList dataKey="name" position="top" fontSize="10px" formatter={(name: string) => name.replace(/^Desa\s+/i, "")} />
                                <LabelList dataKey="rank" content={<CustomLabel x={0} y={0} width={0} value={""} />} />
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Box>
        </>
    );
};

export default Leaderboard;
