import {
    Box,
    Flex,
    Text,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Icon,
    TableContainer,
} from "@chakra-ui/react";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    LabelList,
    Cell,
} from "recharts";
import { DownloadIcon } from "@chakra-ui/icons";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

type ChartData = {
    valueAsli: any;
    name: string;
    value: number;
    rank: string;
};

type CustomLabelProps = {
    x: number;
    y: number;
    width: number;
    value: string;
};

const CustomLabel: React.FC<CustomLabelProps> = ({ x, y, width, value }) => {
    return (
        <text
            x={x + width / 2}
            y={y + 25}
            fill="#FFFFFF"
            fontSize={12}
            textAnchor="middle"
            fontWeight="bold"
        >
            {value}
        </text>
    );
};

// 🔹 Custom Tooltip for "Total Desa"
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
        const data = payload[0].payload;

        return (
            <div style={{ background: "white", padding: "10px", border: "1px solid #ccc" }}>
                <p style={{ margin: 0, fontWeight: "bold" }}>{data.name}</p>
                <p style={{ margin: 0 }}>Total Desa: {data.valueAsli}</p> {/* Menampilkan Total Desa */}
            </div>
        );
    }

    return null;
};

function toTitleCase(str: string): string {
    return str.toLowerCase().split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}


const SebaranPotensiDesa: React.FC = () => {
    const [barData, setBarData] = useState<ChartData[]>([]);
    const [allPotensiData, setAllPotensiData] = useState<Record<string, number>>({});
    const [kondisiData, setKondisiData] = useState<{ kategori: string; jumlah: number }[]>([]);
    const ITEMS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = useState(1);

    const fetchPotensiData = async () => {
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

            const potensiCount: Record<string, number> = {};

            villages.forEach((data: any) => {
                if (Array.isArray(data.potensiDesa)) {
                    data.potensiDesa.forEach((potensiItem: string) => {
                        const potensiSplit = potensiItem.split(',').map(p => p.trim());

                        potensiSplit.forEach((potensi: string) => {
                            const formattedPotensi = toTitleCase(potensi);
                            potensiCount[formattedPotensi] = (potensiCount[formattedPotensi] || 0) + 1;
                        });
                    });
                } else if (typeof data.potensiDesa === 'string') {
                    const potensiSplit = data.potensiDesa.split(',').map((p: string) => p.trim());
                    potensiSplit.forEach((potensi: string) => {
                        const formattedPotensi = toTitleCase(potensi);
                        potensiCount[formattedPotensi] = (potensiCount[formattedPotensi] || 0) + 1;
                    });
                }
            });

            setAllPotensiData({ ...potensiCount });

            const kondisiArray = Object.keys(potensiCount)
                .map((key) => ({
                    kategori: key,
                    jumlah: potensiCount[key],
                }))
                .sort((a, b) => b.jumlah - a.jumlah);

            setKondisiData(kondisiArray);

            const sortedPotensi = Object.keys(potensiCount)
                .map((name) => ({
                    name,
                    value: potensiCount[name],
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            const customOrder = [3, 1, 0, 2, 4];
            const customHeights = [20, 40, 50, 35, 15];
            const customRanks = ["4th", "2nd", "1st", "3rd", "5th"];

            const rankedData = customOrder.map((index, rankIndex) => ({
                name: sortedPotensi[index]?.name || "",
                value: customHeights[rankIndex],
                valueAsli: sortedPotensi[index]?.value || 0,
                rank: customRanks[rankIndex],
            }));

            setBarData(rankedData);
        } catch (error) {
            console.error("Error fetching potensi data:", error);
        }
    };

    const handleDownload = () => {
        const sorted = Object.entries(allPotensiData)
            .map(([name, count]) => ({ name, value: count as number }))
            .sort((a, b) => b.value - a.value);

        const excelData = sorted.map((item, index) => ({
            No: index + 1,
            Kategori: item.name,
            "Jumlah Desa": item.value,
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "PotensiDesa");

        XLSX.writeFile(workbook, "sebaran_potensi_desa.xlsx");
    };

    useEffect(() => {
        fetchPotensiData();
    }, []);

    const totalPages = Math.ceil(kondisiData.length / ITEMS_PER_PAGE);

    return (
        <Box>
            {/* 🔹 Header */}
            <Flex justify="space-between" align="center" mt="24px" mx="15px">
                <Text fontSize="sm" fontWeight="bold" color="gray.800">
                    Sebaran Potensi Desa
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
                    onClick={handleDownload}
                >
                    <DownloadIcon boxSize={3} color="black" />
                </Button> */}
            </Flex>

            {/* 🔹 Chart */}
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
                    <BarChart data={barData} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#1E5631">
                            <LabelList
                                dataKey="name"
                                position="top"
                                fontSize="10px"
                                formatter={(name: string) => name.replace(/^Desa\s+/i, "")}
                            />
                            <LabelList
                                dataKey="rank"
                                content={<CustomLabel x={0} y={0} width={0} value={""} />}
                            />
                            {barData.map((_, index) => (
                                <Cell key={`cell-${index}`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>

            {/* 🔹 Table */}
            <Box
                bg="white"
                borderRadius="xl"
                pt={0}
                pb={3}
                mx="15px"
                boxShadow="md"
                border="0px solid"
                borderColor="gray.200"
                mt={4}
            >
                <TableContainer maxWidth="100%" width="auto" borderRadius="md">
                    <Table variant="simple" size="sm">
                        <Thead bg="#C6D8D0">
                            <Tr>
                                <Th p={3} fontSize="8px" textAlign="center">No</Th>
                                <Th p={1} fontSize="8px" textAlign="center">Kategori Potensi</Th>
                                <Th p={1} fontSize="8px" textAlign="center">Total Desa</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {kondisiData
                                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                                .map((row, index) => (
                                    <Tr key={index}>
                                        <Td p={1} fontSize="8px" textAlign="center" fontWeight="bold">
                                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                        </Td>
                                        <Td p={1} fontSize="8px" textAlign="center">{row.kategori}</Td>
                                        <Td p={1} fontSize="8px" textAlign="center">{row.jumlah}</Td>
                                    </Tr>
                                ))}
                        </Tbody>
                    </Table>
                </TableContainer>

                {/* 🔹 Pagination */}
                <Flex justify="center" mt={3} gap={2}>
                    {(() => {
                        const pagesPerBlock = 5;
                        const currentBlock = Math.floor((currentPage - 1) / pagesPerBlock);
                        const startPage = currentBlock * pagesPerBlock + 1;
                        const endPage = Math.min(startPage + pagesPerBlock - 1, totalPages);

                        return (
                            <>
                                {/* Prev icon button */}
                                {startPage > 1 && (
                                    <Button
                                        size="xs"
                                        onClick={() => setCurrentPage(startPage - 1)}
                                        variant="ghost"
                                        p={1}
                                    >
                                        <Icon as={ChevronLeftIcon} />
                                    </Button>
                                )}

                                {/* Page numbers */}
                                {[...Array(endPage - startPage + 1)].map((_, index) => {
                                    const page = startPage + index;
                                    return (
                                        <Button
                                            key={page}
                                            size="xs"
                                            borderRadius="full"
                                            bg={currentPage === page ? "gray.800" : "white"}
                                            color={currentPage === page ? "white" : "gray.800"}
                                            onClick={() => setCurrentPage(page)}
                                            _hover={{ bg: "gray.300" }}
                                        >
                                            {page}
                                        </Button>
                                    );
                                })}

                                {/* Next icon button */}
                                {endPage < totalPages && (
                                    <Button
                                        size="xs"
                                        onClick={() => setCurrentPage(endPage + 1)}
                                        variant="ghost"
                                        p={1}
                                    >
                                        <Icon as={ChevronRightIcon} />
                                    </Button>
                                )}
                            </>
                        );
                    })()}
                </Flex>
            </Box>
        </Box>
    );
};

export default SebaranPotensiDesa;
