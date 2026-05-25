"use client";

import Hero from "Components/innovator/hero";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Text as ChakraText, Flex } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
    GridContainer,
    CardContent,
    Containers,
    Text,
    Texthighlight,
    Column
} from "./_styles";
import CardInnovator from "Components/card/innovator";
import BottomSheetSelector from "Components/form/BottomSheetSelector";
import SearchBarInnov from "Components/innovator/hero/SearchBarInnov";
import { useEffect, useState, useRef, Suspense } from "react";
import Pagination from "Components/common/Pagination";
import Container from "Components/container";
import { useTranslations } from "next-intl";
import { getInnovators } from "Services/innovatorServices";
import Loading from "Components/loading";

type InnovatorData = {
    id: string;
    namaInovator: string;
    kategori: string;
    logo: string;
    header: string;
    deskripsi: string;
    jumlahInovasi: number;
    jumlahDesaDampingan: number;
    status: string;
};

function Innovator() {
    const t = useTranslations("Innovator");
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialPage = parseInt(searchParams.get("page") || "1", 10);
    const initialCategory = searchParams.get("category") || "Semua Kategori";
    const initialSearch = searchParams.get("search") || "";

    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(initialSearch);
    const [innovatorsShowed, setInnovatorsShowed] = useState<InnovatorData[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory);
    const [isFetched, setIsFetched] = useState(false);

    const isFirstMount = useRef(true);

    const updateUrl = (page: number, category: string, search: string) => {
        const urlParams = new URLSearchParams();
        if (page > 1) urlParams.set("page", page.toString());
        if (category && category !== "Semua Kategori") urlParams.set("category", category);
        if (search) urlParams.set("search", search);
        
        const queryString = urlParams.toString();
        const newPath = queryString ? `?${queryString}` : window.location.pathname;
        router.replace(newPath, { scroll: false });
    };

    const categories = [
        { label: t("allCategory"), value: "Semua Kategori" },
        { label: t("categories.startup"), value: "Start-up" },
        { label: t("categories.govUnder"), value: "Di bawah Pemerintah" },
        { label: t("categories.govLocal"), value: "Pemerintah Daerah" },
        { label: t("categories.agribisnis"), value: "Agribisnis" },
        { label: t("categories.company"), value: "Perusahaan" },
        { label: t("categories.agriOrg"), value: "Organisasi Pertanian" },
        { label: t("categories.financial"), value: "Layanan Finansial" },
        { label: t("categories.ngo"), value: "Lembaga Swadaya Masyarakat (LSM)" },
        { label: t("categories.academic"), value: "Akademisi" },
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            updateUrl(currentPage, categoryFilter, searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res: any = await getInnovators({
                    status: "Terverifikasi",
                    search: debouncedSearchQuery || undefined,
                    kategori: categoryFilter === "Semua Kategori" ? undefined : categoryFilter,
                });
                const innovatorsData = res?.data || res?.innovators || [];
                const sortedInnovators = (Array.isArray(innovatorsData) ? innovatorsData : [])
                    .sort((a: any, b: any) => {
                        const desa = (Number(b.jumlahDesaDampingan) || 0) - (Number(a.jumlahDesaDampingan) || 0);
                        if (desa !== 0) return desa;
                        const inovasi = (Number(b.jumlahInovasi) || 0) - (Number(a.jumlahInovasi) || 0);
                        if (inovasi !== 0) return inovasi;
                        return (a.namaInovator || "").localeCompare(b.namaInovator || "");
                    });
                setInnovatorsShowed(sortedInnovators);
            } catch (error) {
                console.error("Error fetching innovators from MongoDB API:", error);
            } finally {
                setIsFetched(true);
            }
        };
        fetchData();
    }, [debouncedSearchQuery, categoryFilter]);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        setCurrentPage(1);
        updateUrl(1, categoryFilter, searchQuery);
    }, [debouncedSearchQuery, categoryFilter]);

    // Calculate paginated data
    const totalPages = Math.ceil(innovatorsShowed.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedInnovators = innovatorsShowed.slice(startIndex, endIndex);

    const handlePrevPage = () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            setCurrentPage(prevPage);
            updateUrl(prevPage, categoryFilter, searchQuery);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            updateUrl(nextPage, categoryFilter, searchQuery);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    if (!isFetched) {
        return <Loading />;
    }

    const currentCategoryLabel = categories.find(c => c.value === categoryFilter)?.label || categoryFilter;

    return (
        <Container px={0} pb={70}>
            <Hero />
            <Containers>
                <CardContent>
                    <Column>
                        <Text>{t("selectInnovator")}</Text>
                        <BottomSheetSelector
                            title="Pilih Kategori Inovator"
                            placeholder="Pilih Kategori"
                            options={categories}
                            value={categoryFilter}
                            onChange={(value, label) => setCategoryFilter(value)}
                            searchPlaceholder="Cari kategori inovator di sini..."
                            showAllOption={false}
                        />
                        <SearchBarInnov
                            placeholder={t("searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setSearchQuery(e.target.value);
                            }}
                            onClear={() => setSearchQuery("")}
                        />
                    </Column>
                </CardContent>
                <Text>
                    {" "}
                    {t("showAll")}{" "}
                    <Texthighlight> "{currentCategoryLabel}" </Texthighlight>{" "}
                </Text>
                <GridContainer>
                    {paginatedInnovators.map((item: any, idx: number) => (
                        <CardInnovator
                            key={item.id}
                            {...item}
                            highlightQuery={searchQuery}
                            ranking={searchQuery.trim() ? undefined : (startIndex + idx + 1)}
                            onClick={() =>
                                // navigate(generatePath(paths.INNOVATOR_PROFILE_PAGE, { id: item.id }))
                                router.push(`/innovator/profile/${item.id}`)
                            }
                        />
                    ))}
                </GridContainer>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                        setCurrentPage(page);
                        updateUrl(page, categoryFilter, searchQuery);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                />
            </Containers>
        </Container>
    );
}

export default function InnovatorPage() {
    return (
        <Suspense fallback={<Loading />}>
            <Innovator />
        </Suspense>
    );
}
