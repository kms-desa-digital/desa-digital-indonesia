import React, { useEffect, useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Spinner,
    Button as ChakraButton,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    DrawerCloseButton,
    Select,
    SimpleGrid,
    Button,
    useDisclosure,
} from '@chakra-ui/react';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { Filter } from 'lucide-react';

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

const getCustomIcon = (category: 'desa' | 'inovator' | 'inovasi') => {
    const color = category === 'desa' ? '#2e7d32' : category === 'inovator' ? '#e65100' : '#0288d1';
    return L.divIcon({
        html: `<div style="display: flex; justify-content: center; align-items: center; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.35));">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="${color}">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
        </div>`,
        className: 'custom-leaflet-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

interface MarkerItem {
    name: string;
    lat: number;
    lon: number;
    details: { label: string; value: string | number }[];
    raw: any;
    category?: 'desa' | 'inovator' | 'inovasi';
}

const Peta: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<'desa' | 'inovator' | 'inovasi'>('desa');
    const [markers, setMarkers] = useState<MarkerItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const { isOpen, onOpen, onClose } = useDisclosure();

    const [filterA, setFilterA] = useState<string>('');
    const [filterB, setFilterB] = useState<string>('');
    const [filterC, setFilterC] = useState<string>('');

    const fetchData = async () => {
        setLoading(true);

        try {
            const results: MarkerItem[] = [];

            if (selectedCategory === 'inovator') {
                const [villageRes, innovatorRes] = await Promise.all([
                    fetch('/api/villages'),
                    fetch('/api/innovator')
                ]);

                const villageData = await villageRes.json();
                const innovatorData = await innovatorRes.json();

                const villages = villageData.villages || [];
                const innovators = innovatorData.data || [];

                innovators.forEach((data: any) => {
                    let desaList: string[] = [];
                    if (Array.isArray(data.desaDampingan)) {
                        desaList = data.desaDampingan;
                    } else if (typeof data.desaDampingan === 'string' && data.desaDampingan.trim()) {
                        desaList = [data.desaDampingan];
                    }

                    desaList.forEach((namaDesa) => {
                        if (namaDesa === 'Tidak diketahui') return;

                        const matchedVillage = villages.find((v: any) => v.namaDesa === namaDesa);
                        if (matchedVillage) {
                            let lat = parseFloat(matchedVillage.latitude);
                            let lon = parseFloat(matchedVillage.longitude);

                            if (isNaN(lat) || isNaN(lon) || !lat || !lon) {
                                const prov = matchedVillage.provinsi || matchedVillage.lokasi?.provinsi?.label || 'Unknown';
                                const coords = getCoordsByProvince(prov, results.length);
                                lat = coords.lat;
                                lon = coords.lng;
                            }

                            const details = [
                                { label: 'Nama Desa', value: matchedVillage.namaDesa || 'Tidak diketahui' },
                                { label: 'Jumlah Desa Dampingan', value: data.jumlahDesaDampingan || desaList.length },
                            ];

                            const name = data.namaInovator || 'Tanpa Nama';

                            results.push({
                                name,
                                lat,
                                lon,
                                details,
                                raw: data,
                                category: 'inovator'
                            });
                        }
                    });
                });
            }
            else {
                if (selectedCategory === 'inovasi') {
                    const [villageRes, innovationRes] = await Promise.all([
                        fetch('/api/villages'),
                        fetch('/api/innovations')
                    ]);

                    const villageData = await villageRes.json();
                    const innovationData = await innovationRes.json();

                    const villages = villageData.villages || [];
                    const innovations = innovationData.innovations || [];

                    innovations.forEach((data: any) => {
                        const namaDesa = data.inputDesaMenerapkan;

                        if (!namaDesa || namaDesa === 'Tidak diketahui') return;

                        const matchedVillage = villages.find((v: any) => v.namaDesa === namaDesa);

                        if (matchedVillage) {
                            let lat = parseFloat(matchedVillage.latitude);
                            let lon = parseFloat(matchedVillage.longitude);

                            if (isNaN(lat) || isNaN(lon) || !lat || !lon) {
                                const prov = matchedVillage.provinsi || matchedVillage.lokasi?.provinsi?.label || 'Unknown';
                                const coords = getCoordsByProvince(prov, results.length);
                                lat = coords.lat;
                                lon = coords.lng;
                            }

                            const details = [
                                { label: 'Nama Desa', value: matchedVillage.namaDesa || 'Tidak diketahui' },
                                { label: 'Nama Inovator', value: data.namaInnovator || data.namaInovator || 'Tidak diketahui' },
                                { label: 'Tahun Dibuat', value: data.tahunDibuat || 'Tidak diketahui' },
                            ];

                            const name = data.namaInovasi || 'Tanpa Nama';

                            results.push({
                                name,
                                lat,
                                lon,
                                details,
                                raw: data,
                                category: 'inovasi'
                            });
                        }
                    });
                }
                else if (selectedCategory === 'desa') {
                    const villageRes = await fetch('/api/villages');
                    const villageData = await villageRes.json();
                    const villages = villageData.villages || [];

                    villages.forEach((data: any, idx: number) => {
                        let lat = parseFloat(data.latitude);
                        let lon = parseFloat(data.longitude);

                        if (isNaN(lat) || isNaN(lon) || !lat || !lon) {
                            const prov = data.provinsi || data.lokasi?.provinsi?.label || 'Unknown';
                            const coords = getCoordsByProvince(prov, idx);
                            lat = coords.lat;
                            lon = coords.lng;
                        }

                        let details: { label: string; value: string | number }[] = [
                            { label: 'Nama Inovasi', value: data.namaInovasi || 'Tidak diketahui' },
                            { label: 'Jumlah Inovasi', value: data.jumlahInovasi || 0 },
                        ];

                        let name = data.namaDesa || 'Tanpa Nama';

                        results.push({ name, lat, lon, details, raw: data, category: 'desa' });
                    });
                }
            }

            setMarkers(results);
        } catch (err) {
            console.error('Error fetching markers:', err);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
        setFilterA('');
        setFilterB('');
        setFilterC('');
    }, [selectedCategory]);

    useEffect(() => {
        setFilterB('');
        setFilterC('');
    }, [filterA]);

    useEffect(() => {
        setFilterC('');
    }, [filterB]);

    const getCategoryLabel = () => {
        switch (selectedCategory) {
            case 'desa': return 'Desa Digital';
            case 'inovator': return 'Inovator';
            case 'inovasi': return 'Inovasi';
            default: return '';
        }
    };

    const handleFilterChange = (setter: any, convertToNumber = false) =>
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = convertToNumber ? Number(e.target.value) : e.target.value;
            setter(value);
        };

    const getFilterOptions = () => {
        const allData = markers.map(m => m.raw);

        const extractUnique = (data: any[], field: string) =>
            [...new Set(data.map(item => item[field]).filter(Boolean))];

        // Selalu pakai allData untuk filter A (global)
        const filterAOptions = (() => {
            switch (selectedCategory) {
                case 'desa':
                    return extractUnique(allData, 'provinsi').sort((a, b) => a.localeCompare(b));
                case 'inovator':
                    return extractUnique(allData, 'kategoriInovator').sort((a, b) => a.localeCompare(b));
                case 'inovasi':
                    return extractUnique(allData, 'tahunDibuat').sort((a, b) => parseInt(b) - parseInt(a)); // DESC
                default:
                    return [];
            }
        })();


        // Filtered subset (cascade) untuk B dan C
        let filtered = allData;

        if (filterA) {
            if (selectedCategory === 'desa') filtered = filtered.filter(item => item.provinsi === filterA);
            if (selectedCategory === 'inovator') filtered = filtered.filter(item => item.kategoriInovator === filterA);
            if (selectedCategory === 'inovasi') filtered = filtered.filter(item => item.tahunDibuat === filterA); // now tahun dulu
        }

        if (filterB) {
            if (selectedCategory === 'desa') filtered = filtered.filter(item => item.namaDesa === filterB);
            if (selectedCategory === 'inovator') filtered = filtered.filter(item => item.namaInovator === filterB);
            if (selectedCategory === 'inovasi') filtered = filtered.filter(item => item.kategori === filterB); // kategori kedua
        }

        const filterBOptions = (() => {
            switch (selectedCategory) {
                case 'desa':
                    return extractUnique(filtered, 'namaDesa').sort((a, b) => a.localeCompare(b));
                case 'inovator':
                    return extractUnique(filtered, 'namaInovator').sort((a, b) => a.localeCompare(b));
                case 'inovasi':
                    return extractUnique(filtered, 'kategori').sort((a, b) => a.localeCompare(b)); // kategori
                default:
                    return [];
            }
        })();

        const filterCOptions = (() => {
            switch (selectedCategory) {
                case 'desa':
                    return extractUnique(filtered, 'kategoriInovasi').sort((a, b) => a.localeCompare(b));
                case 'inovasi':
                    return extractUnique(filtered, 'namaInovasi').sort((a, b) => a.localeCompare(b)); // nama inovasi terakhir
                default:
                    return [];
            }
        })();

        return {
            a: filterAOptions,
            b: filterBOptions,
            c: filterCOptions,
        };
    };

    const getFilteredMarkers = () => {
        return markers.filter((marker) => {
            const data = marker.raw;
            const conditions: boolean[] = [];

            if (filterA) {
                if (selectedCategory === 'desa') conditions.push(data.provinsi === filterA);
                if (selectedCategory === 'inovator') conditions.push(data.kategoriInovator === filterA);
                if (selectedCategory === 'inovasi') conditions.push(String(data.tahunDibuat) === String(filterA)); // tahun = filter A
            }
            if (filterB) {
                if (selectedCategory === 'desa') conditions.push(data.namaDesa === filterB);
                if (selectedCategory === 'inovator') conditions.push(data.namaInovator === filterB);
                if (selectedCategory === 'inovasi') conditions.push(data.kategori === filterB); // kategori = filter B
            }
            if (filterC) {
                if (selectedCategory === 'desa') conditions.push(data.kategoriInovasi === filterC);
                if (selectedCategory === 'inovasi') conditions.push(data.namaInovasi === filterC); // namaInovasi = filter C
            }


            return conditions.every(Boolean);
        });
    };

    const filterOptions = getFilterOptions();

    return (
        <Box>
            <Flex justify="space-between" align="center" mt={2} mx="15px" mb={3}>
                <Text fontSize="md" fontWeight="bold" color="gray.800">
                    Peta {getCategoryLabel()}
                </Text>
            </Flex>
            <Flex gap={2}>
                {['desa', 'inovator', 'inovasi'].map((cat) => (
                    <ChakraButton
                        key={cat}
                        onClick={() => setSelectedCategory(cat as any)}
                        variant={selectedCategory === cat ? 'outline' : 'solid'}
                        fontSize="10"
                        ml={cat === 'desa' ? 4 : 0}
                        mr={cat === 'inovasi' ? 1 : 0}
                        height={8}
                        boxShadow={selectedCategory === cat ? 'none' : 'md'}
                        bg={selectedCategory === cat ? 'transparent' : '#347357'}
                        borderColor={selectedCategory === cat ? '#347357' : 'transparent'}
                        color={selectedCategory === cat ? '#347357' : 'white'}
                        _hover={{
                            bg: selectedCategory === cat ? 'transparent' : '#C5D9D1',
                            borderColor: '#347357',
                            color: '#347357',
                        }}
                        _active={{
                            bg: '#347357',
                            boxShadow: 'none',
                        }}
                    >
                        {cat === 'desa' ? 'Desa Digital' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </ChakraButton>
                ))}
                <ChakraButton
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
                    onClick={onOpen}
                    leftIcon={<Filter size={14} stroke="#1E5631" fill="#1E5631" />}
                >
                    <Text fontSize="10px" fontWeight="medium" color="black" mr={1}>
                        Filter
                    </Text>
                </ChakraButton>
            </Flex>

            <Box mt={4} mx={4} borderRadius="xl" overflow="hidden" boxShadow="md">
                {loading ? (
                    <Flex justify="center" align="center" height="250px">
                        <Spinner color="green.500" size="lg" />
                    </Flex>
                ) : (
                    <MapContainer center={[-2.5, 118]} zoom={3} style={{ height: '250px', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {getFilteredMarkers().map((marker, index) => (
                            <Marker key={index} position={[marker.lat, marker.lon]} icon={getCustomIcon(marker.category || selectedCategory)}>
                                <Popup>
                                    <Text fontWeight="bold" fontSize="sm">{marker.name}</Text>
                                    {marker.details.map((item, idx) => (
                                        <Text key={idx} fontSize="xs">{item.label}: {item.value}</Text>
                                    ))}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}
            </Box>

            <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
                <DrawerOverlay />
                <DrawerContent sx={{ borderTopRadius: 'lg', width: '360px', my: 'auto', mx: 'auto' }}>
                    <DrawerHeader display="flex" justifyContent="space-between" alignItems="center">
                        <Text fontSize="15px" fontWeight="bold">Filter {getCategoryLabel()}</Text>
                        <DrawerCloseButton />
                    </DrawerHeader>

                    <DrawerBody>
                        <SimpleGrid columns={1} spacing={3}>
                            {/* Filter A */}
                            {filterOptions.a && (
                                <Select
                                    fontSize="sm"
                                    sx={{
                                        option: {
                                            fontSize: '9px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }
                                    }}
                                    placeholder={`Pilih ${selectedCategory === 'desa'
                                        ? 'Provinsi'
                                        : selectedCategory === 'inovator'
                                            ? 'Kategori Inovator'
                                            : 'Tahun Dibuat'
                                        }`}
                                    value={filterA}
                                    onChange={handleFilterChange(setFilterA)}
                                >
                                    {filterOptions.a.map((val) => (
                                        <option key={val} value={val}>{val}</option>
                                    ))}
                                </Select>
                            )}

                            {/* Filter B */}
                            {filterOptions.b && (
                                <Select
                                    fontSize="sm"
                                    sx={{
                                        option: {
                                            fontSize: '9px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }
                                    }}
                                    placeholder={`Pilih ${selectedCategory === 'desa'
                                        ? 'Nama Desa'
                                        : selectedCategory === 'inovator'
                                            ? 'Nama Inovator'
                                            : 'Kategori'
                                        }`}
                                    value={filterB}
                                    onChange={handleFilterChange(setFilterB)}
                                >
                                    {filterOptions.b.map((val) => (
                                        <option key={val} value={val}>{val}</option>
                                    ))}
                                </Select>
                            )}

                            {/* Filter C */}
                            {filterOptions.c && selectedCategory !== 'inovator' && (
                                <Select
                                    fontSize="sm"
                                    sx={{
                                        option: {
                                            fontSize: '9px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }
                                    }}
                                    placeholder={`Pilih ${selectedCategory === 'desa'
                                        ? 'Kategori Inovasi'
                                        : 'Nama Inovasi'
                                        }`}
                                    value={filterC}
                                    onChange={handleFilterChange(setFilterC, selectedCategory === 'inovasi')} // convert ke number jika perlu
                                >
                                    {filterOptions.c.map((val) => (
                                        <option key={val} value={val}>{val}</option>
                                    ))}
                                </Select>
                            )}
                        </SimpleGrid>
                    </DrawerBody>

                    <DrawerFooter>
                        <Button bg="#1E5631" color="white" w="full" _hover={{ bg: '#16432D' }} onClick={onClose}>
                            Terapkan Filter
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </Box>
    );
};

export default Peta;