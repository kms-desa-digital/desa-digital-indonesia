"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
import {
    ChevronDownIcon,
    DeleteIcon,
    EmailIcon,
    InfoOutlineIcon,
    SettingsIcon
} from "@chakra-ui/icons";
import {
    ChevronLeft, Bell, CheckCircle2, XCircle, Info, Star,
    ArrowRight, MoreVertical, Trash2, CheckCircle,
    Trophy, Megaphone, Lightbulb, UserPlus
} from "lucide-react";
import { useRouter } from "next/navigation";
import TopBar from "Components/topBar";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useUser } from "src/contexts/UserContext";

interface NotificationItem {
    id: string;
    userId: string;
    type: "general" | "personal";
    category?: 'ranking' | 'announcement' | 'innovation_recommendation' | 'new_innovator' | 'submission_status' | 'innovation_submission' | 'claim_submission' | 'profile_submission' | 'village_submission' | 'innovator_submission';
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

    const LIMIT = 15;
    const [generalNotifs, setGeneralNotifs] = useState<NotificationItem[]>([]);
    const [personalNotifs, setPersonalNotifs] = useState<NotificationItem[]>([]);

    const [generalSkip, setGeneralSkip] = useState(0);
    const [personalSkip, setPersonalSkip] = useState(0);
    const [hasMoreGeneral, setHasMoreGeneral] = useState(false);
    const [hasMorePersonal, setHasMorePersonal] = useState(false);

