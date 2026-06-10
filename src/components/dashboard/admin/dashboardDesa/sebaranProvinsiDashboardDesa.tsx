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
import * as L from "leaflet";

const provinceCoords: Record<string, { lat: number; lng: number }> = {
  'ACEH': { lat: 4.695135, lng: 96.749399 },
  'SUMATERA UTARA': { lat: 2.112102, lng: 99.084473 },
  'SUMATERA BARAT': { lat: -0.739945, lng: 100.800005 },
  'RIAU': { lat: 0.507068, lng: 101.543167 },
  'KEPULAUAN RIAU': { lat: 3.945651, lng: 108.142867 },
  'JAMBI': { lat: -1.61862, lng: 103.613898 },
  'SUMATERA SELATAN': { lat: -3.319437, lng: 104.914652 },
  'KEPULAUAN BANGKA BELITUNG': { lat: -2.741051, lng: 106.440587 },
  'BANGKA BELITUNG': { lat: -2.741051, lng: 106.440587 },
  'BENGKULU': { lat: -3.792845, lng: 102.260764 },
  'LAMPUNG': { lat: -4.558585, lng: 105.400005 },
  'DKI JAKARTA': { lat: -6.2088, lng: 106.8456 },
  'JAWA BARAT': { lat: -7.090911, lng: 107.668887 },
  'BANTEN': { lat: -6.405817, lng: 106.060005 },
  'JAWA TENGAH': { lat: -7.150975, lng: 110.140259 },
  'DI YOGYAKARTA': { lat: -7.875385, lng: 110.426208 },
  'YOGYAKARTA': { lat: -7.875385, lng: 110.426208 },
  'JAWA TIMUR': { lat: -7.536064, lng: 112.233154 },
  'BALI': { lat: -8.409518, lng: 115.188916 },
  'NUSA TENGGARA BARAT': { lat: -8.652933, lng: 117.361648 },
  'NUSA TENGGARA TIMUR': { lat: -8.657382, lng: 121.07937 },
  'KALIMANTAN BARAT': { lat: -0.278781, lng: 111.475285 },
  'KALIMANTAN TENGAH': { lat: -1.681488, lng: 113.382355 },
  'KALIMANTAN SELATAN': { lat: -3.092642, lng: 115.283759 },
  'KALIMANTAN TIMUR': { lat: 1.640629, lng: 116.419389 },
  'KALIMANTAN UTARA': { lat: 3.073125, lng: 116.041389 },
  'SULAWESI UTARA': { lat: 0.624693, lng: 123.975005 },
  'GORONTALO': { lat: 0.699937, lng: 122.446724 },
  'SULAWESI TENGAH': { lat: -1.430005, lng: 121.445587 },
  'SULAWESI BARAT': { lat: -2.844137, lng: 119.232078 },
  'SULAWESI SELATAN': { lat: -3.668799, lng: 119.974053 },
  'SULAWESI TENGGARA': { lat: -4.14491, lng: 122.174605 },
  'MALUKU': { lat: -3.238458, lng: 130.145273 },
  'MALUKU UTARA': { lat: 1.570999, lng: 127.800005 },
  'PAPUA BARAT': { lat: -1.336106, lng: 133.174716 },
  'PAPUA': { lat: -4.269928, lng: 138.080353 },
  'PAPUA SELATAN': { lat: -7.5, lng: 139.0 },
  'PAPUA TENGAH': { lat: -4.0, lng: 136.0 },
  'PAPUA PEGUNUNGAN': { lat: -4.0, lng: 139.0 },
  'PAPUA BARAT DAYA': { lat: -1.0, lng: 132.0 }
};

function getCoordsByProvince(prov: string, index: number = 0) {
  const norm = (prov || '').toUpperCase().trim();
  let coords = provinceCoords[norm];
  if (!coords) {
    const matchingKey = Object.keys(provinceCoords).find(k => norm.includes(k) || k.includes(norm));
    if (matchingKey) {
      coords = provinceCoords[matchingKey];
    }
  }
  
  if (coords) {
    const jitterLat = ((index * 17) % 100 - 50) / 500;
    const jitterLng = ((index * 23) % 100 - 50) / 500;
    return {
      lat: coords.lat + jitterLat,
      lng: coords.lng + jitterLng
    };
  }
  
  const jitterLat = ((index * 17) % 100 - 50) / 250;
  const jitterLng = ((index * 23) % 100 - 50) / 250;
  return {
    lat: -2.5 + jitterLat,
    lng: 118.0 + jitterLng
  };
}

const getCustomIcon = () => {
    return L.divIcon({
        html: `<div style="display: flex; justify-content: center; align-items: center; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.35));">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#2e7d32">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
        </div>`,
        className: 'custom-leaflet-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

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
                        let lat = coords?.lat;
                        let lon = coords?.lon;
                        if (!lat || !lon) {
                            const fallback = getCoordsByProvince(item.provinsi, index);
                            lat = fallback.lat;
                            lon = fallback.lng;
                        }
                        return (
                            <Marker key={index} position={[lat, lon]} icon={getCustomIcon()}>
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