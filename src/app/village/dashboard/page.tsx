"use client";

import { useEffect, useState } from "react";
import { Box, Stack } from "@chakra-ui/react";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import Hero from "src/components/home/hero"; // Using path from pages if compatible
import TopBar from "Components/topBar";
import Rekomendasi from "Components/dashboard/village/rekomendasiDesa";
import PerkembanganInovasiDesa from "Components/dashboard/village/perkembanganInovasiDesa";
import KategoriInovasiDesa from "Components/dashboard/village/kategoriInovasi";
import Top5InovatorVillage from "Components/dashboard/village/top5Inovator2";
import TwoCard from "Components/dashboard/village/twoCard";
import DownloadReport from "Components/dashboard/village/downloadReport";

const DashboardPerangkatDesa: React.FC = () => {
    const [namaDesa, setNamaDesa] = useState<string>("Memuat...");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                console.error("❌ User belum login");
                setNamaDesa("User belum login");
                setLoading(false);
                return;
            }

            try {
                const token = await user.getIdToken();
                const response = await fetch('/api/villages/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setNamaDesa(data.desa?.namaDesa || "Desa Tidak Diketahui");
                } else {
                    setNamaDesa("Desa Tidak Ditemukan");
                }
            } catch (error) {
                console.error("❌ Error fetching desa data:", error);
                setNamaDesa("Gagal Memuat");
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <Box>
            <TopBar
                title="Dashboard"
                onBack={() => router.back()}
                rightElement={<DownloadReport />}
            />

            <Stack gap="16px" paddingTop="55px" />
            <Hero
                customTitle="Selamat Datang"
                description={loading ? "Memuat..." : namaDesa}
                text=""
                minHeight={115}
                gapSize={2}
            />
            <Rekomendasi />
            <TwoCard />
            <PerkembanganInovasiDesa />
            <KategoriInovasiDesa />
            <Top5InovatorVillage />
            <Box pb={5} />
        </Box>
    );
};

export default DashboardPerangkatDesa;
