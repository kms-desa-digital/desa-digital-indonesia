import { Box, Flex, Text, Link as ChakraLink } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, LabelList, Cell } from "recharts";
import NextLink from 'next/link';
import { paths } from "Consts/path";

type CustomLabelProps = {
    x: number;
    y: number;
    width: number;
    value: string;
};

interface InovatorData {
    rank: string;
    name: string;
    value: number;
    valueAsli: number; // Untuk menyimpan jumlah asli inovasi
}

// 🔹 Custom label untuk Chart
const CustomLabel: React.FC<CustomLabelProps> = ({ x, y, width, value }) => {
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

// 🔹 Custom Tooltip untuk menampilkan "Total Inovasi"
const CustomTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: any[];
    label?: string;
}) => {
    if (active && payload && payload.length > 0) {
        const data = payload[0].payload; // Mengambil data dari tooltip

        return (
            <div style={{ background: "white", padding: "10px", border: "1px solid #ccc" }}>
                <p style={{ margin: 0, fontWeight: "bold" }}>{data.name}</p>
                <p style={{ margin: 0 }}>Total Inovasi: {data.valueAsli}</p> {/* Menampilkan Total Inovasi */}
            </div>
        );
    }

    return null;
};

// 🔹 Komponen utama
const InovatorUnggulan: React.FC = () => {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [chartData, setChartData] = useState<InovatorData[]>([]);

    useEffect(() => {
        const fetchTopInovator = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                if (!user) return;

                const token = await user.getIdToken();
                const response = await fetch('/api/admin/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) throw new Error("Failed to fetch dashboard data");
                const data = await response.json();

                const inovators = (data.top5Innovators || []).map((item: any) => ({
                    name: item.name || "-",
                    value: item.totalInovasi || 0,
                })).sort((a: any, b: any) => b.value - a.value).slice(0, 5);

                // Urutan khusus untuk ranking (4, 2, 1, 3, 5)
                const customOrder = [3, 1, 0, 2, 4];
                const customHeights = [20, 38, 44, 35, 15];

                const rankedInovators = customOrder.map((index, rankIndex) => ({
                    name: inovators[index]?.name || "",
                    value: customHeights[rankIndex], // dipakai buat chart
                    valueAsli: inovators[index]?.value || 0, // hanya buat info internal
                    rank: `${["4th", "2nd", "1st", "3rd", "5th"][rankIndex]}`,
                }));

                setChartData(rankedInovators);
            } catch (error) {
                console.error("Error fetching top innovators:", error);
            }
        };

        // Panggil fungsi setelah dideklarasikan
        fetchTopInovator();
    }, []);

    return (
        <>
            {/* 🔹 Header Inovator Unggulan */}
            <Flex justify="space-between" align="center" mt="24px" mx="15px">
                <Text fontSize="m" fontWeight="bold" color="gray.800">
                    Top 5 Inovator
                </Text>
                <ChakraLink
                    as={NextLink}
                    href={paths.ADMIN_DASHBOARD_INOVATOR}
                    fontSize="sm"
                    color="gray.500"
                    textDecoration="underline"
                >
                    Lihat Dashboard
                </ChakraLink>
            </Flex>
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
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#1E5631">
                            <LabelList dataKey="name" position="top" fontSize="10px" formatter={(name: string) => name.replace(/^Desa\s+/i, "")} />
                            <LabelList dataKey="rank" content={<CustomLabel x={0} y={0} width={0} value={""} />} />
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </>
    );
};

export default InovatorUnggulan;
