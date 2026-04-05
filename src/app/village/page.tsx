"use client";

import { Box } from "@chakra-ui/react";
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
import Dropdown from "Components/village/Filter";
import Hero from "Components/village/hero";
import SearchBarVil from "Components/village/SearchBarVil";
import Container from "Components/container";
import Recommendation from "Components/village/Recommendation";
import { useTranslations } from "next-intl";

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
        if (selected) {
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
        if (selected) {
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

    return (
        <Container px={0} pb={70}>
            <Hero />
            <Containers>
                <CardContent>
                    <Column1>
                        <Column2>
                            <Text>{t("selectProvince")}</Text>
                            <Dropdown
                                placeholder={t("selectProvince")}
                                options={provinces}
                                onChange={handleProvinceChange}
                            />
                        </Column2>
                        <Column2>
                            <Text>{t("selectRegency")}</Text>
                            <Dropdown
                                placeholder={t("selectRegency")}
                                options={regencies}
                                onChange={handleRegencyChange}
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
                    {isFetched && villages &&
                        villages.map((item: any, idx: number) => (
                            <CardVillage
                                key={idx}
                                provinsi={item.provinsi}
                                kabupatenKota={item.kabupatenKota}
                                namaDesa={item.namaDesa}
                                logo={item.logo || defaultLogo}
                                header={item.header || defaultHeader}
                                id={item.userId}
                                isHome={false}
                                highlightQuery={searchTerm}
                                onClick={() => {
                                    router.push(`/village/detail/${item.userId || item.id}`);
                                }}
                            />
                        ))}
                </GridContainer>
            </Containers>
        </Container>
    );
};

export default Village;
