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
import { Image as ChakraImage, Box, Input, InputGroup, InputLeftElement, InputRightElement } from "@chakra-ui/react";
import { SearchIcon, CloseIcon } from "@chakra-ui/icons";

export default function VillageAppliedInnovationsPage() {
    const t = useTranslations("Innovation");
    const tHome = useTranslations("Home");
    const tVillage = useTranslations("Village");
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [data, setData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [villageName, setVillageName] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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
                const fetchedData = resInno.innovations || resInno.data || [];
                setData(fetchedData);
                setFilteredData(fetchedData);
            } catch (error) {
                console.error("Error fetching village innovations:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredData(data);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredData(
                data.filter((item: any) =>
                    (item.namaInovasi || "").toLowerCase().includes(lower) ||
                    (item.kategori || "").toLowerCase().includes(lower) ||
                    (item.deskripsi || "").toLowerCase().includes(lower)
                )
            );
        }
    }, [searchTerm, data]);

    return (
        <Container page>
            <TopBar title={`${t("appliedInnovations")} - ${villageName}`} onBack={() => router.back()} />
            <CategoryContainer>
                <Box px={4} pb={4} pt={2}>
                    <InputGroup>
                        <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                            placeholder={tHome("searchPlaceholder")}
                            size="md"
                            borderRadius="xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            bg="white"
                            boxShadow="sm"
                            border="1px solid"
                            borderColor="gray.200"
                            pr="40px"
                        />
                        {searchTerm && (
                            <InputRightElement>
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
                {loading ? (
                   <DetailContainer>
                       {[1,2,3,4].map(i => (
                           <Skeleton key={i} height={150} borderRadius={8} style={{ marginBottom: 12 }} />
                       ))}
                   </DetailContainer>
                ) : filteredData.length === 0 ? (
                    <Box textAlign="center" mt={6} color="gray.500">
                        {searchTerm ? tHome("searchEmpty") : tVillage("noInnovations")}
                    </Box>
                ) : (
                    <DetailContainer>
                        {filteredData.map((item, idx) => (
                            <CardInnovation
                                key={idx}
                                images={item.images}
                                namaInovasi={item.namaInovasi}
                                kategori={item.kategori}
                                deskripsi={item.deskripsi}
                                tahunDibuat={item.tahunDibuat}
                                innovatorLogo={
                                    item.innovatorImgURL || item.logoInovator || item.logo || item.innovatorLogo || "/images/default-logo.svg"
                                }
                                innovatorName={item.namaInnovator || item.namaInovator || item.innovatorName}
                                jumlahDesa={item.jumlahDesa || 0}
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
