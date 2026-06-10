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
import { getAuth } from 'firebase/auth';
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

const PetaLama: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<'desa' | 'inovator' | 'inovasi'>('desa');
    const [markers, setMarkers] = useState<MarkerItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const { isOpen, onOpen, onClose } = useDisclosure();

    const [filterA, setFilterA] = useState<string>('');
    const [filterB, setFilterB] = useState<string>('');
    const [filterC, setFilterC] = useState<string>('');
    const [filterD, setFilterD] = useState<string>('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            let token = '';
            if (user) {
                token = await user.getIdToken();
            }

            const response = await fetch('/api/admin/dashboard', {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined
            });

            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            const data = await response.json();

            let markersData: MarkerItem[] = [];
            const allMarkers = data.mapMarkers || [];

            if (selectedCategory === 'desa') {
                markersData = allMarkers
                    .filter((m: any) => m.type === 'village')
                    .map((m: any) => ({
                        name: m.name,
                        lat: parseFloat(m.lat),
                        lon: parseFloat(m.lng),
                        details: [{ label: 'Kategori', value: 'Desa Digital' }],
                        raw: m
                    }));
            } else if (selectedCategory === 'inovator') {
                markersData = allMarkers
                    .filter((m: any) => m.type === 'innovator')
                    .map((m: any) => ({
                        name: m.name,
                        lat: parseFloat(m.lat),
                        lon: parseFloat(m.lng),
                        details: [{ label: 'Kategori', value: 'Inovator' }],
                        raw: m
                    }));
            } else if (selectedCategory === 'inovasi') {
                // Endpoint mapMarkers saat ini tidak mengembalikan inovasi karena tidak ada koordinat
                // Jika ingin tetap render, biarkan array kosong atau ambil dari data inovator terkait
                markersData = [];
            }

            setMarkers(markersData);
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
        setFilterD('');
    }, [selectedCategory]);

    useEffect(() => {
        setFilterB('');
        setFilterC('');
        setFilterD('');
    }, [filterA]);

    useEffect(() => {
        setFilterC('');
        setFilterD('');
    }, [filterB]);

    useEffect(() => {
        setFilterD('');
    }, [filterC]);

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
        console.log('ISI FILTER', allData);


        const extractUnique = (data: any[], field: string) => {
            return [...new Set(data.map(item => {
                const keys = field.split('.');
                let value = item;
                for (const key of keys) {
                    value = value[key];
                    if (!value) return undefined; // If there's no value, return undefined
                }
                return value;
            }).filter(Boolean))];
        };



        // Filter A Options (Global Filter)
        const filterAOptions = (() => {
            switch (selectedCategory) {
                case 'desa': return extractUnique(allData, 'lokasi.provinsi.label').sort((a, b) => a.localeCompare(b));
                case 'inovator': return extractUnique(allData, 'kategori').sort((a, b) => a.localeCompare(b));
                case 'inovasi': return extractUnique(allData, 'tahunDibuat') // DESC untuk tahun terbaru dulu
                default: return [];
            }
        })();

        // Filtered subset for B and C
        let filtered = allData;

        if (filterA) {
            if (selectedCategory === 'desa') filtered = filtered.filter(item => item.lokasi?.provinsi?.label === filterA);
            if (selectedCategory === 'inovator') filtered = filtered.filter(item => item.kategori === filterA);
            if (selectedCategory === 'inovasi') filtered = filtered.filter(item => Number(item.tahunDibuat) === Number(filterA));
        }

        if (filterB) {
            if (selectedCategory === 'desa') filtered = filtered.filter(item => item.lokasi?.kabupatenKota?.label === filterB);
            if (selectedCategory === 'inovator') filtered = filtered.filter(item => item.namaInovator === filterB);
            if (selectedCategory === 'inovasi') filtered = filtered.filter(item => item.namaInovasi === filterB);
        }

        const filterBOptions = (() => {
            switch (selectedCategory) {
                case 'desa': return extractUnique(filtered, 'lokasi.kabupatenKota.label').sort((a, b) => a.localeCompare(b));
                case 'inovator': return extractUnique(filtered, 'namaInovator').sort((a, b) => a.localeCompare(b));
                case 'inovasi': return extractUnique(filtered, 'namaInovasi').sort((a, b) => a.localeCompare(b));
                default: return [];
            }
        })();

        
        const filterCOptions = (() => {
            switch (selectedCategory) {
                case 'desa': return extractUnique(filtered, 'lokasi.kecamatan.label').sort((a, b) => a.localeCompare(b));
                case 'inovasi': return extractUnique(filtered, 'kategori').sort((a, b) => a.localeCompare(b));
                default: return [];
            }
        })();
        
        const filterDOptions = (() => {
            switch (selectedCategory) {
                case 'desa': return extractUnique(filtered, 'namaDesa').sort((a, b) => a.localeCompare(b));
                default: return [];
            }
        })();

        // console.log("All Data:", allData);
        // console.log("Filter A Options:", filterAOptions);
        // console.log("Filter B Options:", filterBOptions);
        // console.log("Filtered Data:", filtered);
        
        return {
            a: filterAOptions,
            b: filterBOptions,
            c: filterCOptions,
            d: filterDOptions,
        };
    };


    const getFilteredMarkers = () => {
        return markers.filter((marker) => {
            const data = marker.raw;
            console.log('Marker Siap dari Filter', data);
            const conditions: boolean[] = [];

            if (filterA) {
                if (selectedCategory === 'desa') conditions.push(data.lokasi?.provinsi?.label === filterA);
                if (selectedCategory === 'inovator') conditions.push(data.kategori === filterA);
                if (selectedCategory === 'inovasi') conditions.push(Number(data.tahunDibuat) === Number(filterA));
            }
            if (filterB) {
                if (selectedCategory === 'desa') conditions.push(data.lokasi?.kabupatenKota?.label === filterB);
                if (selectedCategory === 'inovator') conditions.push(data.namaInovator === filterB);
                if (selectedCategory === 'inovasi') conditions.push(data.namaInovasi === filterB);
            }
            if (filterC) {
                if (selectedCategory === 'desa') conditions.push(data.lokasi?.kecamatan?.label === filterC);
                if (selectedCategory === 'inovasi') conditions.push(data.kategori === filterC);
            }
            if (filterD) {
                if (selectedCategory === 'desa') conditions.push(data.namaDesa === filterD);
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
                                    fontSize="sm" // label / tampilan luar tetap normal
                                    sx={{
                                        option: {
                                            fontSize: '9px',           // perkecil hanya isi opsi
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
                                    onChange={handleFilterChange(setFilterA, selectedCategory === 'inovasi')} // hanya konversi ke number untuk inovasi
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
                                        ? 'Kabupaten'
                                        : selectedCategory === 'inovator'
                                            ? 'Nama Inovator'
                                            : 'Nama Inovasi'
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
                                    fontSize="sm" // label / tampilan luar tetap normal
                                    sx={{
                                        option: {
                                            fontSize: '9px',           // perkecil hanya isi opsi
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }
                                    }}
                                    placeholder={`Pilih ${selectedCategory === 'desa'
                                        ? 'Kecamatan'
                                        : 'Kategori'
                                        }`}
                                    value={filterC}
                                    onChange={handleFilterChange(setFilterC)}
                                >
                                    {filterOptions.c.map((val) => (
                                        <option key={val} value={val}>{val}</option>
                                    ))}
                                </Select>
                            )}

                            {/* Filter D */}
                            {selectedCategory === 'desa' && filterOptions.d && (
                                <Select
                                    fontSize="sm" // label / tampilan luar tetap normal
                                    sx={{
                                        option: {
                                            fontSize: '9px',           // perkecil hanya isi opsi
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }
                                    }}
                                    placeholder={`Pilih Nama Desa`}  // Memperbaiki placeholder berdasarkan kategori yang dipilih
                                    value={filterD}  // Perbaiki penggunaan filterD
                                    onChange={handleFilterChange(setFilterD)}  // Pastikan setFilterD adalah fungsi yang benar
                                >
                                    {filterOptions.d.map((val) => (
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

export default PetaLama;