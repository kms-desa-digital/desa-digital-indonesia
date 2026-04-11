"use client";

import React, { useEffect, useState } from "react";
import { paths } from "Consts/path";
import TopBar from "Components/topBar";
import Container from "Components/container";
import CardCategory from "Components/card/category";
import { useRouter } from "next/navigation";
import { useQuery } from "react-query";
import { getCategories } from "Services/categoryServices";
import Loading from "Components/loading";
import { Container as CategoryContainer } from "./_styles";
import { useTranslations } from "next-intl";

type ListProps = {
    data: any;
    isFetched: boolean;
    isLoading: boolean;
};

function List(props: ListProps) {
    const { data, isFetched, isLoading } = props;
    const tc = useTranslations("Categories");

    const router = useRouter();
    const [menu, setMenu] = useState<any[]>([]);

    const handleClick = (category: string) => {
        router.push(`/innovation/${category}`);
    };

    const getTranslatedTitle = (title: string) => {
        switch (title) {
            case "Pertanian Cerdas": return tc("smartAgri");
            case "Pemasaran Agri-Food dan E-Commerce": return tc("agriFood");
            case "E-Government": return tc("eGovernment");
            case "Sistem Informasi": return tc("infoSystem");
            case "Infrastruktur Lokal": return tc("localInfra");
            case "Semua Kategori Inovasi": return tc("allInno");
            case "Pengembangan Masyarakat dan Ekonomi": return tc("communityDev");
            case "Layanan Keuangan": return tc("financialService");
            case "Pengelolaan Sumber Daya": return tc("resourceMgmt");
            case "Layanan Sosial": return tc("socialService");
            case "E-Tourism": return tc("eTourism");
            default: return title;
        }
    };

    useEffect(() => {
        if (isFetched) {
            const categoriesData = data?.categories || data || [];
            // Filter out "Semua Kategori Inovasi" (Lihat Semua) as requested
            const filtered = Array.isArray(categoriesData)
                ? categoriesData.filter((item: any) => 
                    item.title !== "Semua Kategori Inovasi" && 
                    item.title !== "Lihat Semua"
                )
                : [];
            setMenu(filtered);
        }
    }, [isFetched, data]);

    return (
        <>
            {isLoading && <Loading />}
            {isFetched &&
                menu.map((item: any, idx: number) => (
                    <CardCategory
                        {...item}
                        title={getTranslatedTitle(item.title)}
                        key={idx}
                        onClick={() => handleClick(item.title)}
                    />
                ))}
        </>
    );
}

export default function InnovationPage() {
    const t = useTranslations("Innovation");
    const router = useRouter();
    const { data, isFetched, isLoading } = useQuery("category", getCategories);

    const listProps = {
        data,
        isFetched,
        isLoading,
    };

    return (
        <Container page>
            <TopBar title={t("title")} onBack={() => router.back()} />
            <CategoryContainer>
                <List {...listProps} />
            </CategoryContainer>
        </Container>
    );
}
