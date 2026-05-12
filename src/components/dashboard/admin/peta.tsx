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
import { Filter } from 'lucide-react';

interface MarkerItem {
    name: string;
    lat: number;
    lon: number;
    details: { label: string; value: string | number }[];
    raw: any;
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
                            const lat = parseFloat(matchedVillage.latitude);
                            const lon = parseFloat(matchedVillage.longitude);

                            if (!isNaN(lat) && !isNaN(lon)) {
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
                                });
                            }
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
                            const lat = parseFloat(matchedVillage.latitude);
                            const lon = parseFloat(matchedVillage.longitude);

                            if (!isNaN(lat) && !isNaN(lon)) {
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
                                });
                            }
                        }
                    });
                }
                else if (selectedCategory === 'desa') {
                    const villageRes = await fetch('/api/villages');
                    const villageData = await villageRes.json();
                    const villages = villageData.villages || [];

                    villages.forEach((data: any) => {
                        const lat = parseFloat(data.latitude);
                        const lon = parseFloat(data.longitude);

                        if (!isNaN(lat) && !isNaN(lon)) {
                            let details: { label: string; value: string | number }[] = [
                                { label: 'Nama Inovasi', value: data.namaInovasi || 'Tidak diketahui' },
                                { label: 'Jumlah Inovasi', value: data.jumlahInovasi || 0 },
                            ];

                            let name = data.namaDesa || 'Tanpa Nama';

                            results.push({ name, lat, lon, details, raw: data });
                        }
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
                            <Marker key={index} position={[marker.lat, marker.lon]}>
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