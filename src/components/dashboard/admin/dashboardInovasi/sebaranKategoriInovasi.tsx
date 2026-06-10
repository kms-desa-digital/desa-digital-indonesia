import {
  Box,
  Flex,
  Text,
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  SimpleGrid,
  Checkbox,
} from "@chakra-ui/react";
import { getAuth } from "firebase/auth";
import { Filter } from "lucide-react";
import { DownloadIcon } from "@chakra-ui/icons";
import React, { useEffect, useState } from "react";
import { PieChart, Pie, Tooltip, Cell } from "recharts";
import * as XLSX from "xlsx";

const SebaranKategoriInnovations: React.FC = () => {
  const [kategoriData, setKategoriData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [filteredData, setFilteredData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const colors: string[] = ["#A7C7A5", "#448f5e", "#174E3B", "#4A7C59", "#7B9E89"];

  const fetchKategoriData = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const headers: Record<string, string> = {};
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch("/api/innovations", { headers });
      const dataRaw = await response.json();
      const innovations = dataRaw.innovations || [];

      const kategoriCount: Record<string, number> = {};

      innovations.forEach((data: any) => {
        if (data.kategori) {
          const kategoriText = data.kategori.trim();
          kategoriCount[kategoriText] = (kategoriCount[kategoriText] || 0) + 1;
        }
      });

      const sortedEntries = Object.entries(kategoriCount).sort((a, b) => b[1] - a[1]);

      const fullData = sortedEntries.map(([key, value], index) => ({
        name: key,
        value,
        color: colors[index % colors.length],
      }));

      setKategoriData(fullData); // semua data

      // ambil 5 kategori acak untuk ditampilkan awal
      const shuffled = [...fullData].sort(() => Math.random() - 0.5);
      const initialFive = shuffled.slice(0, 4);

      setFilteredData(initialFive);
      setAllCategories(Object.keys(kategoriCount));
      setSelectedCategories(initialFive.map(item => item.name)); // pilih 5 acak
    } catch (error) {
      console.error("Error fetching category data:", error);
    }
  };

  useEffect(() => {
    fetchKategoriData();
  }, []);

  const applyFilter = () => {
    const filtered = kategoriData.filter((item) => selectedCategories.includes(item.name));
    setFilteredData(filtered);
    setIsOpen(false);
  };

  const handleCheckboxChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={25}
        fontWeight="bold"
        fontFamily="poppins"
      >
        {`${Math.round(percent * 100)}%`}
      </text>
    );
  };

  const handleDownload = () => {
    const total = filteredData.reduce((sum, item) => sum + item.value, 0);

    const excelData = filteredData.map((item, index) => ({
      No: index + 1,
      Kategori: item.name,
      "Jumlah Inovasi": item.value,
      "Persentase (%)": Math.round((item.value / total) * 100) + "%",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kategori Inovasi");
    XLSX.writeFile(workbook, "sebaran_kategori_inovasi.xlsx");
  };

  return (
    <Box>
      {/* HEADER & BUTTON */}
      <Flex justify="space-between" align="center" mt="24px" mx="15px">
        <Text fontSize="sm" fontWeight="bold" color="gray.800">
          Sebaran Kategori Inovasi
        </Text>
        <Flex gap={2}>
          {/* <Button
            size="sm"
            bg="white"
            boxShadow="md"
            border="2px solid"
            borderColor="gray.200"
            px={2}
            py={2}
            _hover={{ bg: "gray.100" }}
            onClick={handleDownload}
          >
            <DownloadIcon boxSize={3} color="black" />
          </Button> */}
          <Button
            size='sm'
            bg="white"
            boxShadow="md"
            border="2px solid"
            borderColor="gray.200"
            px={2}
            py={2}
            leftIcon={<Filter size={14} stroke="#1E5631" fill="#1E5631" />}
            _hover={{ bg: "gray.100" }}
            onClick={() => setIsOpen(true)}
          >
            <Text fontSize="10px" fontWeight="medium" color="black">
              Kategori
            </Text>
          </Button>
        </Flex>
      </Flex>

      {/* PIE CHART */}
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
        <Flex justify="center" align="center" px={4} py={4} wrap="nowrap" gap={6}>
          <PieChart width={320} height={220}>
            <Pie
              data={filteredData}
              cx="55%"
              cy="50%"
              labelLine={false}
              outerRadius={130}
              dataKey="value"
              label={renderCustomizedLabel}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>

          {/* LEGEND */}
          <Box flexShrink={0} maxW="110px">
            {filteredData.map((entry, index) => (
              <Flex key={index} align="center" mb={2}>
                <Box
                  w="8px"
                  h="8px"
                  bg={entry.color}
                  borderRadius="full"
                  mr={2}
                  flexShrink={0}
                />
                <Text
                  fontSize="10px"
                  whiteSpace="normal"
                  wordBreak="break-word"
                  lineHeight="1.2"
                >
                  {entry.name}
                </Text>
              </Flex>
            ))}
          </Box>
        </Flex>
      </Box>

      {/* DRAWER FILTER */}
      <Drawer isOpen={isOpen} placement="bottom" onClose={() => setIsOpen(false)}>
        <DrawerOverlay />
        <DrawerContent
          sx={{
            borderTopRadius: "lg",
            width: "360px",
            my: "auto",
            mx: "auto",
          }}
        >
          <DrawerHeader display="flex" justifyContent="space-between" alignItems="center">
            <Text fontSize="15px" fontWeight="bold">Filter Kategori</Text>
            <DrawerCloseButton onClick={() => setIsOpen(false)} />
          </DrawerHeader>
          <DrawerBody>
            <SimpleGrid columns={2} spacing={3}>
              {allCategories.map((category) => (
                <Checkbox
                  key={category}
                  isChecked={selectedCategories.includes(category)}
                  onChange={() => handleCheckboxChange(category)}
                >
                  {category}
                </Checkbox>
              ))}
            </SimpleGrid>
          </DrawerBody>
          <DrawerFooter>
            <Button bg="#1E5631" color="white" w="full" _hover={{ bg: "#16432D" }} onClick={applyFilter}>
              Terapkan Filter
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default SebaranKategoriInnovations;
