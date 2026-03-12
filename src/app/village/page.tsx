"use client";

import { Box } from "@chakra-ui/react";
import CardVillage from "Components/card/village";
import { paths } from "Consts/path";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useQuery } from "react-query";
import { useRouter } from "next/navigation";
import { getUsers } from "Services/userServices";
import { auth, firestore } from "src/firebase/clientApp";
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

import { collection, DocumentData, getDocs, doc, getDoc } from "firebase/firestore";
import { getProvinces, getRegencies } from "src/services/locationServices";

interface Location {
    id: string;
    name: string;
}

const Village: React.FC = () => {
    const t = useTranslations("Village");
    const router = useRouter();
    const [user] = useAuthState(auth);
    const [userRole, setUserRole] = useState<string | null>(null);

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

    const [provinces, setProvinces] = useState<Location[]>([]);
    const [regencies, setRegencies] = useState<Location[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedRegency, setSelectedRegency] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");

    const villagesRef = collection(firestore, "villages");
    const [villages, setVillages] = useState<DocumentData[]>([]);

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

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const { data: users, isFetched } = useQuery<any>("villages", getUsers);

    useEffect(() => {
        const fetchData = async () => {
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
            setVillages(villagesData);
        };
        fetchData();
    }, []);

    const filteredVillages = villages.filter((item: any) => {
        const matchProvince =
            selectedProvince === "" || item.provinsi === selectedProvince;

        // Parse Selected Filter (e.g., "BEKASI (KABUPATEN)")
        let matchRegency = true;
        if (selectedRegency !== "") {
            // Selected format is "CORE (TYPE)"
            const selectedMatch = selectedRegency.match(/(.*)\s\((.*)\)/);
            if (selectedMatch) {
                const selectedCore = selectedMatch[1].toUpperCase();
                const selectedType = selectedMatch[2].toUpperCase(); // KABUPATEN or KOTA

                // Parse Item Data (e.g., "KABUPATEN BEKASI" or "BEKASI")
                const itemParsed = parseLocation(item.kabupatenKota);

                const coreMatch = itemParsed.coreName === selectedCore;

                // If item has a specific type (KOTA/KAB), it must match selected type.
                // If item has NO type (just "BEKASI"), we allow it to match (Ambiguous/Legacy data case).
                let typeMatch = true;
                if (itemParsed.type) {
                    // Normalize item type (KAB/KABUPATEN -> KABUPATEN)
                    const normItemType = itemParsed.type.includes('KOTA') ? 'KOTA' : 'KABUPATEN';
                    typeMatch = normItemType === selectedType;
                }

                matchRegency = coreMatch && typeMatch;
            } else {
                // Fallback if format is unexpected or manual entry
                const cleanItemRegency = item.kabupatenKota.replace(/^(KABUPATEN|KOTA|KAB\.?)\s+/i, "").trim();
                matchRegency = item.kabupatenKota === selectedRegency || cleanItemRegency.toLowerCase() === selectedRegency.toLowerCase();
            }
        }

        const matchSearch =
            searchTerm === "" ||
            item.namaDesa.toLowerCase().includes(searchTerm.toLowerCase());
        return matchProvince && matchRegency && matchSearch;
    });

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
                    {isFetched && filteredVillages &&
                        filteredVillages.map((item: any, idx: number) => (
                            <CardVillage
                                key={idx}
                                provinsi={item.provinsi}
                                kabupatenKota={item.kabupatenKota}
                                namaDesa={item.namaDesa}
                                logo={item.logo || defaultLogo}
                                header={item.header || defaultHeader}
                                id={item.userId}
                                isHome={false}
                                onClick={() => {
                                    router.push(`/village/profile/${item.userId}`);
                                }}
                            />
                        ))}
                </GridContainer>
            </Containers>
        </Container>
    );
};

export default Village;
