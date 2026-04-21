"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Flex,
    Text,
    Stack,
    IconButton,
    Heading,
    useColorModeValue,
    Spinner,
    Button,
    Container,
    Icon,
    Divider,
    Badge,
} from "@chakra-ui/react";
import {
    ChevronLeft, Trophy, Megaphone, Lightbulb,
    UserPlus, Star, Info, Calendar, ArrowRight,
    ExternalLink, CheckCircle, XCircle
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import TopBar from "Components/topBar";
import { useAuthToken } from "@/hooks/useAuthToken";

interface NotificationItem {
    id: string;
    userId: string;
    type: "general" | "personal";
    category?: 'ranking' | 'announcement' | 'innovation_recommendation' | 'new_innovator' | 'submission_status' | 'innovation_submission' | 'claim_submission' | 'profile_submission';
    title: string;
    description: string;
    isRead: boolean;
    actionType: string;
    relatedId: string | null;
    createdAt: string;
    actionUrl?: string;
}

const NotificationDetailPage = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { token, isLoaded } = useAuthToken();

    const [notif, setNotif] = useState<NotificationItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const bgColor = useColorModeValue("white", "gray.800");
    const pageBgColor = useColorModeValue("gray.50", "gray.900");
    const textColor = useColorModeValue("gray.800", "white");
    const descColor = useColorModeValue("gray.600", "gray.400");

    useEffect(() => {
        if (!isLoaded || !id) return;

        const fetchDetail = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/notifications/${id}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setNotif(data.notification);

                    // Mark as read if not already
                    if (!data.notification.isRead) {
                        fetch(`/api/notifications/${id}`, {
                            method: "PATCH",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json",
                            }
                        });
                    }
                } else {
                    setError("Notifikasi tidak ditemukan");
                }
            } catch (err) {
                setError("Gagal memuat detail notifikasi");
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id, token, isLoaded]);

    const getIcon = (category?: string, type?: string, titleStr: string = "") => {
        const title = titleStr.toLowerCase();

        // 1. Status Verifikasi untuk User
        if (title.includes('disetujui') || title.includes('terverifikasi') || title.includes('sukses')) {
            return <CheckCircle size={32} color="#10B981" />;
        }
        if (title.includes('ditolak') || title.includes('gagal') || title.includes('tolak')) {
            return <XCircle size={32} color="#EF4444" />;
        }

        // 2. Pengajuan Baru untuk Admin (Bintang)
        if (category === 'innovation_submission' || category === 'claim_submission' || category === 'profile_submission') {
            return <Star size={32} color="#F59E0B" />;
        }

        // 3. Kategori Khusus
        if (category === 'ranking') return <Trophy size={32} color="#EAB308" />;
        if (category === 'announcement') return <Megaphone size={32} color="#3B82F6" />;
        if (category === 'innovation_recommendation') return <Lightbulb size={32} color="#F59E0B" />;
        if (category === 'new_innovator') return <UserPlus size={32} color="#10B981" />;

        return type === "personal" ? <Star size={32} color="#F59E0B" /> : <Info size={32} color="#3B82F6" />;
    };

    const handleAction = () => {
        if (!notif) return;

        const pathMap: Record<string, string> = {
            innovation_detail: `/innovation/detail/${notif.relatedId}`,
            claim_detail: `/village/klaimInovasi/detail/${notif.relatedId}`,
            profile: `/village/profile/${notif.relatedId}`,
            dashboard: `/admin/dashboard`,
        };

        const path = pathMap[notif.actionType];
        if (path) {
            router.push(path);
        } else if (notif.actionUrl) {
            window.open(notif.actionUrl, '_blank');
        }
    };

    if (loading) {
        return (
            <Box bg={pageBgColor} minH="100vh" pt="55px">
                <TopBar title="Detail Notifikasi" onBack={() => router.back()} />
                <Flex
                    direction="column"
                    justify="center"
                    align="center"
                    h="calc(100vh - 55px)"
                >
                    <Spinner
                        size="lg"
                        color="green.500"
                        thickness="2px"
                        speed="0.8s"
                        emptyColor="gray.100"
                    />
                </Flex>
            </Box>
        );
    }

    if (error || !notif) {
        return (
            <Box bg={pageBgColor} minH="100vh">
                <TopBar title="Detail Notifikasi" onBack={() => router.back()} />
                <Container maxW="container.md" pt="100px">
                    <Box bg={bgColor} p={8} borderRadius="2xl" textAlign="center" shadow="sm">
                        <Text color="red.500" fontWeight="bold">{error || "Data tidak ditemukan"}</Text>
                        <Button mt={4} onClick={() => router.back()} colorScheme="green">Kembali</Button>
                    </Box>
                </Container>
            </Box>
        );
    }

    return (
        <Box bg={pageBgColor} minH="100vh">
            <TopBar title="Detail Notifikasi" onBack={() => router.back()} />

            <Box pt="90px" px={4} pb={10}>
                <Stack spacing={4}>
                    <Box
                        bg={bgColor}
                        borderRadius="2xl"
                        overflow="hidden"
                        shadow="sm"
                        borderWidth="1px"
                        borderColor={useColorModeValue("gray.100", "gray.700")}
                    >
                        {/* Header Banner - Subtle Gradient */}
                        <Box
                            bgGradient="linear(to-br, green.600, green.700)"
                            h="100px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            position="relative"
                        >
                            <Flex
                                bg="white"
                                w="64px"
                                h="64px"
                                borderRadius="xl"
                                align="center"
                                justify="center"
                                shadow="md"
                                transform="translateY(50%)"
                                position="absolute"
                                bottom="0"
                                zIndex={2}
                            >
                                {getIcon(notif.category, notif.type, notif.title)}
                            </Flex>
                        </Box>

                        <Box pt="48px" px={6} pb={8}>
                            <Stack spacing={4}>
                                <Stack spacing={1} align="center">
                                    <Badge
                                        colorScheme={notif.category === 'ranking' ? 'yellow' : notif.type === 'personal' ? 'orange' : 'blue'}
                                        borderRadius="full"
                                        px={3}
                                        py={0.5}
                                        fontSize="10px"
                                        fontWeight="800"
                                        variant="subtle"
                                    >
                                        {notif.category ? notif.category.replace('_', ' ').toUpperCase() : notif.type.toUpperCase()}
                                    </Badge>
                                    <Heading size="md" fontSize="18px" color={textColor} textAlign="center" fontWeight="800" lineHeight="1.4">
                                        {notif.title}
                                    </Heading>
                                    <Flex align="center" gap={1.5} color="gray.400" mt={1}>
                                        <Calendar size={12} />
                                        <Text fontSize="xs" fontWeight="500">
                                            {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </Flex>
                                </Stack>

                                <Divider />

                                <Box py={2}>
                                    <Text fontSize="14px" color={descColor} lineHeight="1.7" whiteSpace="pre-wrap" fontWeight="400" textAlign="justify">
                                        {notif.description}
                                    </Text>
                                </Box>

                                <Stack spacing={2} pt={4}>
                                    {(notif.relatedId || notif.actionType !== 'notification_detail') && (
                                        <Button
                                            w="100%"
                                            size="lg"
                                            colorScheme="green"
                                            bg="#347357"
                                            color="white"
                                            _hover={{ bg: "#2a5c46" }}
                                            onClick={handleAction}
                                            borderRadius="lg"
                                            fontSize="12px"
                                            fontWeight="700"
                                            h="36px"
                                            rightIcon={<ArrowRight size={12} />}
                                        >
                                            {notif.actionType === 'innovation_detail' ? 'Lihat Detail Inovasi' :
                                                notif.actionType === 'profile' ? 'Lihat Profil' :
                                                    notif.actionType === 'claim_detail' ? 'Detail Pengajuan' :
                                                        'Buka Halaman Terkait'}
                                        </Button>
                                    )}

                                    {notif.actionUrl && (
                                        <Button
                                            as="a"
                                            href={notif.actionUrl}
                                            target="_blank"
                                            w="100%"
                                            variant="outline"
                                            borderColor="green.500"
                                            color="green.600"
                                            size="lg"
                                            borderRadius="md"
                                            fontSize="12px"
                                            fontWeight="700"
                                            h="36px"
                                            rightIcon={<ExternalLink size={12} />}
                                        >
                                            Buka Link
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        w="100%"
                                        size="md"
                                        onClick={() => router.back()}
                                        fontSize="12px"
                                        h="36px"
                                        borderRadius="md"
                                    >
                                        Tutup
                                    </Button>
                                </Stack>
                            </Stack>
                        </Box>
                    </Box>

                    {/* Additional Help/Info Card */}
                    <Box p={5} bg="blue.50" borderRadius="2xl" borderWidth="1px" borderColor="blue.100">
                        <Flex gap={3}>
                            <Box mt={0.5}>
                                <Info size={18} color="#3182CE" />
                            </Box>
                            <Box>
                                <Text fontSize="xs" color="blue.700" fontWeight="700" mb={1}>
                                    Informasi Sistem
                                </Text>
                                <Text fontSize="xs" color="blue.600" lineHeight="1.5">
                                    Notifikasi ini dikirim secara sistematis untuk memberikan Anda pembaruan terkini tentang Program Desa Digital.
                                </Text>
                            </Box>
                        </Flex>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
};

export default NotificationDetailPage;
