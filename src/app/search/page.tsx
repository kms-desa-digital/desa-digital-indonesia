"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getInnovation } from "Services/innovationServices";
import CardInnovation from "Components/card/innovation";
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

// Pisahkan logic ke komponen terpisah
const SearchContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSearchTerm = searchParams.get("q")?.toLowerCase().trim() || "";
    const [results, setResults] = useState<InovationData[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState(initialSearchTerm);
    const [role] = useState("user");
    const key = searchParams.toString();

    const sortByRelevance = (items: InovationData[], keyword: string) => {
        const normalizedKeyword = keyword.toLowerCase().trim();
        const scoreItem = (item: InovationData) => {
            const fields = [item.namaInovasi, item.innovatorName, item.namaInnovator, item.kategori, item.deskripsi]
                .filter(Boolean)
                .map((field) => String(field).toLowerCase());
            const title = fields[0] || "";
            if (title === normalizedKeyword) return 0;
            if (title.startsWith(normalizedKeyword)) return 1;
            if (fields.some((f) => f.includes(normalizedKeyword))) return 2;
            return 3;
        };
        return [...items].sort((a, b) => scoreItem(a) - scoreItem(b));
    };

    const fetchData = debounce(async (keyword: string) => {
        setLoading(true);
        setResults([]);
        try {
            const res: any = await getInnovation({ search: keyword || undefined, status: "Terverifikasi" });
            setResults(sortByRelevance(res.innovations || [], keyword));
        } catch (error) {
            console.error("Error fetching data via API:", error);
        }
        setLoading(false);
    }, 300);

    useEffect(() => {
        fetchData(searchValue.toLowerCase().trim());
        return () => fetchData.cancel();
    }, [searchValue]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleCardClick = (id: string) => {
        router.push(`/innovation/detail/${id}`);
    };

    const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            setSearchValue(e.currentTarget.value.trim());
            router.push(`/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
        }
    };

    return (
        <Container page>
            <TopBar title="Hasil Pencarian" onBack={() => router.push("/")} />
            <Box px={5} py={8}>
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
                    <Text color="gray.500" fontSize="12px">Sedang mencari...</Text>
                ) : results.length === 0 ? (
                    <Text fontSize="12px" color="gray.500">Tidak ada inovasi yang ditemukan.</Text>
                ) : (
                    <Box
                        display="grid"
                        gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(2, 1fr)" }}
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
                                highlightQuery={searchValue}
                                onClick={() => handleCardClick(item.id)}
                            />
                        ))}
                    </Box>
                )}
            </Box>
        </Container>
    );
};

// Komponen utama dengan Suspense
function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchContent />
        </Suspense>
    );
}

export default SearchPage;