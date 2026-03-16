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

import { Image } from "@chakra-ui/react";
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
            default: return cat;
        }
    };

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <Container page>
            <TopBar title={getTranslatedCategory(category)} onBack={() => router.back()} />
            <CategoryContainer>
                {loading ? (
                   <DetailContainer>
                       {[1,2,3].map(i => (
                           <Skeleton key={i} height={150} borderRadius={8} style={{ marginBottom: 12 }} />
                       ))}
                   </DetailContainer>
                ) : data.length === 0 ? (
                    <p>{t("notFound")}</p>
                ) : (
                    <DetailContainer>
                        {data.map((item, idx) => (
                            <CardInnovation
                                key={idx}
                                {...item}
                                innovatorLogo={
                                    item.innovatorImgURL || (
                                         <Image src="/images/default-logo.svg" alt="logo" width='20px' height='20px' objectFit='cover' borderRadius="50%" />
                                    )
                                }
                                innovatorName={item.namaInnovator}
                                onClick={() =>
                                    router.push(`/innovation/detail/${item.id}`)
                                }
                            />
                        ))}
                    </DetailContainer>
                )}
            </CategoryContainer>
        </Container>
    );
}
