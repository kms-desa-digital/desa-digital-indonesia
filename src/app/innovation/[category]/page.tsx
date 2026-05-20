"use client";

import React, { useEffect, useState } from "react";
import TopBar from "Components/topBar";
import Container from "Components/container";
import CardInnovation from "Components/card/innovation";
import { useRouter, useParams } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import {
    DetailContainer,
    Container as CategoryContainer
} from "../_styles";
// import { getDocuments, getDocumentById } from "src/firebase/inovationTable";
// import { DocumentData } from "firebase/firestore";
import { getInnovationByCategory } from "Services/innovationServices";

import { Image, Input, InputGroup, InputLeftElement, Icon, Box, Flex } from "@chakra-ui/react";
import { FiSearch } from "react-icons/fi";
import Loading from "Components/loading";
import { useTranslations } from "next-intl";

export default function InnovationCategoryPage() {
    const t = useTranslations("Innovation");
    const tc = useTranslations("Categories");
    const router = useRouter();
    const params = useParams();
    const category = decodeURIComponent(params.category as string);

    const getTranslatedCategory = (cat: string) => {
        switch (cat) {
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
            default: return cat;
        }
    };

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        setLoading(true);
        getInnovationByCategory(category)
            .then((res: any) => {
                setData(res.innovations || []);
            })
            .catch((error) => {
                console.error("Error fetching innovation details:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [category]);

    if (loading) return <Loading />;

    return (
        <Container page>
            <TopBar title={getTranslatedCategory(category)} onBack={() => router.back()} />
            <Box mt="12px" px="16px">
                <Box mb="16px" mt="16px" bg="white" pb="8px" pt="10px">
                    <InputGroup>
                        <InputLeftElement pointerEvents="none" height="40px">
                            <Icon as={FiSearch} color="gray.400" />
                        </InputLeftElement>
                        <Input
                            placeholder="Cari inovasi di sini..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            borderRadius="full"
                            fontSize="14px"
                            bg="#F9FAFB"
                            border="1px solid #E5E7EB"
                            height="40px"
                        />
                    </InputGroup>
                </Box>
                <DetailContainer>
                    {data
                        .filter((item) =>
                            category === "Semua Kategori Inovasi" || item.kategori === category
                        )
                        .filter((item) =>
                            item.namaInovasi?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((item, idx) => (
                            <CardInnovation
                                key={idx}
                                {...item}
                                jumlahDesa={item.appliedVillages?.length || item.jumlahDesaDiterapkan || item.jumlahDesa || 0}
                                innovatorLogo={
                                    item.innovatorImgURL || item.logoInovator || item.logo || (
                                        <Image src="/images/default-logo.svg" alt="logo" width='20px' height='20px' objectFit='cover' borderRadius="50%" />
                                    )
                                }
                                innovatorName={item.namaInnovator || item.namaInovator}
                                onClick={() =>
                                    router.push(`/innovation/detail/${item.id || item._id}`)
                                }
                            />
                        ))}
                </DetailContainer>
                <Box height="40px" />
            </Box>
        </Container>
    );
}
