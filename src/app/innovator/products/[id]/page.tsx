"use client";

import React, { useEffect, useState } from "react";
import { Flex, SimpleGrid, Spinner, Box, Input, InputGroup, InputLeftElement, InputRightElement } from "@chakra-ui/react";
import { SearchIcon, CloseIcon } from "@chakra-ui/icons";
import { useTranslations } from "next-intl";
import CardInnovation from "Components/card/innovation";
import TopBar from "Components/topBar";
import Container from "Components/container";
import { useRouter, useParams } from "next/navigation";
import { getInnovation } from "Services/innovationServices";
import { getInnovatorById } from "Services/innovatorServices";

const InnovatorProductsPage = () => {
    const t = useTranslations("Innovator");
    const tHome = useTranslations("Home");
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [innovations, setInnovations] = useState<any[]>([]);
    const [filteredInnovations, setFilteredInnovations] = useState<any[]>([]);
    const [innovatorName, setInnovatorName] = useState("Inovator");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch innovator name for title
                if (id) {
                    const invRes: any = await getInnovatorById(id);
                    const invData = invRes?.innovator || invRes?.data;
                    if (invData?.namaInovator) {
                        setInnovatorName(invData.namaInovator);
                    }
                }
                
                const res = await getInnovation({ innovatorId: id });
                const data = res?.innovations || res?.data || [];
                setInnovations(data);
                setFilteredInnovations(data);
            } catch (error) {
                console.error("Error fetching innovations via API:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredInnovations(innovations);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredInnovations(
                innovations.filter((item: any) =>
                    (item.namaInovasi || "").toLowerCase().includes(lower) ||
                    (item.kategori || "").toLowerCase().includes(lower) ||
                    (item.deskripsi || "").toLowerCase().includes(lower)
                )
            );
        }
    }, [searchTerm, innovations]);

    return (
        <Container page>
            <TopBar title={t("productsTitle", { name: innovatorName })} onBack={() => router.back()} />
            <Flex direction="column" p={4}>
                <InputGroup mb={4}>
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

                {loading ? (
                    <Flex justify="center" align="center" minH="200px">
                        <Spinner />
                    </Flex>
                ) : filteredInnovations.length === 0 ? (
                    <Box textAlign="center" mt={10} color="gray.500">
                        {searchTerm ? tHome("searchEmpty") : t("noInnovations")}
                    </Box>
                ) : (
                    <SimpleGrid columns={2} spacing={4}>
                        {filteredInnovations.map((innovation: any, idx: number) => (
                            <CardInnovation
                                key={idx}
                                images={innovation.images}
                                namaInovasi={innovation.namaInovasi}
                                kategori={innovation.kategori}
                                deskripsi={innovation.deskripsi}
                                tahunDibuat={innovation.tahunDibuat}
                                innovatorLogo={innovation.innovatorImgURL}
                                innovatorName={innovation.namaInnovator || innovatorName}
                                jumlahDesa={innovation.jumlahDesa || 0}
                                onClick={() => router.push(`/innovation/detail/${innovation.id}`)}
                            />
                        ))}
                    </SimpleGrid>
                )}
            </Flex>
        </Container>
    );
};

export default InnovatorProductsPage;
