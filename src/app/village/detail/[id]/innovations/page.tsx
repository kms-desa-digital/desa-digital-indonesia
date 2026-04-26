"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import TopBar from "Components/topBar";
import Container from "Components/container";
import CardInnovation from "Components/card/innovation";
import { useRouter, useParams } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import {
    DetailContainer,
    Container as CategoryContainer
} from "@/app/innovation/_styles";
import { getVillageInnovations, getVillageById } from "Services/villageServices";
import { Image as ChakraImage } from "@chakra-ui/react";

export default function VillageAppliedInnovationsPage() {
    const t = useTranslations("Innovation");
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [data, setData] = useState<any[]>([]);
    const [villageName, setVillageName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        const fetchData = async () => {
            try {
                const resVillage: any = await getVillageById(id);
                const villageData = resVillage.village || resVillage.data;
                if (villageData) {
                    setVillageName(villageData.namaDesa);
                }

                const resInno: any = await getVillageInnovations(id);
                setData(resInno.innovations || resInno.data || []);
            } catch (error) {
                console.error("Error fetching village innovations:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    return (
        <Container page>
            <TopBar title={`${t("appliedInnovations")} - ${villageName}`} onBack={() => router.back()} />
            <CategoryContainer>
                {loading ? (
                   <DetailContainer>
                       {[1,2,3,4].map(i => (
                           <Skeleton key={i} height={150} borderRadius={8} style={{ marginBottom: 12 }} />
                       ))}
                   </DetailContainer>
                ) : data.length === 0 ? (
                    <p>{t("noInnovations")}</p>
                ) : (
                    <DetailContainer>
                        {data.map((item, idx) => (
                            <CardInnovation
                                key={idx}
                                {...item}
                                innovatorLogo={
                                    item.innovatorImgURL || (
                                         <ChakraImage src="/images/default-logo.svg" alt="logo" width='20px' height='20px' objectFit='cover' borderRadius="50%" />
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
