"use client";

import React, { useEffect, useState } from "react";
import { Flex, Text, SimpleGrid, Spinner } from "@chakra-ui/react";
import CardInnovation from "Components/card/innovation";
import TopBar from "Components/topBar";
import Container from "Components/container";
import { useRouter } from "next/navigation";
// import { collection, getDocs, query, where } from "firebase/firestore";
// import { firestore } from "src/firebase/clientApp";
import { getInnovation } from "Services/innovationServices";

const InnovationListPage = () => {
    const router = useRouter();
    const [innovations, setInnovations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInnovations = async () => {
            try {
                setLoading(true);
                /*
                const q = query(collection(firestore, "innovations"), where("status", "==", "Terverifikasi"));
                const querySnapshot = await getDocs(q);
                ... Firestore Logic ...
                */
                const res = await getInnovation();
                // If API doesn't filter by status, we can filter locally or use a different endpoint
                const data = (res.innovations || []).filter((item: any) => item.status === "Terverifikasi");
                setInnovations(data);
            } catch (error) {
                console.error("Error fetching innovations via API:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInnovations();
    }, []);

    return (
        <Container page>
            <TopBar title="Semua Produk Inovasi" onBack={() => router.back()} />
            <Flex direction="column" p={4}>
                {/* <Text fontSize="20px" fontWeight="700" mb={4}>
            Semua Produk Inovasi
        </Text> */}
                {loading ? (
                    <Flex justify="center" align="center" minH="200px">
                        <Spinner />
                    </Flex>
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
                                innovatorName={innovation.namaInnovator}
                                onClick={() => router.push(`/innovation/detail/${innovation.id}`)}
                            />
                        ))}
                    </SimpleGrid>
                )}
            </Flex>
        </Container>
    );
};

export default InnovationListPage;
