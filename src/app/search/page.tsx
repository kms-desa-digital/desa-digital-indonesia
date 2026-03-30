"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import { firestore } from "src/firebase/clientApp";
// import { collection, getDocs } from "firebase/firestore";
import { getInnovation } from "Services/innovationServices";
import CardInnovation from "Components/card/innovation";
import { paths } from "Consts/path";
import Container from "Components/container";
import TopBar from "Components/topBar";
import { Box, Heading, Text, Flex } from "@chakra-ui/react";
import SearchBarLink from "src/components/home/search/SearchBarLink";
import { debounce } from "lodash";

interface InovationData {
    id: string;
    namaInovasi?: string;
    kategori?: string;
    deskripsi?: string;
    tahunDibuat?: string;
    images?: string[];
    innovatorLogo?: string;
    innovatorName?: string;
    manfaat?: { deskripsi: string }[];
    status?: string;
    [key: string]: any;
}

function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSearchTerm = searchParams.get("q")?.toLowerCase().trim() || "";
    const [results, setResults] = useState<InovationData[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState(initialSearchTerm);
    const [role] = useState("user");
    const key = searchParams.toString(); // Use search params as key to re-render if needed

    // Debounced fetch and filter function
    const fetchData = debounce(async (keyword: string) => {
        setLoading(true);
        setResults([]);

        try {
            /*
            const collectionRef = collection(firestore, "innovations");
            const snapshot = await getDocs(collectionRef);
            ... Firestore Logic ...
            */
            const res: any = await getInnovation();
            const innovations = res.innovations || [];

            const filtered = innovations
                .filter((item: any) => {
                    const namaInovasi = (item.namaInovasi || "").toLowerCase().trim();
                    const isVerified = item.status === "Terverifikasi";

                    if (!isVerified) return false;
                    if (!namaInovasi) return false;
                    return keyword ? namaInovasi.includes(keyword) : isVerified;
                })
                .sort((a: any, b: any) => (a.namaInovasi || "").localeCompare(b.namaInovasi || ""));

            setResults(filtered);
        } catch (error) {
            console.error("Error fetching data via API:", error);
        }

        setLoading(false);
    }, 300);

    // Run debounced fetch when searchValue changes
    useEffect(() => {
        fetchData(searchValue.toLowerCase().trim());
        return () => fetchData.cancel();
    }, [searchValue]);

    // Reset scroll position on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleCardClick = (id: string) => {
        const destination = `/innovation/detail/${id}`; // paths.INNOVATION_DETAIL replacement
        // logic user role
        if (role === "innovator") {
            router.push(destination);
        } else {
            router.push(destination);
        }
    };

    const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            setSearchValue(e.currentTarget.value.trim());
            router.push(`/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
        }
    };

    return (
        <Container page>
            <TopBar
                title="Hasil Pencarian"
                onBack={() => router.push("/")}
            />
            <Box px={5} py={8} >
                <SearchBarLink
                    key={key}
                    placeholderText="Cari Inovasi di sini..."
                    value={searchValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                    width="100%"
                    maxW="100%"
                />

                <Flex align="center" mb={2} mt={6}>
                    <Heading fontSize="15px" fontWeight="800" color="gray.700">
                        Hasil Pencarian: "{searchValue || 'Semua Inovasi'}"
                    </Heading>
                </Flex>

                {loading ? (
                    <Text color="gray.500" fontSize="12px">
                        Sedang mencari...
                    </Text>
                ) : results.length === 0 ? (
                    <Text fontSize="12px" color="gray.500">
                        Tidak ada inovasi yang ditemukan.
                    </Text>
                ) : (
                    <Box
                        display="grid"
                        gridTemplateColumns={{
                            base: "1fr",
                            sm: "repeat(2, 1fr)",
                            md: "repeat(2, 1fr)",
                        }}
                        gap={4}
                        mt={3}
                    >
                        {results.map((item) => (
                            <CardInnovation
                                key={item.id}
                                images={item.images}
                                namaInovasi={item.namaInovasi}
                                kategori={item.kategori}
                                deskripsi={item.deskripsi}
                                tahunDibuat={item.tahunDibuat}
                                innovatorLogo={item.innovatorLogo}
                                innovatorName={item.innovatorName}
                                onClick={() => handleCardClick(item.id)}
                            />
                        ))}
                    </Box>
                )}
            </Box>
        </Container>
    );
}

export default SearchPage;
