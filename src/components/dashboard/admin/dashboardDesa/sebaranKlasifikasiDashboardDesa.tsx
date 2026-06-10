import {
    Box,
    Flex,
    Text,
    Button,
} from "@chakra-ui/react";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { PieChart, Pie, Tooltip, Cell } from "recharts";
import { useRouter } from "next/navigation";
import { DownloadIcon } from "@chakra-ui/icons";
import * as XLSX from "xlsx";

const SebaranKlasifikasiDashboardDesa: React.FC = () => {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [geo, setGeo] = useState<{ name: string; value: number; color: string }[]>([]);

    const colors2: Record<string, string> = {
        "Dataran Tinggi": "#A7C7A5",
        "Dataran Rendah": "#1E5631",
        "Dataran Sedang": "#448f5e"
    };

    const fetchGeoData = async () => {
        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;
            const headers: Record<string, string> = {};
            if (currentUser) {
                const token = await currentUser.getIdToken();
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch("/api/villages", { headers });
            const dataRaw = await response.json();
            const villages = dataRaw.villages || [];

            const geoCount: Record<string, number> = {
                "Dataran Tinggi": 0,
                "Dataran Rendah": 0,
                "Dataran Sedang": 0
            };

            villages.forEach((data: any) => {
                if (data.geografisDesa) {
                    const geoText = data.geografisDesa.toLowerCase();
                    if (geoText.includes("dataran tinggi")) {
                        geoCount["Dataran Tinggi"]++;
                    } else if (geoText.includes("dataran rendah")) {
                        geoCount["Dataran Rendah"]++;
                    } else if (geoText.includes("dataran sedang")) {
                        geoCount["Dataran Sedang"]++;
                    }
                }
            });

            const chartData = Object.keys(geoCount)
                .filter((key) => geoCount[key] > 0)
                .map((key) => ({
                    name: key,
                    value: geoCount[key],
                    color: colors2[key as keyof typeof colors2]
                }));

            setGeo(chartData);
        } catch (error) {
            console.error("Error fetching geographic data:", error);
        }
    };

    const handleDownloadExcel = () => {
        const excelData = geo.map((item, index) => ({
            No: index + 1,
            "Klasifikasi Geografis": item.name,
            "Jumlah Desa": item.value,
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Klasifikasi Geografis");

        XLSX.writeFile(workbook, "sebaran_klasifikasi_geografis.xlsx");
    };

    useEffect(() => {
        fetchGeoData();
    }, []);

    interface LabelProps {
        cx: number;
        cy: number;
        midAngle: number;
        innerRadius: number;
        outerRadius: number;
        percent: number;
        name: string;
    }

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: LabelProps) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={25} fontWeight="bold" fontFamily="poppins">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <Box>
            {/* HEADER + DOWNLOAD */}
            <Flex justify="space-between" align="center" mt="24px" mx="15px">
                <Text fontSize="sm" fontWeight="bold" color="gray.800">
                    Sebaran Klasifikasi Geografis Desa
                </Text>
                {/* <Button
                    size="sm"
                    bg="white"
                    boxShadow="md"
                    border="2px solid"
                    borderColor="gray.200"
                    px={2}
                    py={2}
                    display="flex"
                    alignItems="center"
                    _hover={{ bg: "gray.100" }}
                    cursor="pointer"
                    onClick={handleDownloadExcel}
                >
                    <DownloadIcon boxSize={3} color="black" />
                </Button> */}
            </Flex>

            <Box
                bg="white"
                borderRadius="xl"
                pt="5px"
                pb="1px"
                mx="15px"
                boxShadow="md"
                border="2px solid"
                borderColor="gray.200"
                mt={4}
                overflow="visible"
            >
                <Flex justify="center" align="center">
                    <PieChart width={320} height={220}>
                        <Pie
                            data={geo}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            dataKey="value"
                            label={renderCustomizedLabel}
                        >
                            {geo.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>

                    <Box ml={4}>
                        {geo.map((entry, index) => (
                            <Flex key={index} align="center" mb={1} mr={7} whiteSpace="nowrap">
                                <Box w={2} h={2} bg={entry.color} borderRadius="full" mr={2} />
                                <Text fontSize="10px">{entry.name}</Text>
                            </Flex>
                        ))}
                    </Box>
                </Flex>
            </Box>
        </Box>
    );
};

export default SebaranKlasifikasiDashboardDesa;
