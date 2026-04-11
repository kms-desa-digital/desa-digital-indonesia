"use client";

import Hero from "Components/innovator/hero";
import { useRouter } from "next/navigation";
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
import { useEffect, useState } from "react";
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

export default function InnovatorPage() {
    const t = useTranslations("Innovator");
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
    const [innovatorsShowed, setInnovatorsShowed] = useState<InnovatorData[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string>("Semua Kategori");
    const [isFetched, setIsFetched] = useState(false);

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
                setInnovatorsShowed(Array.isArray(innovatorsData) ? innovatorsData : []);
            } catch (error) {
                console.error("Error fetching innovators from MongoDB API:", error);
            } finally {
                setIsFetched(true);
            }
        };
        fetchData();
    }, [debouncedSearchQuery, categoryFilter]);

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
                        />
                        <SearchBarInnov
                            placeholder={t("searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setSearchQuery(e.target.value);
                            }}
                        />
                    </Column>
                </CardContent>
                <Text>
                    {" "}
                    {t("showAll")}{" "}
                    <Texthighlight> "{currentCategoryLabel}" </Texthighlight>{" "}
                </Text>
                <GridContainer>
                    {innovatorsShowed.map((item: any, idx: number) => (
                        <CardInnovator
                            key={item.id}
                            {...item}
                            highlightQuery={searchQuery}
                            onClick={() =>
                                // navigate(generatePath(paths.INNOVATOR_PROFILE_PAGE, { id: item.id }))
                                router.push(`/innovator/profile/${item.id}`)
                            }
                        />
                    ))}
                </GridContainer>
            </Containers>
        </Container>
    );
}
