import {
    Box,
    Flex,
    Text,
    Button,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerCloseButton,
    SimpleGrid,
    Checkbox,
    Select,
    useDisclosure,
} from "@chakra-ui/react";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import { DownloadIcon } from "@chakra-ui/icons";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const SebaranDesaDashboard: React.FC = () => {
    const router = useRouter();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedProvinces, setSelectedProvinces] = useState<string | null>(null);
    const [selectedRegencies, setSelectedRegencies] = useState<string | null>(null);
    const [selectedDistricts, setSelectedDistricts] = useState<string | null>(null);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [markers, setMarkers] = useState<{ [key: string]: { lat: number; lon: number } }>({});
    const [villageData, setVillageData] = useState<any[]>([]);

    // Fetch data desa
    const fetchVillageData = async () => {
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

            const villageList: any[] = [];
            villages.forEach((data: any) => {
                if (
                    data.namaDesa &&
                    data.lokasi?.provinsi?.label &&
                    data.lokasi?.kabupatenKota?.label &&
                    data.lokasi?.kecamatan?.label
                ) {
                    villageList.push({
                        name: data.namaDesa?.label ? data.namaDesa.label.trim() : typeof data.namaDesa === 'string' ? data.namaDesa.trim() : "",
                        provinsi: data.lokasi.provinsi.label.trim(),
                        kabupaten: data.lokasi.kabupatenKota.label.trim(),
                        kecamatan: data.lokasi.kecamatan.label.trim(),
                    });
                }
            });

            setVillageData(villageList);
            setFilteredData(villageList);
        } catch (error) {
            console.error("Error fetching village data:", error);
        }
    };

    // Delay utility function to avoid rate limiting
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Function to get coordinates with retry mechanism
    const getCoordinatesByVillage = async (village: any, retryCount = 3): Promise<{ lat: number, lon: number } | null> => {
        const query = `${village.name}, ${village.kecamatan}, ${village.kabupaten}, ${village.provinsi}, Indonesia`;
        console.log("🔍 Mencari koordinat untuk:", query);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
            );
            const data = await response.json();

            // Return first valid result
            if (data.length > 0) {
                console.log(`✅ Koordinat ditemukan untuk ${village.name}:`, data[0]);
                return {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon),
                };
            } else {
                console.warn(`Koordinat tidak ditemukan untuk: ${query}`);
            }
        } catch (error) {
            console.error("Gagal ambil koordinat:", error);
            if (retryCount > 0) {
                console.log(`🔄 Retry untuk: ${query}, sisa percobaan: ${retryCount}`);
                await delay(2000);  // Tambahkan delay 2 detik sebelum mencoba lagi
                return getCoordinatesByVillage(village, retryCount - 1);
            }
        }
        return null;
    };

    // Function to process villages in batches to avoid rate limiting
    const processVillagesInBatches = async (villages: any[], batchSize = 5) => {
        const markerUpdates: { [key: string]: { lat: number; lon: number } } = {};

        for (let i = 0; i < villages.length; i += batchSize) {
            const batch = villages.slice(i, i + batchSize);
            console.log(`Memproses batch ${Math.floor(i / batchSize) + 1}...`);

            // Process each village in the batch
            const results = await Promise.all(batch.map((village) => getCoordinatesByVillage(village)));

            results.forEach((coords, index) => {
                const villageName = batch[index].name;
                if (coords) {
                    markerUpdates[villageName] = coords;
                }
            });

            console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} selesai.`);

            // Delay between batches to avoid server overload
            await delay(2000);
        }

        return markerUpdates;
    };

    // Update markers using batch processing
    useEffect(() => {
        const updateMarkers = async () => {
            if (filteredData.length === 0) return;

            console.log("🔄 Memperbarui marker desa...");
            const newMarkers = await processVillagesInBatches(filteredData, 5);

            // Update the markers state
            setMarkers((prev) => ({ ...prev, ...newMarkers }));
        };

        updateMarkers();
    }, [filteredData]);

    console.log("Filtered Data:", filteredData);
    console.log("Markers:", markers);


    useEffect(() => {
        fetchVillageData();
    }, []);

    const handleDownloadExcel = () => {
        const excelData = filteredData.map((item, index) => ({
            No: index + 1,
            Desa: item.name,
            Provinsi: item.provinsi,
            Kabupaten: item.kabupaten,
            Kecamatan: item.kecamatan,
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sebaran Desa");

        XLSX.writeFile(workbook, "sebaran_desa_digital.xlsx");
    };

    const handleProvinceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedProvince = event.target.value;
        setSelectedProvinces(selectedProvince);
        setSelectedRegencies(null);  // Reset kabupaten
        setSelectedDistricts(null);  // Reset kecamatan
    };

    const handleRegencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedRegency = event.target.value;
        setSelectedRegencies(selectedRegency);
        setSelectedDistricts(null);  // Reset kecamatan
    };

    const handleDistrictChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDistrict = event.target.value;
        setSelectedDistricts(selectedDistrict);
    };

    useEffect(() => {
        const filtered = villageData.filter((village) => {
            return (
                (!selectedProvinces || village.provinsi === selectedProvinces) &&
                (!selectedRegencies || village.kabupaten === selectedRegencies) &&
                (!selectedDistricts || village.kecamatan === selectedDistricts)
            );
        });
        setFilteredData(filtered);
    }, [selectedProvinces, selectedRegencies, selectedDistricts, villageData]);

    const provinces = Array.from(new Set(villageData.map((village) => village.provinsi)));
    const regencies = selectedProvinces ? Array.from(new Set(villageData.filter((village) => village.provinsi === selectedProvinces).map((village) => village.kabupaten))) : [];
    const districts = selectedRegencies ? Array.from(new Set(villageData.filter((village) => village.kabupaten === selectedRegencies).map((village) => village.kecamatan))) : [];
    const dataToShow = filteredData.length > 0 ? filteredData : villageData;

    return (
        <Box>
            {/* HEADER + FILTER + DOWNLOAD BUTTON */}
            <Flex justify="space-between" align="center" mt="24px" mx="15px">
                <Text fontSize="sm" fontWeight="bold" color="gray.800">
                    Sebaran Desa Digital
                </Text>
                <Flex gap={2}>
                    <Button
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
                        leftIcon={<Filter size={14} stroke="#1E5631" fill="#1E5631" />}
                        onClick={onOpen}
                    >
                        <Text fontSize="10px" fontWeight="medium" color="black" mr={1}>
                            Wilayah
                        </Text>
                    </Button>
                </Flex>
            </Flex>

            {/* LEAFLET MAP */}
            <Box
                bg="white"
                borderRadius="xl"
                pt="5px"
                pb="1px"
                mx="15px"
                boxShadow="md"
                borderColor="gray.200"
                mt={4}
                overflow="hidden"
                zIndex={1}
            >
                <MapContainer
                    center={[-2.5, 118]}
                    zoom={3}
                    style={{ height: "250px", width: "100%", borderRadius: "10px", zIndex: 1 }}
                    className="map-container"
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {dataToShow.map((item, index) => {
                        const coords = markers[item.name];
                        if (!coords) return null;
                        return (
                            <Marker key={index} position={[coords.lat, coords.lon]}>
                                <Popup>
                                    <Text fontSize="sm" fontWeight="bold">{item.name}</Text>
                                    <Text fontSize="xs">Provinsi: {item.provinsi}</Text>
                                    <Text fontSize="xs">Kabupaten: {item.kabupaten}</Text>
                                    <Text fontSize="xs">Kecamatan: {item.kecamatan}</Text>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </Box>

            {/* DRAWER FILTER */}
            <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
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
                        <Text fontSize="15px" fontWeight="bold">Filter Wilayah</Text>
                        <DrawerCloseButton />
                    </DrawerHeader>

                    <DrawerBody>
                        <SimpleGrid columns={1} spacingX={2} spacingY={2} w="full">
                            <Select
                                placeholder="Pilih Provinsi"
                                value={selectedProvinces || ""}
                                onChange={handleProvinceChange}
                            >
                                {provinces.map((provinsi) => (
                                    <option key={provinsi} value={provinsi}>{provinsi}</option>
                                ))}
                            </Select>

                            <Select
                                placeholder="Pilih Kabupaten"
                                value={selectedRegencies || ""}
                                onChange={handleRegencyChange}
                                isDisabled={!selectedProvinces}
                            >
                                {regencies.map((kabupaten) => (
                                    <option key={kabupaten} value={kabupaten}>{kabupaten}</option>
                                ))}
                            </Select>

                            <Select
                                placeholder="Pilih Kecamatan"
                                value={selectedDistricts || ""}
                                onChange={handleDistrictChange}
                                isDisabled={!selectedRegencies}
                            >
                                {districts.map((kecamatan) => (
                                    <option key={kecamatan} value={kecamatan}>{kecamatan}</option>
                                ))}
                            </Select>
                        </SimpleGrid>
                    </DrawerBody>

                    <DrawerFooter>
                        <Button bg="#1E5631" color="white" w="full" _hover={{ bg: "#16432D" }} onClick={onClose}>
                            Terapkan Filter
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </Box>
    );
};

export default SebaranDesaDashboard;