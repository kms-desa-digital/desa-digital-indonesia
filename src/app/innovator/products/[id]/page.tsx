"use client";

import React, { useEffect, useState } from "react";
import { Flex, SimpleGrid, Spinner, Box } from "@chakra-ui/react";
import CardInnovation from "Components/card/innovation";
import TopBar from "Components/topBar";
import Container from "Components/container";
import { useRouter, useParams } from "next/navigation";
import { getInnovation } from "Services/innovationServices";
import { getInnovatorById } from "Services/innovatorServices";

const InnovatorProductsPage = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [innovations, setInnovations] = useState<any[]>([]);
    const [innovatorName, setInnovatorName] = useState("Inovator");
    const [loading, setLoading] = useState(true);

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

    return (
        <Container page>
            <TopBar title={`Produk Inovasi - ${innovatorName}`} onBack={() => router.back()} />
            <Flex direction="column" p={4}>
                {loading ? (
                    <Flex justify="center" align="center" minH="200px">
                        <Spinner />
                    </Flex>
                ) : innovations.length === 0 ? (
                    <Box textAlign="center" mt={10} color="gray.500">
                        Tidak ada inovasi.
                    </Box>
                ) : (
                    <SimpleGrid columns={[1, 2]} spacing={4}>
                        {innovations.map((innovation: any, idx: number) => (
                            <CardInnovation
                                key={idx}
                                images={innovation.images}
                                namaInovasi={innovation.namaInovasi}
                                kategori={innovation.kategori}
                                deskripsi={innovation.deskripsi}
                                tahunDibuat={innovation.tahunDibuat}
                                innovatorLogo={innovation.innovatorImgURL}
                                innovatorName={innovation.namaInnovator || innovatorName}
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
