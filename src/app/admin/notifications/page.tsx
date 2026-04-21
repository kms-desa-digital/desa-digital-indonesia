"use client";

import React, { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Select,
    Stack,
    Text,
    Textarea,
    useToast,
    Flex,
    Icon,
    SimpleGrid,
    Divider,
} from "@chakra-ui/react";
import { Megaphone, Trophy, Settings, Send, UserPlus, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import TopBar from "Components/topBar";
import { useAuthToken } from "@/hooks/useAuthToken";

const AdminNotificationPage = () => {
    const router = useRouter();
    const { token } = useAuthToken();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [rankingLoading, setRankingLoading] = useState(false);

    const [stats, setStats] = useState({
        totalAnnouncements: 0,
        readRate: "0%",
        rankingSent: 0,
        growth: "0⬆"
    });

    const fetchStats = async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/admin/notifications", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.stats) setStats(data.stats);
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    React.useEffect(() => {
        fetchStats();
    }, [token]);

    const [form, setForm] = useState({
        role: "village",
        category: "informasi_umum",
        title: "",
        description: "",
        actionType: "notification_detail",
    });

    const handleSend = async () => {
        if (!form.title || !form.description) {
            toast({
                title: "Error",
                description: "Judul dan deksripsi wajib diisi",
                status: "error",
                duration: 3000,
                position: "top",
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: form.role === 'all' ? 'broadcast_all' : 'broadcast_role',
                    ...form
                })
            });

            if (res.ok) {
                toast({
                    title: "Berhasil",
                    description: "Pengumuman berhasil terkirim",
                    status: "success",
                    duration: 3000,
                    position: "top",
                });
                setForm({
                    role: "village",
                    category: "informasi_umum",
                    title: "",
                    description: "",
                    actionType: "notification_detail",
                });
                fetchStats(); // Refresh stats after sending
            } else {
                throw new Error("Gagal mengirim");
            }
        } catch (err) {
            toast({
                title: "Error",
                description: "Terjadi kesalahan saat mengirim pengumuman",
                status: "error",
                duration: 3000,
                position: "top",
            });
        } finally {
            setLoading(false);
        }
    };

    const triggerRanking = async () => {
        try {
            setRankingLoading(true);
            const res = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ type: 'trigger_ranking' })
            });

            if (res.ok) {
                toast({
                    title: "Ranking Berhasil Terkirim",
                    description: "Ranking Top 3 telah disebarkan ke seluruh pengguna",
                    status: "success",
                    duration: 4000,
                    position: "top",
                });
                fetchStats(); // Refresh stats
            } else {
                throw new Error("Gagal trigger ranking");
            }
        } catch (err) {
            toast({
                title: "Gagal",
                description: "Terjadi kesalahan saat membuat ranking",
                status: "error",
                position: "top",
            });
        } finally {
            setRankingLoading(false);
        }
    };

    return (
        <Box bg="gray.50" minH="100vh">
            <TopBar title="Manajemen Notifikasi" onBack={() => router.back()} />

            <Box px={4} pt="80px" pb="40px">
                <Stack spacing={8}>
                    {/* Form Pengumuman */}
                    <Card borderRadius="2xl" border="none" shadow="sm">
                        <CardHeader pb={0}>
                            <Flex align="center" gap={2}>
                                <Icon as={Megaphone} color="blue.500" h={5} w={5} />
                                <Heading size="md" fontSize="lg">Buat Pengumuman</Heading>
                            </Flex>
                        </CardHeader>
                        <CardBody>
                            <Stack spacing={4}>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600">Target Role</FormLabel>
                                    <Select
                                        borderRadius="xl"
                                        size="md"
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                                        fontSize="sm"
                                    >
                                        <option value="village">Desa</option>
                                        <option value="innovator">Innovator</option>
                                        <option value="ministry">Kementerian</option>
                                        <option value="all">Semua Pengguna</option>
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600">Kategori Pengumuman</FormLabel>
                                    <Select
                                        borderRadius="xl"
                                        size="md"
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                                        fontSize="sm"
                                    >
                                        <option value="informasi_umum">Informasi Umum</option>
                                        <option value="pemeliharaan_sistem">Pemeliharaan Sistem</option>
                                        <option value="pembaruan_fitur">Pembaruan Fitur</option>
                                        <option value="acara_kegiatan">Acara / Kegiatan</option>
                                    </Select>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">Judul Notifikasi</FormLabel>
                                    <Input
                                        borderRadius="xl"
                                        size="md"
                                        fontSize="sm"
                                        placeholder="Tulis judul untuk pengumuman..."
                                        _placeholder={{ fontSize: "15px", color: "gray.400" }}
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">Isi Pesan</FormLabel>
                                    <Textarea
                                        borderRadius="xl"
                                        size="md"
                                        fontSize="sm"
                                        placeholder="Jelaskan detail pengumuman di sini secara lengkap..."
                                        _placeholder={{ fontSize: "15px", color: "gray.400" }}
                                        rows={4}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                </FormControl>

                                <Button
                                    size="md"
                                    h="40px"
                                    fontSize="16px"
                                    fontWeight="700"
                                    borderRadius="xl"
                                    onClick={handleSend}
                                    isLoading={loading}
                                    leftIcon={<Send size={14} />}
                                    mt={2}
                                >
                                    Kirim Sekarang
                                </Button>
                            </Stack>
                        </CardBody>
                    </Card>

                    {/* Konfigurasi & Otomasi */}
                    <Card borderRadius="2xl" border="none" shadow="sm">
                        <CardHeader pb={0}>
                            <Flex align="center" gap={2}>
                                <Icon as={Trophy} color="yellow.500" h={5} w={5} />
                                <Heading size="md" fontSize="lg">Ranking & Penghargaan</Heading>
                            </Flex>
                        </CardHeader>
                        <CardBody>
                            <Text fontSize="sm" color="gray.500" mb={4}>
                                Kirim notifikasi Top 3 Desa dan Innovator bulan ini secara otomatis berdasarkan data performa sistem.
                            </Text>
                            <Button
                                w="100%"
                                variant="outline"
                                borderRadius="xl"
                                onClick={triggerRanking}
                                isLoading={rankingLoading}
                                leftIcon={<Trophy size={18} />}
                            >
                                Broadcast Top 3 Bulan Ini
                            </Button>
                        </CardBody>
                    </Card>

                    <Card borderRadius="2xl" border="none" shadow="sm">
                        <CardHeader pb={0}>
                            <Flex align="center" gap={2}>
                                <Icon as={Settings} color="gray.500" h={5} w={5} />
                                <Heading size="md" fontSize="lg">Statistik Notifikasi</Heading>
                            </Flex>
                        </CardHeader>
                        <CardBody>
                            <SimpleGrid columns={2} spacing={3}>
                                <Box p={3} bg="blue.50" borderRadius="xl">
                                    <Text fontSize="10px" color="blue.600" fontWeight="bold">Total Pengumuman</Text>
                                    <Text fontSize="xl" fontWeight="bold">{stats.totalAnnouncements}</Text>
                                </Box>
                                <Box p={3} bg="green.50" borderRadius="xl">
                                    <Text fontSize="10px" color="green.600" fontWeight="bold">Rata-rata Dibaca</Text>
                                    <Text fontSize="xl" fontWeight="bold">{stats.readRate}</Text>
                                </Box>
                                <Box p={3} bg="yellow.50" borderRadius="xl">
                                    <Text fontSize="10px" color="yellow.600" fontWeight="bold">Ranking Dikirim</Text>
                                    <Text fontSize="xl" fontWeight="bold">{stats.rankingSent}</Text>
                                </Box>
                                <Box p={3} bg="orange.50" borderRadius="xl">
                                    <Text fontSize="10px" color="orange.600" fontWeight="bold">Pertumbuhan (24jam)</Text>
                                    <Text fontSize="xl" fontWeight="bold">{stats.growth}</Text>
                                </Box>
                            </SimpleGrid>
                        </CardBody>
                    </Card>
                </Stack>
            </Box>
        </Box>
    );
};

export default AdminNotificationPage;
