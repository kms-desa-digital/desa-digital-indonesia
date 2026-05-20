"use client";

import { Box, Button, Text as ChakraText, Flex } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import CardVillage from "Components/card/village";
import { paths } from "Consts/path";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// import { auth, firestore } from "src/firebase/clientApp";
import {
    CardContent,
    Column1,
    Column2,
    Containers,
    GridContainer,
    Text,
    Texthighlight,
} from "./_styles";
import Hero from "Components/village/hero";
import SearchBarVil from "Components/village/SearchBarVil";
import Container from "Components/container";
import BottomSheetSelector from "Components/form/BottomSheetSelector";
import Recommendation from "Components/village/Recommendation";
import { useTranslations } from "next-intl";
import Loading from "Components/loading";

const defaultHeader = "/images/default-header.svg";
const defaultLogo = "/images/default-logo.svg";

// import { collection, DocumentData, getDocs, doc, getDoc } from "firebase/firestore";
import { getProvinces, getRegencies } from "src/services/locationServices";
import { getVillages } from "Services/villageServices";

interface Location {
    id: string;
    name: string;
}

const Village: React.FC = () => {
    const t = useTranslations("Village");
    const router = useRouter();

    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState<number>(1);

    /* 
    useEffect(() => {
        const fetchUserRole = async () => {
            if (user) {
                const userRef = doc(firestore, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserRole(userSnap.data()?.role);
                }
            } else {
                setUserRole(null);
            }
        };
        fetchUserRole();
    }, [user]);
    */

    const [provinces, setProvinces] = useState<Location[]>([]);
    const [regencies, setRegencies] = useState<Location[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedRegency, setSelectedRegency] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

    // const villagesRef = collection(firestore, "villages");
    const [villages, setVillages] = useState<any[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const parseLocation = (name: string) => {
        const match = name.match(/^(KABUPATEN|KOTA|KAB\.?)\s+(.*)/i);
        if (match) {
            const rawType = match[1].toUpperCase();
            const normalizedType = rawType.includes('KOTA') ? 'KOTA' : 'KABUPATEN';
            return { type: normalizedType, coreName: match[2].trim().toUpperCase() };
        }
        return { type: null, coreName: name.trim().toUpperCase() };
    };

    const handleFetchProvinces = async () => {
        try {
            const provincesData: Location[] = await getProvinces();
            setProvinces(provincesData);
        } catch (error) {
            console.error("Error fetching provinces:", error);
        }
    };

    const handleFetchRegencies = async (provinceId: string) => {
        try {
            const regenciesData = await getRegencies(provinceId);
            const formattedRegencies = regenciesData.map((reg) => {
                const { type, coreName } = parseLocation(reg.name);
                // Type First Format: "KABUPATEN BEKASI" or "KOTA BEKASI"
                return {
                    ...reg,
                    name: type ? `${type} ${coreName}` : reg.name,
                };
            });
            setRegencies(formattedRegencies);
        } catch (error) {
            console.error("Error fetching regencies:", error);
        }
    };

    useEffect(() => {
        handleFetchProvinces();
    }, []);

    const handleProvinceChange = (
        selected: { label: string; value: string } | null
    ) => {
        if (selected && selected.value !== "") {
            setSelectedProvince(selected.label);
            setSelectedRegency("");
            setRegencies([]);
            handleFetchRegencies(selected.value);
        } else {
            setSelectedProvince("");
            setSelectedRegency("");
            setRegencies([]);
        }
    };

    const handleRegencyChange = (
        selected: { label: string; value: string } | null
    ) => {
        if (selected && selected.value !== "") {
            setSelectedRegency(selected.label);
        } else {
            setSelectedRegency("");
        }
    };

    const [isFetched, setIsFetched] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            /*
            const snapShot = await getDocs(villagesRef);
            const villagesData = snapShot.docs.map((doc) => {
                const data = doc.data();
                return {
                    ...data,
                    provinsi: data.lokasi?.provinsi?.label || "",
                    kabupatenKota: data.lokasi?.kabupatenKota?.label || "",
                    namaDesa: data.lokasi?.desaKelurahan?.label || "",
                    status: data.status,
                };
            })
                .filter((item) => item.status === 'Terverifikasi');
            */
            try {
                const response: any = await getVillages({
                    status: "Terverifikasi",
                    search: debouncedSearchTerm || undefined,
                    provinsi: selectedProvince || undefined,
                    kabupatenKota: selectedRegency || undefined,
                });
                const fetchedVillages = response.villages || response.data || [];
                const villagesData = fetchedVillages.map((item: any) => ({
                    ...item,
                    provinsi: item.lokasi?.provinsi?.label || item.provinsi || "",
                    kabupatenKota: item.lokasi?.kabupatenKota?.label || item.kabupatenKota || item.kabupaten || "",
                    namaDesa: item.lokasi?.desaKelurahan?.label || item.namaDesa || item.desa || "",
                }));
                setVillages(villagesData);
                setIsFetched(true);
            } catch (error) {
                console.error("Error fetching villages from API:", error);
            }
        };
        fetchData();
    }, [debouncedSearchTerm, selectedProvince, selectedRegency]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, selectedProvince, selectedRegency]);

    // Calculate paginated data
    const totalPages = Math.ceil(villages.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedVillages = villages.slice(startIndex, endIndex);

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    if (!isFetched) {
        return <Loading />;
    }

    return (
        <Container px={0} pb={70}>
            <Hero />
            <Containers>
                <CardContent>
                    <Column1>
                        <Column2>
                            <Text>{t("selectProvince")}</Text>
                            <BottomSheetSelector
                                title="Pilih Provinsi"
                                placeholder={t("selectProvince")}
                                options={provinces.map(p => ({ label: p.name, value: p.id }))}
                                value={selectedProvince}
                                onChange={(value, label) => handleProvinceChange({ label, value })}
                                searchPlaceholder="Cari provinsi di sini..."
                            />
                        </Column2>
                        <Column2>
                            <Text>{t("selectRegency")}</Text>
                            <BottomSheetSelector
                                title="Pilih Kabupaten / Kota"
                                placeholder={t("selectRegency")}
                                options={regencies.map(r => ({ label: r.name, value: r.id }))}
                                value={selectedRegency}
                                onChange={(value, label) => handleRegencyChange({ label, value })}
                                searchPlaceholder="Cari kabupaten / kota di sini..."
                                disabled={!selectedProvince}
                            />
                        </Column2>
                    </Column1>
                    <Column1>
                        <SearchBarVil
                            placeholder={t("searchPlaceholder")}
                            onChange={(keyword: string) => setSearchTerm(keyword)}
                        />
                    </Column1>
                </CardContent>
                <Text>
                    {t("showAll")}{" "}
                    <Texthighlight>
                        {selectedProvince || selectedRegency
                            ? `${selectedProvince}${selectedProvince && selectedRegency ? ", " : ""}${selectedRegency}`
                            : t("allProvince")}
                    </Texthighlight>
                </Text>
                <GridContainer>
                    {villages.length > 0 ? (
                        paginatedVillages.map((item: any, idx: number) => (
                            <CardVillage
                                key={idx}
                                provinsi={item.provinsi}
                                kabupatenKota={item.kabupatenKota}
                                namaDesa={item.namaDesa}
                                logo={item.logo || defaultLogo}
                                header={item.header || defaultHeader}
                                id={item.userId}
                                jumlahInovasiDiterapkan={item.jumlahInovasiDiterapkan}
                                isHome={false}
                                highlightQuery={searchTerm}
                                onClick={() => {
                                    router.push(`/village/detail/${item.userId || item.id}`);
                                }}
                            />
                        ))
                    ) : (
                        <Box gridColumn="1 / -1" textAlign="center" py={10}>
                            <Text color="gray.500">Tidak ada desa yang ditemukan</Text>
                        </Box>
                    )}
                </GridContainer>
                {totalPages > 1 && (
                    <Flex justify="center" mt={2} mb={2} align="center" gap={4}>
                        <Button
                            onClick={handlePrevPage}
                            isDisabled={currentPage === 1}
                            variant="outline"
                            size="sm"
                            borderColor="gray.200"
                            color="#347357"
                            _hover={{ bg: "gray.50" }}
                        >
                            <ChevronLeftIcon />
                        </Button>
                        <ChakraText fontSize="14px" fontWeight="500" color="gray.700">
                            Halaman {currentPage} dari {totalPages}
                        </ChakraText>
                        <Button
                            onClick={handleNextPage}
                            isDisabled={currentPage === totalPages}
                            variant="outline"
                            size="sm"
                            borderColor="gray.200"
                            color="#347357"
                            _hover={{ bg: "gray.50" }}
                        >
                            <ChevronRightIcon />
                        </Button>
                    </Flex>
                )}
            </Containers>
        </Container>
    );
};

export default Village;
