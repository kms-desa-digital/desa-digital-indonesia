"use client";

import React, { useState, useEffect } from "react";
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
    Badge,
    IconButton,
    Heading,
    useColorModeValue,
    Spinner,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Button,
} from "@chakra-ui/react";
import { ChevronLeft, Bell, CheckCircle2, XCircle, Info, Star, ArrowRight, MoreVertical, Trash2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import TopBar from "Components/topBar";
import { useAuthToken } from "@/hooks/useAuthToken";

interface NotificationItem {
    id: string;
    userId: string;
    type: "general" | "personal";
    title: string;
    description: string;
    isRead: boolean;
    actionType: string;
    relatedId: string | null;
    createdAt: string;
}

const NotificationPage = () => {
    const router = useRouter();
    const { token, isLoaded } = useAuthToken();
    const bgColor = useColorModeValue("white", "gray.800");
    const hoverBg = useColorModeValue("gray.50", "gray.700");
    const pageBgColor = useColorModeValue("gray.50", "gray.900");
    const tabListBgColor = useColorModeValue("white", "gray.800");
    const notifTitleColor = useColorModeValue("gray.800", "white");
    const notifDescColor = useColorModeValue("gray.600", "gray.400");
    const notifUnreadBg = useColorModeValue("green.50", "green.900");
    const notifIconBg = useColorModeValue("white", "gray.800");
    const notifBorderColor = useColorModeValue("gray.100", "gray.700");

    const [generalNotifs, setGeneralNotifs] = useState<NotificationItem[]>([]);
    const [personalNotifs, setPersonalNotifs] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
    const [isDeleteSingleOpen, setIsDeleteSingleOpen] = useState(false);
    const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);
    const cancelRef = React.useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isLoaded) return;

        if (!token) {
            setGeneralNotifs([]);
            setPersonalNotifs([]);
            setError(null);
            setLoading(false);
            return;
        }

        fetchNotifications();
    }, [token, isLoaded]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);

            const headers: any = {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            // Fetch general notifications
            const generalRes = await fetch(`/api/notifications?type=general&limit=50`, {
                headers,
            });
            const generalData = generalRes.ok ? await generalRes.json() : { notifications: [] };

            // Fetch personal notifications
            const personalRes = await fetch(`/api/notifications?type=personal&limit=50`, {
                headers,
            });
            const personalData = personalRes.ok ? await personalRes.json() : { notifications: [] };

            setGeneralNotifs(generalData.notifications || []);
            setPersonalNotifs(personalData.notifications || []);

        } catch (err) {
            console.error("Error fetching notifications:", err);
            setError("Gagal memuat notifikasi");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
            await fetch('/api/notifications/bulk', { method: 'PATCH', headers });
            fetchNotifications();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const handleDeleteAllClick = () => {
        setIsDeleteAllOpen(true);
    };

    const confirmDeleteAll = async () => {
        setIsDeleteAllOpen(false);
        try {
            const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
            await fetch('/api/notifications/bulk', { method: 'DELETE', headers });
            setGeneralNotifs([]);
            setPersonalNotifs([]);
        } catch (error) {
            console.error("Error deleting all notifications:", error);
        }
    };

    const handleDeleteSingleClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedNotifId(id);
        setIsDeleteSingleOpen(true);
    };

    const confirmDeleteSingle = async () => {
        setIsDeleteSingleOpen(false);
        if (!selectedNotifId) return;
        try {
            const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
            await fetch(`/api/notifications/${selectedNotifId}`, { method: 'DELETE', headers });
            fetchNotifications();
            setSelectedNotifId(null);
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "general": return <Info size={20} color="#3B82F6" />;
            case "personal": return <Star size={20} color="#F59E0B" />;
            default: return <Info size={20} color="#3B82F6" />;
        }
    };

    const handleNavigate = async (notif: NotificationItem) => {
        // Mark as read if not already
        if (!notif.isRead) {
            try {
                await fetch(`/api/notifications/${notif.id}`, {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
            } catch (err) {
                console.error("Error marking notification as read:", err);
            }
        }

        // Navigate based on actionType
        const pathMap: Record<string, string> = {
            innovation_detail: `/innovation/detail/${notif.relatedId}`,
            claim_detail: `/village/klaimInovasi/detail/${notif.relatedId}`,
            profile: `/village/profile/${notif.relatedId}`,
            dashboard: `/admin/dashboard`,
        };

        const path = pathMap[notif.actionType];
        if (path) {
            router.push(path);
        }
    };

    const NotificationCard = ({ notif }: { notif: NotificationItem }) => (
        <Box
            p={4}
            bg={notif.isRead ? bgColor : notifUnreadBg}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={notifBorderColor}
            transition="all 0.2s"
            _hover={{ shadow: "md", transform: "translateY(-2px)", bg: hoverBg }}
            cursor="pointer"
            position="relative"
            onClick={() => handleNavigate(notif)}
        >
            <Flex gap={4}>
                <Box mt={1}>
                    <Flex
                        w="40px"
                        h="40px"
                        bg={notifIconBg}
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
                        <Text fontWeight="800" fontSize="15px" color={notifTitleColor}>
                            {notif.title}
                        </Text>
                        {!notif.isRead && (
                            <Box w="8px" h="8px" bg="green.500" borderRadius="full" mt={1.5} />
                        )}
                    </Flex>
                    <Text fontSize="13px" color={notifDescColor} mb={2} noOfLines={2}>
                        {notif.description}
                    </Text>
                    <Flex justify="space-between" align="center">
                        <Text fontSize="11px" color="gray.400" fontWeight="500">
                            {formatDate(notif.createdAt)}
                        </Text>
                        <Flex align="center" gap={3}>
                            <IconButton
                                aria-label="Hapus notifikasi"
                                icon={<Trash2 size={14} color="red" />}
                                size="xs"
                                variant="ghost"
                                colorScheme="red"
                                onClick={(e) => handleDeleteSingleClick(notif.id, e)}
                            />
                            <Flex align="center" gap={1} color="green.600">
                                <Text fontSize="11px" fontWeight="700">Buka</Text>
                                <ArrowRight size={12} />
                            </Flex>
                        </Flex>
                    </Flex>
                </Box>
            </Flex>
        </Box>
    );

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return "Baru saja";
            if (minutes < 60) return `${minutes}m lalu`;
            if (hours < 24) return `${hours}h lalu`;
            if (days < 7) return `${days}d lalu`;

            return date.toLocaleDateString("id-ID");
        } catch {
            return "-";
        }
    };

    return (
        <Box bg={pageBgColor} minH="100vh" pb={10}>
            <TopBar
                title="Notifikasi"
                onBack={() => router.back()}
                rightElement={
                    <Menu placement="bottom-end">
                        <MenuButton
                            as={IconButton}
                            icon={<MoreVertical size={20} color="white" />}
                            variant="ghost"
                            colorScheme="whiteAlpha"
                            _hover={{ bg: "whiteAlpha.200" }}
                            aria-label="Opsi notifikasi"
                        />
                        <MenuList minW="200px" shadow="lg" borderRadius="xl">
                            <MenuItem icon={<CheckCircle size={16} />} onClick={handleMarkAllAsRead}>
                                <Text fontSize="14px" fontWeight="500">Tandai semua dibaca</Text>
                            </MenuItem>
                            <MenuItem icon={<Trash2 size={16} color="red" />} onClick={handleDeleteAllClick}>
                                <Text fontSize="14px" fontWeight="500" color="red.500">Bersihkan semua</Text>
                            </MenuItem>
                        </MenuList>
                    </Menu>
                }
            />

            <Box pt="70px" px={4}>
                {loading ? (
                    <Flex justify="center" align="center" py={20}>
                        <Spinner size="lg" color="green.500" />
                    </Flex>
                ) : error ? (
                    <Box
                        p={4}
                        bg="red.50"
                        borderRadius="lg"
                        textAlign="center"
                        color="red.800"
                    >
                        {error}
                    </Box>
                ) : (
                    <Tabs variant="soft-rounded" colorScheme="green" isFitted>
                        <TabList
                            bg={tabListBgColor}
                            p={1.5}
                            borderRadius="full"
                            shadow="sm"
                            mb={6}
                        >
                            <Tab
                                borderRadius="full"
                                fontSize="13px"
                                fontWeight="700"
                                _selected={{ bg: "green.600", color: "white", shadow: "md" }}
                            >
                                Umum {generalNotifs.length > 0 && <Badge ml={2} bg="yellow.400" color="gray.800" borderRadius="full">{generalNotifs.filter(n => !n.isRead).length}</Badge>}
                            </Tab>
                            <Tab
                                borderRadius="full"
                                fontSize="13px"
                                fontWeight="700"
                                _selected={{ bg: "green.600", color: "white", shadow: "md" }}
                            >
                                Pengajuan {personalNotifs.length > 0 && <Badge ml={2} bg="yellow.400" color="gray.800" borderRadius="full">{personalNotifs.filter(n => !n.isRead).length}</Badge>}
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
                )}
            </Box>

            {/* Modal Hapus Semua */}
            <AlertDialog
                isOpen={isDeleteAllOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => setIsDeleteAllOpen(false)}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent w="90%" maxW="320px" borderRadius="xl" p={2}>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold" pb={2}>
                            Hapus Semua Notifikasi
                        </AlertDialogHeader>

                        <AlertDialogBody fontSize="14px" color="gray.600">
                            Apakah Anda yakin ingin menghapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button 
                                ref={cancelRef} 
                                onClick={() => setIsDeleteAllOpen(false)}
                                bg="#347357"
                                color="white"
                                _hover={{ bg: "#275942" }}
                                size="sm"
                                px={4}
                            >
                                Batal
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={confirmDeleteAll}
                                ml={3}
                                bg="red.500"
                                _hover={{ bg: "red.600" }}
                                size="sm"
                                px={4}
                            >
                                Hapus
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {/* Modal Hapus Satuan */}
            <AlertDialog
                isOpen={isDeleteSingleOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => setIsDeleteSingleOpen(false)}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent w="90%" maxW="320px" borderRadius="xl" p={2}>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold" pb={2}>
                            Hapus Notifikasi
                        </AlertDialogHeader>

                        <AlertDialogBody fontSize="14px" color="gray.600">
                            Apakah Anda yakin? Anda tidak dapat membatalkan tindakan ini setelah notifikasi dihapus.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button 
                                ref={cancelRef} 
                                onClick={() => setIsDeleteSingleOpen(false)}
                                bg="#347357"
                                color="white"
                                _hover={{ bg: "#275942" }}
                                size="sm"
                                px={4}
                            >
                                Batal
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={confirmDeleteSingle}
                                ml={3}
                                bg="red.500"
                                _hover={{ bg: "red.600" }}
                                size="sm"
                                px={4}
                            >
                                Hapus
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

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
