"use client";

import React, { useState } from "react";
import {
    Box,
    Flex,
    Text,
    Stack,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Avatar,
    Badge,
    IconButton,
    Heading,
    Divider,
    useColorModeValue
} from "@chakra-ui/react";
import { ChevronLeft, Bell, CheckCircle2, XCircle, Info, Star, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import TopBar from "Components/topBar";

interface NotificationItem {
    id: string;
    title: string;
    description: string;
    date: string;
    type: "success" | "error" | "info" | "promo";
    isRead: boolean;
}

const NotificationPage = () => {
    const router = useRouter();
    const bgColor = useColorModeValue("white", "gray.800");
    const hoverBg = useColorModeValue("gray.50", "gray.700");

    const [generalNotifs, setGeneralNotifs] = useState<NotificationItem[]>([
        {
            id: "g1",
            title: "Aruna Hadir Disini!",
            description: "Aruna baru saja terdaftar di KMS Desa Digital Indonesia. Ayo cari tau inovasinya dan terapkan di desamu.",
            date: "12 Okt 24",
            type: "info",
            isRead: false
        },
        {
            id: "g2",
            title: "Ada yang Baru dari Efishery!",
            description: "Efishery baru saja menambahkan inovasi baru, yaitu Pakan Otomatis Efeeder. Ayo cari inovasinya dan terapkan di desamu.",
            date: "11 Okt 24",
            type: "promo",
            isRead: true
        },
        {
            id: "g3",
            title: "Desa Terbaik 3 Bulan Ini",
            description: "3 Bulan ini, Desa Soge menduduki peringkat pertama dalam peringkat penerapan inovasi. Selamat!",
            date: "10 Okt 24",
            type: "success",
            isRead: true
        }
    ]);

    const [personalNotifs, setPersonalNotifs] = useState<NotificationItem[]>([
        {
            id: "p1",
            title: "Profil Desa Terverifikasi",
            description: "Selamat! Profil desa telah diverifikasi. Sekarang akun ini sudah dapat mengklaim penerapan inovasi.",
            date: "12 Okt 24",
            type: "success",
            isRead: false
        },
        {
            id: "p2",
            title: "Pengajuan Klaim Inovasi Ditolak",
            description: "Pengajuan klaim inovasi ditolak dengan catatan: Data kurang detail. Silahkan ajukan kembali.",
            date: "09 Okt 24",
            type: "error",
            isRead: true
        }
    ]);

    const getIcon = (type: string) => {
        switch (type) {
            case "success": return <CheckCircle2 size={20} color="#10B981" />;
            case "error": return <XCircle size={20} color="#EF4444" />;
            case "promo": return <Star size={20} color="#F59E0B" />;
            default: return <Info size={20} color="#3B82F6" />;
        }
    };

    const NotificationCard = ({ notif }: { notif: NotificationItem }) => (
        <Box
            p={4}
            bg={notif.isRead ? bgColor : useColorModeValue("green.50", "green.900")}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={useColorModeValue("gray.100", "gray.700")}
            transition="all 0.2s"
            _hover={{ shadow: "md", transform: "translateY(-2px)", bg: hoverBg }}
            cursor="pointer"
            position="relative"
        >
            <Flex gap={4}>
                <Box mt={1}>
                    <Flex
                        w="40px"
                        h="40px"
                        bg={useColorModeValue("white", "gray.800")}
                        borderRadius="xl"
                        align="center"
                        justify="center"
                        shadow="sm"
                        borderWidth="1px"
                    >
                        {getIcon(notif.type)}
                    </Flex>
                </Box>
                <Box flex={1}>
                    <Flex justify="space-between" align="start" mb={1}>
                        <Text fontWeight="800" fontSize="15px" color={useColorModeValue("gray.800", "white")}>
                            {notif.title}
                        </Text>
                        {!notif.isRead && (
                            <Box w="8px" h="8px" bg="green.500" borderRadius="full" mt={1.5} />
                        )}
                    </Flex>
                    <Text fontSize="13px" color={useColorModeValue("gray.600", "gray.400")} mb={2} noOfLines={2}>
                        {notif.description}
                    </Text>
                    <Flex justify="space-between" align="center">
                        <Text fontSize="11px" color="gray.400" fontWeight="500">
                            {notif.date}
                        </Text>
                        <Flex align="center" gap={1} color="green.600">
                            <Text fontSize="11px" fontWeight="700">Lihat Detail</Text>
                            <ArrowRight size={12} />
                        </Flex>
                    </Flex>
                </Box>
            </Flex>
        </Box>
    );

    return (
        <Box bg={useColorModeValue("gray.50", "gray.900")} minH="100vh" pb={10}>
            <TopBar
                title="Notifikasi"
                onBack={() => router.back()}
            />

            <Box pt="70px" px={4}>
                <Tabs variant="soft-rounded" colorScheme="green" isFitted>
                    <TabList
                        bg={useColorModeValue("white", "gray.800")}
                        p={1.5}
                        borderRadius="full"
                        shadow="sm"
                        mb={6}
                    >
                        <Tab
                            borderRadius="full"
                            fontSize="13px"
                            fontWeight="700"
                            _selected={{ bg: "green.700", color: "white", shadow: "md" }}
                        >
                            Umum
                        </Tab>
                        <Tab
                            borderRadius="full"
                            fontSize="13px"
                            fontWeight="700"
                            _selected={{ bg: "green.700", color: "white", shadow: "md" }}
                        >
                            Pengajuan
                        </Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel p={0}>
                            <Stack spacing={3}>
                                {generalNotifs.length > 0 ? (
                                    generalNotifs.map(notif => (
                                        <NotificationCard key={notif.id} notif={notif} />
                                    ))
                                ) : (
                                    <EmptyState />
                                )}
                            </Stack>
                        </TabPanel>
                        <TabPanel p={0}>
                            <Stack spacing={3}>
                                {personalNotifs.length > 0 ? (
                                    personalNotifs.map(notif => (
                                        <NotificationCard key={notif.id} notif={notif} />
                                    ))
                                ) : (
                                    <EmptyState />
                                )}
                            </Stack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </Box>
    );
};

const EmptyState = () => (
    <Flex direction="column" align="center" justify="center" py={20} px={10} textAlign="center">
        <Box bg="white" p={6} borderRadius="full" shadow="lg" mb={6}>
            <Bell size={48} color="#E2E8F0" />
        </Box>
        <Heading fontSize="xl" mb={2}>Belum ada notifikasi</Heading>
        <Text color="gray.500" fontSize="sm">
            Semua pemberitahuan tentang aktivitas dan pengajuan Anda akan muncul di sini.
        </Text>
    </Flex>
);

export default NotificationPage;
