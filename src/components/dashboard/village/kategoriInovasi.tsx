import { Box, Flex, Text, Button } from "@chakra-ui/react";
import { Table, Thead, Tbody, Tr, Th, Td, TableContainer, useDisclosure, ModalOverlay, Modal, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Select, ModalFooter } from "@chakra-ui/react";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, LabelList, Cell } from "recharts";
import { DownloadIcon } from "@chakra-ui/icons";
import { TooltipProps } from "recharts";
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

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

// 🔹 Custom label persis kayak DesaDigitalUnggulan
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

const CustomTooltip = ({
    active,
    payload,
    label,
}: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length > 0) {
        const data = payload[0].payload;

        return (
            <div style={{ background: "white", padding: "10px", border: "1px solid #ccc" }}>
                <p style={{ margin: 0, fontWeight: "bold" }}>{data.name}</p>
                <p style={{ margin: 0 }}>Total Inovasi : {data.valueAsli}</p>
            </div>
        );
    }

    return null;
};

const KategoriInovasiDesa: React.FC = () => {
    const [barData, setBarData] = useState<ChartData[]>([]);
    const [allKategoriData, setAllKategoriData] = useState<Record<string, number>>({});
    const [kondisiData, setKondisiData] = useState<{ kategori: string; jumlah: number }[]>([]);
    const ITEMS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = useState(1);


    const fetchKategoriData = async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                console.error("User belum login");
                return;
            }

            const token = await user.getIdToken();
            const response = await fetch(`/api/villages/dashboard?desaId=${user.uid}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch dashboard data");
            const data = await response.json();
            
            const categoryStats = data.categoryStats || [];
            
            const kategoriCount: Record<string, number> = {};
            categoryStats.forEach((item: any) => {
                if (item.kategori) {
                    const formatted = item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1).toLowerCase();
                    kategoriCount[formatted] = (kategoriCount[formatted] || 0) + (item.total || 0);
                }
            });

            setAllKategoriData(kategoriCount);

            const kondisiArray = Object.entries(kategoriCount).map(([kategori, jumlah]) => ({
                kategori,
                jumlah
            }));

            setKondisiData(kondisiArray);

            const sortedKategori = Object.entries(kategoriCount)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            const displayedKategori = sortedKategori.slice(0, 5);

            while (displayedKategori.length < 5) {
                displayedKategori.push({
                    name: "",
                    value: 0,
                });
            }

            const customOrder = [3, 1, 0, 2, 4];
            const customRanks = ["4th", "2nd", "1st", "3rd", "5th"];

            const rankedData = customOrder.map((index, rankIndex) => {
                const item = displayedKategori[index];
                return {
                    name: item?.name || "-",
                    value: item?.value || 0,
                    valueAsli: item?.value || 0,
                    rank: customRanks[rankIndex],
                    isEmpty: item?.name === ""
                };
            });

            setBarData(rankedData);

        } catch (error) {
            console.error("Error fetching kategori data:", error);
        }
    };


    useEffect(() => {
        fetchKategoriData();
    }, []);


    const totalPages = Math.ceil(kondisiData.length / ITEMS_PER_PAGE);

    return (
        <Box>
            {/* 🔹 Header */}
            <Flex justify="space-between" align="center" mt="24px" mx="15px">
                <Text fontSize="sm" fontWeight="bold" color="gray.800">
                    Kategori Inovasi yang Diterapkan
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
                    gap={2}
                    _hover={{ bg: "gray.100" }}
                    cursor="pointer"
                    onClick={handleDownload}
                ><DownloadIcon boxSize={3} color="black" />
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
                    <BarChart data={barData} margin={{ top: 50, right: 20, left: 20, bottom: -10 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                        <Tooltip content={<CustomTooltip />} />
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
                {/* Table Container */}
                <TableContainer maxWidth="100%" width="auto" borderRadius="md">
                    <Table variant="simple" size="sm">
                        <Thead bg="#C6D8D0">
                            <Tr>
                                <Th p={3} fontSize="8px" textAlign="center">No</Th>
                                <Th p={1} fontSize="8px" textAlign="center">Kategori Potensi</Th>
                                <Th p={1} fontSize="8px" textAlign="center">Jumlah</Th>
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

                {/* Paginasi */}
                <Flex justify="center" mt={3} gap={2}>
                    {[...Array(totalPages)].map((_, index) => (
                        <Button
                            key={index}
                            size="xs"
                            borderRadius="full"
                            bg={currentPage === index + 1 ? "gray.800" : "white"}
                            color={currentPage === index + 1 ? "white" : "gray.800"}
                            onClick={() => setCurrentPage(index + 1)}
                            _hover={{ bg: "gray.300" }}
                        >
                            {index + 1}
                        </Button>
                    ))}
                </Flex>
            </Box>

        </Box>
    );
};

export default KategoriInovasiDesa;