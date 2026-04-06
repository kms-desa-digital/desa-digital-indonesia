"use client";

import dynamic from "next/dynamic";
import Container from "Components/container";
import TopBar from "Components/topBar";
import Header from "src/components/dashboard/ministry/header";
import { useRouter } from "next/navigation";
import LogoutButton from "Components/topBar/RightContent/LogoutButton";
import { getAuth } from "firebase/auth";

// Dynamic import untuk komponen yang pakai window/browser API
const InfoCards = dynamic(() => import("src/components/dashboard/ministry/infoCards"), { ssr: false });
const PieChartInnovation = dynamic(() => import("src/components/dashboard/ministry/categoryInnovation"), { ssr: false });
const PieChartInnovator = dynamic(() => import("src/components/dashboard/ministry/categoryInnovator"), { ssr: false });
const PieChartVillage = dynamic(() => import("src/components/dashboard/ministry/categoryVillage"), { ssr: false });
const BarChartMinistry = dynamic(() => import("src/components/dashboard/ministry/barChart"), { ssr: false });
const MapVillages = dynamic(() => import("src/components/dashboard/ministry/mapVillages"), { ssr: false });

const DashboardMinistry = () => {
    const router = useRouter();
    const auth = getAuth();
    const user = auth.currentUser;
    const userName = user?.displayName || "Kementerian";

    return (
        <Container page>
            <TopBar
                title={`Dashboard ${userName}`}
                rightElement={<LogoutButton />}
            />
            <Header description="KMS Desa Digital" text="Indonesia" />
            <InfoCards />
            <PieChartVillage />
            <PieChartInnovation />
            <PieChartInnovator />
            <MapVillages />
            <BarChartMinistry />
        </Container>
    );
};

export default DashboardMinistry;