    const [generalUnread, setGeneralUnread] = useState(0);
    const [personalUnread, setPersonalUnread] = useState(0);

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tabIndex, setTabIndex] = useState(0);
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const { role } = useUser();
    const isAdmin = role === "admin";

    const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
    const [isDeleteSingleOpen, setIsDeleteSingleOpen] = useState(false);
    const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);
    const cancelRef = React.useRef<HTMLButtonElement>(null);
    const t = useTranslations("NotificationPage");

    useEffect(() => {
        if (!isLoaded) return;

        if (!token) {
            setGeneralNotifs([]);
            setPersonalNotifs([]);
            setError(null);
            setLoading(false);
            return;
        }

        fetchInitial();
    }, [token, isLoaded]);

    const fetchInitial = async () => {
        try {
            setLoading(true);
            setError(null);

            const headers: any = {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            const [generalRes, personalRes] = await Promise.all([
                fetch(`/api/notifications?type=general&limit=${LIMIT}&skip=0`, { headers }),
                fetch(`/api/notifications?type=personal&limit=${LIMIT}&skip=0`, { headers })
            ]);

            const generalData = generalRes.ok ? await generalRes.json() : { notifications: [], pagination: { hasMore: false }, unreadCount: 0 };
            const personalData = personalRes.ok ? await personalRes.json() : { notifications: [], pagination: { hasMore: false }, unreadCount: 0 };

            setGeneralNotifs(generalData.notifications || []);
            setHasMoreGeneral(generalData.pagination?.hasMore || false);
            setGeneralSkip(LIMIT);
            setGeneralUnread(generalData.unreadCount || 0);

            setPersonalNotifs(personalData.notifications || []);
            setHasMorePersonal(personalData.pagination?.hasMore || false);
            setPersonalSkip(LIMIT);
            setPersonalUnread(personalData.unreadCount || 0);

        } catch (err) {
            console.error("Error fetching notifications:", err);
            setError("Gagal memuat notifikasi");
        } finally {
            setLoading(false);
        }
    };

    const fetchMore = async (type: 'general' | 'personal') => {
        if (loadingMore) return;

        try {
            setLoadingMore(true);
            const skip = type === 'general' ? generalSkip : personalSkip;
            const headers: any = {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            const res = await fetch(`/api/notifications?type=${type}&limit=${LIMIT}&skip=${skip}`, { headers });
            const data = res.ok ? await res.json() : null;

            if (data) {
                if (type === 'general') {
                    setGeneralNotifs(prev => [...prev, ...(data.notifications || [])]);
                    setHasMoreGeneral(data.pagination?.hasMore || false);
                    setGeneralSkip(prev => prev + LIMIT);
                } else {
                    setPersonalNotifs(prev => [...prev, ...(data.notifications || [])]);
                    setHasMorePersonal(data.pagination?.hasMore || false);
                    setPersonalSkip(prev => prev + LIMIT);
                }
            }
        } catch (err) {
            console.error("Error fetching more notifications:", err);
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const bottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 100;
            if (bottom) {
                if (tabIndex === 0 && hasMoreGeneral && !loadingMore) {
                    fetchMore('general');
                } else if (tabIndex === 1 && hasMorePersonal && !loadingMore) {
                    fetchMore('personal');
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [tabIndex, hasMoreGeneral, hasMorePersonal, loadingMore, generalSkip, personalSkip]);

    const handleMarkAllAsRead = async () => {
        try {
            const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
            await fetch('/api/notifications/bulk', { method: 'PATCH', headers });
            fetchInitial();
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
            fetchInitial();
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
            fetchInitial();
            setSelectedNotifId(null);
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const getIcon = (notif: NotificationItem) => {
        const category = notif.category;
        const title = notif.title.toLowerCase();

        // 1. Status Verifikasi untuk User (Role Innovator/Desa)
        if (title.includes('disetujui') || title.includes('terverifikasi') || title.includes('sukses')) {
            return <CheckCircle size={18} color="#10B981" />;
        }
        if (title.includes('ditolak') || title.includes('gagal') || title.includes('tolak')) {
            return <XCircle size={18} color="#EF4444" />;
        }

        // 2. Pengajuan Baru untuk Admin (Bintang)
        if (
            category === 'innovation_submission' || 
            category === 'claim_submission' || 
            category === 'village_submission' || 
            category === 'innovator_submission' ||
            category === 'profile_submission'
        ) {
            return <Star size={18} color="#F59E0B" />;
        }

        // 3. Kategori Khusus Lainnya
        if (category === 'ranking') return <Trophy size={18} color="#EAB308" />;
        if (category === 'announcement') return <Megaphone size={18} color="#3B82F6" />;
        if (category === 'innovation_recommendation') return <Lightbulb size={18} color="#F59E0B" />;
        if (category === 'new_innovator') return <UserPlus size={18} color="#10B981" />;

        // 4. Fallback berdasarkan tipe
        switch (notif.type) {
            case "general": return <Info size={18} color="#3B82F6" />;
            case "personal": return <Star size={18} color="#F59E0B" />;
            default: return <Info size={18} color="#3B82F6" />;
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

        // Selalu arahkan ke halaman detail notifikasi
        router.push(`/notification/${notif.id}`);
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
            {/* Tombol Hapus di Pojok Atas */}
            <IconButton
                aria-label="Hapus notifikasi"
                icon={<Trash2 size={13} />}
                size="xs"
                variant="ghost"
                color="red.400"
                position="absolute"
                top={2}
                right={2}
                onClick={(e) => handleDeleteSingleClick(notif.id, e)}
                _hover={{ bg: "red.50", color: "red.600" }}
            />

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
                        {getIcon(notif)}
                    </Flex>
                </Box>
                <Box flex={1}>
                    <Flex justify="space-between" align="start" mb={1}>
                        <Text
                            fontWeight="800"
                            fontSize="15px"
                            color={notifTitleColor}
                            noOfLines={1}
                            pr={6} // Padding agar judul tidak mepet tombol hapus
                        >
                            {notif.title}
                        </Text>
                    </Flex>
                    <Text fontSize="13px" color={notifDescColor} mb={2} noOfLines={2}>
                        {notif.description}
                    </Text>
                    <Flex justify="space-between" align="center">
                        <Text fontSize="11px" color="gray.400" fontWeight="500">
                            {formatDate(notif.createdAt)}
                        </Text>

                        <Flex align="center" gap={1} color="green.600">
                            <Text fontSize="11px" fontWeight="700">Buka</Text>
                            <ArrowRight size={12} />
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
                title={t("notificationTitle")}
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
                                <Text fontSize="14px" fontWeight="500">{t("markAllRead")}</Text>
                            </MenuItem>
                            <MenuItem icon={<Trash2 size={16} color="red" />} onClick={handleDeleteAllClick}>
                                <Text fontSize="14px" fontWeight="500" color="red.500">{t("clearAll")}</Text>
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
                    <Tabs variant="soft-rounded" colorScheme="green" isFitted onChange={(index) => setTabIndex(index)}>
                        <TabList
                            bg={tabListBgColor}
                            p={1.5}
                            borderRadius="full"
                            shadow="sm"
                            mb={2}
                        >
                            <Tab
                                borderRadius="full"
                                fontSize="13px"
                                fontWeight="700"
                                _selected={{ bg: "green.600", color: "white", shadow: "md" }}
                            >
                                {t("generalTab")} {generalUnread > 0 && <Badge ml={2} bg="yellow.400" color="gray.800" borderRadius="full">{generalUnread}</Badge>}
                            </Tab>
                            <Tab
                                borderRadius="full"
                                fontSize="13px"
                                fontWeight="700"
                                _selected={{ bg: "green.600", color: "white", shadow: "md" }}
                            >
                                {t("submissionTab")} {personalUnread > 0 && <Badge ml={2} bg="yellow.400" color="gray.800" borderRadius="full">{personalUnread}</Badge>}
                            </Tab>
                        </TabList>

                        <TabPanels>
                            <TabPanel p={0}>
                                <Stack spacing={3}>
                                    {generalNotifs.length > 0 ? (
                                        <>
                                            {generalNotifs.map((notif, i) => (
                                                <NotificationCard key={`${notif.id}-${i}`} notif={notif} />
                                            ))}
                                            {loadingMore && tabIndex === 0 && (
                                                <Flex justify="center" py={4}>
                                                    <Spinner size="sm" color="green.500" />
                                                </Flex>
                                            )}
                                        </>
                                    ) : (
                                        <EmptyState />
                                    )}
                                </Stack>
                            </TabPanel>
                            <TabPanel p={0}>
                                {isAdmin && (
                                    <Box mb={4}>
                                        <Menu matchWidth>
                                            <MenuButton
                                                as={Button}
                                                rightIcon={<ChevronDownIcon />}
                                                variant="outline"
                                                w="full"
                                                borderRadius="xl"
                                                fontSize="14px"
                                                h="48px"
                                                textAlign="left"
                                                fontWeight="500"
                                                color="gray.600"
                                                bg="white"
                                                borderColor="gray.200"
                                                _hover={{ bg: "gray.50" }}
                                                _active={{ bg: "gray.50" }}
                                                px={4}
                                            >
                                                {filterCategory === "all" ? "Semua Verifikasi" :
                                                    filterCategory === "village_submission" ? "Pengajuan Desa" :
                                                        filterCategory === "innovator_submission" ? "Pengajuan Innovator" :
                                                            filterCategory === "innovation_submission" ? "Pengajuan Inovasi" :
                                                                filterCategory === "claim_submission" ? "Pengajuan Klaim" : "Filter"}
                                            </MenuButton>
                                            <MenuList borderRadius="xl" shadow="lg" py={2}>
                                                <MenuItem
                                                    onClick={() => setFilterCategory("all")}
                                                    fontSize="14px"
                                                    fontWeight={filterCategory === "all" ? "600" : "400"}
                                                    color={filterCategory === "all" ? "green.600" : "inherit"}
                                                >
                                                    Semua Verifikasi
                                                </MenuItem>
                                                <MenuItem
                                                    onClick={() => setFilterCategory("village_submission")}
                                                    fontSize="14px"
                                                    fontWeight={filterCategory === "village_submission" ? "600" : "400"}
                                                    color={filterCategory === "village_submission" ? "green.600" : "inherit"}
                                                >
                                                    Pengajuan Desa
                                                </MenuItem>
                                                <MenuItem
                                                    onClick={() => setFilterCategory("innovator_submission")}
                                                    fontSize="14px"
                                                    fontWeight={filterCategory === "innovator_submission" ? "600" : "400"}
                                                    color={filterCategory === "innovator_submission" ? "green.600" : "inherit"}
                                                >
                                                    Pengajuan Innovator
                                                </MenuItem>
                                                <MenuItem
                                                    onClick={() => setFilterCategory("innovation_submission")}
                                                    fontSize="14px"
                                                    fontWeight={filterCategory === "innovation_submission" ? "600" : "400"}
                                                    color={filterCategory === "innovation_submission" ? "green.600" : "inherit"}
                                                >
                                                    Pengajuan Inovasi
                                                </MenuItem>
                                                <MenuItem
                                                    onClick={() => setFilterCategory("claim_submission")}
                                                    fontSize="14px"
                                                    fontWeight={filterCategory === "claim_submission" ? "600" : "400"}
                                                    color={filterCategory === "claim_submission" ? "green.600" : "inherit"}
                                                >
                                                    Pengajuan Klaim
                                                </MenuItem>
                                            </MenuList>
                                        </Menu>
                                    </Box>
                                )}
                                <Stack spacing={3}>
                                    {(() => {
                                        const filteredNotifs = personalNotifs.filter(n => {
                                            if (filterCategory === "all") return true;

                                            // Smart Mapping for Legacy Data (Fallback based on title keywords)
                                            let effectiveCategory = n.category;
                                            const titleLower = n.title.toLowerCase();

                                            if (!effectiveCategory || effectiveCategory === 'profile_submission' || effectiveCategory === 'submission_status') {
                                                if (titleLower.includes('klaim')) {
                                                    effectiveCategory = 'claim_submission';
                                                } else if (titleLower.includes('inovasi')) {
                                                    effectiveCategory = 'innovation_submission';
                                                } else if (titleLower.includes('desa')) {
                                                    effectiveCategory = 'village_submission';
                                                } else if (titleLower.includes('innovator')) {
                                                    effectiveCategory = 'innovator_submission';
                                                }
                                            }

                                            return effectiveCategory === filterCategory;
                                        });

                                        return filteredNotifs.length > 0 ? (
                                            <>
                                                {filteredNotifs.map((notif, i) => (
                                                    <NotificationCard key={`${notif.id}-${i}`} notif={notif} />
                                                ))}
                                                {loadingMore && tabIndex === 1 && (
                                                    <Flex justify="center" py={4}>
                                                        <Spinner size="sm" color="green.500" />
                                                    </Flex>
                                                )}
                                            </>
                                        ) : (
                                            <EmptyState />
                                        );
                                    })()}
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

const EmptyState = () => {
    const t = useTranslations("NotificationPage");

    return (
        <Flex direction="column" align="center" justify="center" py={20} px={10} textAlign="center">
            <Box bg="white" p={6} borderRadius="full" shadow="lg" mb={6}>
                <Bell size={48} color="#E2E8F0" />
            </Box>
            <Heading fontSize="xl" mb={2}>{t("emptyTitle")}</Heading>
            <Text color="gray.500" fontSize="sm">
                {t("emptyDescription")}
            </Text>
        </Flex>
    );
};

export default NotificationPage;
