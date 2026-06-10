"use client";

import React, { useEffect, useState } from "react";
import { paths } from "Consts/path";
import TopBar from "Components/topBar";
import Container from "Components/container";
import CardCategory from "Components/card/category";
import { useRouter } from "next/navigation";
import { useQuery } from "react-query";
import { getCategories } from "Services/categoryServices";
import { getInnovation } from "Services/innovationServices";
import Loading from "Components/loading";
import { Container as CategoryContainer } from "./_styles";
import { useTranslations } from "next-intl";
import { Input, InputGroup, InputLeftElement, InputRightElement, Icon, Box } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { FiSearch } from "react-icons/fi";

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
            case "Peternakan": return tc("farm");
            case "Kehutanan": return tc("forestry");
            case "Perikanan": return tc("fishery");
            case "Perkebunan": return tc("plantation");
            default: return title;
        }
    };

    const [searchTerm, setSearchTerm] = useState("");

    const [counts, setCounts] = useState<Record<string, number>>({});
    const { data: allInnovations } = useQuery("allInnovations", () => getInnovation({ status: "Terverifikasi" }));

    useEffect(() => {
        if (isFetched) {
            const categoriesData = data?.categories || data || [];
            const filtered = Array.isArray(categoriesData)
                ? categoriesData.filter((item: any) =>
                    item.title !== "Semua Kategori Inovasi" &&
                    item.title !== "Lihat Semua"
                )
                : [];
            setMenu(filtered);

            // Calculate counts from allInnovations if available
            const countMap: Record<string, number> = {};

            // Initial counts from categoriesData as fallback
            filtered.forEach((cat: any) => {
                countMap[cat.title] = cat.innovationCount || 0;
            });

            // If we have innovation data, use it for real counts
            if (allInnovations?.innovations) {
                const realInnovations = allInnovations.innovations;
                filtered.forEach((cat: any) => {
                    const realCount = realInnovations.filter((inv: any) => inv.kategori === cat.title || inv.category === cat.title).length;
                    countMap[cat.title] = realCount;
                });
            }

            setCounts(countMap);
        }
    }, [isFetched, data, allInnovations]);

    const filteredMenu = menu.filter((item: any) =>
        getTranslatedTitle(item.title).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box pt="10px">
            <Box px="16px" mb="16px" mt="16px" bg="white" pb="8px">
                <InputGroup>
                    <InputLeftElement pointerEvents="none" height="40px">
                        <Icon as={FiSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                        placeholder="Cari kategori inovasi di sini..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        borderRadius="full"
                        fontSize="14px"
                        bg="#F9FAFB"
                        border="1px solid #E5E7EB"
                        height="40px"
                        pr="40px"
                    />
                    {searchTerm && (
                        <InputRightElement height="40px">
                            <Box
                                as="button"
                                onClick={() => setSearchTerm("")}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                borderRadius="full"
                                bg="#6B7280"
                                color="white"
                                boxSize="18px"
                                _hover={{ bg: "gray.600" }}
                                _active={{ bg: "gray.700" }}
                                cursor="pointer"
                                mr="8px"
                            >
                                <CloseIcon w="6px" h="6px" />
                            </Box>
                        </InputRightElement>
                    )}
                </InputGroup>
            </Box>
            <Box px="16px" display="flex" flexDirection="column" gap="16px" pb="40px">
                {isFetched &&
                    filteredMenu.map((item: any, idx: number) => (
                        <CardCategory
                            {...item}
                            title={getTranslatedTitle(item.title)}
                            key={idx}
                            innovationCount={counts[item.title]}
                            onClick={() => handleClick(item.title)}
                        />
                    ))}
            </Box>
        </Box>
    );
}

export default function InnovationPage() {
    const t = useTranslations("Innovation");
    const router = useRouter();
    const { data, isFetched, isLoading } = useQuery("category", getCategories);

    if (isLoading) return <Loading />;

    return (
        <Container page>
            <TopBar title={t("title")} onBack={() => router.back()} />
            <List data={data} isFetched={isFetched} isLoading={isLoading} />
        </Container>
    );
}
