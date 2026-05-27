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
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
} from "recharts";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Filter } from "lucide-react";

const SebaranKategoriInovator: React.FC = () => {
  const [kategoriData, setKategoriData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [filteredData, setFilteredData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const colors: string[] = ["#A7C7A5", "#1E5631", "#779e74", "#448f5e"];

  useEffect(() => {
    const fetchKategoriData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const headers: Record<string, string> = {};
        if (currentUser) {
            const token = await currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch("/api/innovator", { headers });
        const dataRaw = await response.json();
        const innovators = dataRaw.data || [];

        const kategoriCount: Record<string, number> = {};

        innovators.forEach((data: any) => {
          if (data.kategori) {
            const kategori = data.kategori.trim();
            kategoriCount[kategori] = (kategoriCount[kategori] || 0) + 1;
          }
        });

        const sortedEntries = Object.entries(kategoriCount).sort((a, b) => b[1] - a[1]);

        const fullData = sortedEntries.map(([key, value], index) => ({
          name: key,
          value,
          color: colors[index % colors.length],
        }));

        setKategoriData(fullData); // semua kategori tetap disimpan

        // Pilih 3 kategori target secara manual
        const targetNames = ["Akademisi", "Pemerintah Daerah", "Start Up"];
        const initialThree = fullData.filter(item => targetNames.includes(item.name));

        setFilteredData(initialThree);
        setAllCategories(Object.keys(kategoriCount));
        setSelectedCategories(initialThree.map(item => item.name));

      } catch (error) {
        console.error("Error fetching kategori data:", error);
      }
    };

    fetchKategoriData();

  }, []);

  const handleDownload = () => {
    const total = filteredData.reduce((sum, item) => sum + item.value, 0);

    const excelData = filteredData.map((item, index) => ({
      No: index + 1,
      Kategori: item.name,
      "Jumlah Inovator": item.value,
      "Persentase (%)": Math.round((item.value / total) * 100) + "%",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kategori Inovator");
    XLSX.writeFile(workbook, "sebaran_kategori_inovator.xlsx");
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={25} fontWeight="bold" fontFamily="poppins">
        {` ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const applyFilter = () => {
    if (selectedCategories.length < 2) {
      alert("Pilih minimal 2 kategori.");
      return;
    }

    const filtered = kategoriData.filter((item) => selectedCategories.includes(item.name));
    setFilteredData(filtered);
    setIsOpen(false);
  };


  const handleCheckboxChange = (category: string) => {
    setSelectedCategories((prev) => {
      // Cegah menghapus jika tinggal dua
      if (prev.length === 2 && prev.includes(category)) {
        alert("Minimal harus memilih 2 kategori.");
        return prev;
      }

      return prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category];
    });
  };

  return (
    <Box>
      {/* Header + Button */}
      <Flex justify="space-between" align="center" mt="11px" mx="15px">
        <Text fontSize="sm" fontWeight="bold" color="gray.800">
          Sebaran Kategori Inovator
        </Text>
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

      {/* Chart */}
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

          {/* Legend */}
          <Box ml={4}>
            {filteredData.map((entry, index) => (
              <Flex key={index} align="center" mb={1} mr={3} whiteSpace="nowrap">
                <Box w={2} h={2} bg={entry.color} borderRadius="full" mr={2} />
                <Text fontSize="10px">{entry.name}</Text>
              </Flex>
            ))}
          </Box>
        </Flex>
      </Box>

      {/* Filter Drawer */}
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

export default SebaranKategoriInovator;