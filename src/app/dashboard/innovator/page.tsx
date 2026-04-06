"use client";

import dynamic from "next/dynamic";
import Container from "Components/container";
import TopBar from "Components/topBar";
import Header from "src/components/dashboard/innovator/header";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";

// Dynamic import untuk komponen yang pakai window/browser API
const InfoCards = dynamic(() => import("src/components/dashboard/innovator/infoCards"), { ssr: false });
const TopVillages = dynamic(() => import("src/components/dashboard/innovator/topVillages"), { ssr: false });
const TopInnovations = dynamic(() => import("src/components/dashboard/innovator/topInnovations"), { ssr: false });
const TableInnovator = dynamic(() => import("src/components/dashboard/innovator/categoryInnovation"), { ssr: false });
const MapVillages = dynamic(() => import("src/components/dashboard/innovator/mapVillages"), { ssr: false });
const BarChartInnovator = dynamic(() => import("src/components/dashboard/innovator/barchartInnovator"), { ssr: false });

const DashboardInnovator = () => {
    const router = useRouter();
    const auth = getAuth();
    const user = auth.currentUser;
    const userName = user?.displayName || "Inovator";

    return (
        <Container page>
            <TopBar
                title={`Dashboard ${userName}`}
                onBack={() => router.back()}
            />
            <Header description="KMS Desa Digital" text="Indonesia" />

            <InfoCards />
            <TopInnovations />
            <TopVillages />
            <TableInnovator />
            <MapVillages />
            <BarChartInnovator />
        </Container>
    );
};

export default DashboardInnovator;
