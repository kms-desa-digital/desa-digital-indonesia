"use client";

import {
    ChevronDownIcon,
    SearchIcon,
    AddIcon,
    EditIcon,
    DeleteIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "@chakra-ui/icons";
import {
    Box,
    Button,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Stack,
    Text,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    FormControl,
    FormLabel,
    Select,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
} from "@chakra-ui/react";
import Container from "Components/container";
import TopBar from "Components/topBar";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUsers, deleteUser, createUser, updateUser } from "Services/adminServices";

const UserManagementPage: React.FC = () => {
    const router = useRouter();
    const toast = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 15;

    // Modal state
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "village"
    });

    // Delete confirmation state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const cancelRef = useRef<any>(null);

    const roleOptions = [
        { label: "Semua", value: "all" },
        { label: "Admin", value: "admin" },
        { label: "Desa", value: "village" },
        { label: "Inovator", value: "innovator" },
        { label: "Kementerian", value: "ministry" },
    ];

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res: any = await getUsers({
                search: searchTerm,
                role: roleFilter,
                page,
                limit
            });
            setUsers(res.users || []);
            setTotalPages(res.totalPages || 1);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(fetchUsers, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, roleFilter, page]);

    const handleAddClick = () => {
        setModalMode("add");
        setSelectedUserId(null);
        setFormData({ email: "", password: "", role: "village" });
        onOpen();
    };

    const handleEditClick = (user: any) => {
        setModalMode("edit");
        setSelectedUserId(user.uid);
        setFormData({ email: user.email, password: "", role: user.role });
        onOpen();
    };

    const handleSubmit = async () => {
        if (!formData.email || (modalMode === "add" && !formData.password)) {
            toast({ title: "Email dan Password wajib diisi", status: "error", position: "top" });
            return;
        }

        setSubmitting(true);
        try {
            if (modalMode === "add") {
                await createUser(formData);
                toast({ title: "Pengguna berhasil ditambahkan", status: "success", position: "top" });
            } else {
                const updateData: any = { email: formData.email, role: formData.role };
                if (formData.password) updateData.password = formData.password;
                await updateUser(selectedUserId!, updateData);
                toast({ title: "Pengguna berhasil diperbarui", status: "success", position: "top" });
            }
            onClose();
            fetchUsers();
        } catch (error: any) {
            toast({ title: "Terjadi kesalahan", description: error.response?.data?.message || error.message, status: "error", position: "top" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setUserToDelete(id);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        
        try {
            await deleteUser(userToDelete);
            toast({ title: "Pengguna berhasil dihapus", status: "success", position: "top" });
            fetchUsers();
        } catch (error: any) {
            toast({ title: "Gagal menghapus pengguna", description: error.message, status: "error", position: "top" });
        } finally {
            setIsDeleteOpen(false);
            setUserToDelete(null);
        }
    };


    return (
        <Container page>
            <TopBar title="User Management" onBack={() => router.push("/admin")} />

            <Box padding="0 16px">
                <Flex justify="space-between" align="center" mt={6} gap={2}>
                    <Flex flexGrow={1}>
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <SearchIcon color="gray.400" />
                            </InputLeftElement>
                            <Input
                                placeholder="Cari email atau nama..."
                                size="md"
                                bg="white"
                                borderRadius="full"
                                _placeholder={{ color: "gray.400" }}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </InputGroup>
                    </Flex>

                    <Menu>
                        <MenuButton
                            as={Button}
                            rightIcon={<ChevronDownIcon color="#347357" />}
                            borderRadius="8px"
                            backgroundColor="white"
                            border="1px solid"
                            borderColor="gray.200"
                            textColor={"gray.600"}
                            _hover={{ bg: "gray.50" }}
                            fontSize="12px"
                            fontWeight="normal"
                            minW="100px"
                        >
                            {roleOptions.find(opt => opt.value === roleFilter)?.label || "Filter"}
                        </MenuButton>
                        <MenuList>
                            {roleOptions.map((opt) => (
                                <MenuItem
                                    key={opt.value}
                                    onClick={() => {
                                        setRoleFilter(opt.value);
                                        setPage(1);
                                    }}
                                >
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </MenuList>
                    </Menu>
                </Flex>

                <Flex justify="center" mt={4}>
                    <Button
                        leftIcon={<AddIcon />}
                        fontSize="14px"
                        fontWeight="700"
                        width="100%"
                        colorScheme="brand"
                        backgroundColor="#347357"
                        color="white"
                        _hover={{ backgroundColor: "#2a5c46" }}
                        onClick={handleAddClick}
                    >
                        Tambah Pengguna
                    </Button>
                </Flex>

                <Box mt={4} bg="white" borderRadius="lg" overflow="hidden" boxShadow="sm">
                    <Table variant="simple" size="sm">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th fontSize="10px" px={2}>Email</Th>
                                <Th fontSize="10px" px={2}>Role</Th>
                                <Th fontSize="10px" px={2} textAlign="center">Aksi</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {loading ? (
                                <Tr><Td colSpan={3} textAlign="center" py={4}>Memuat data...</Td></Tr>
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <Tr key={user.uid}>
                                        <Td fontSize="11px" px={2} maxW="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                                            {user.email}
                                        </Td>
                                        <Td fontSize="11px" px={2} textTransform="capitalize">{user.role}</Td>
                                        <Td px={2}>
                                            <Flex gap={1} justify="center">
                                                <IconButton
                                                    aria-label="Edit user"
                                                    icon={<EditIcon />}
                                                    size="xs"
                                                    colorScheme="blue"
                                                    variant="ghost"
                                                    onClick={() => handleEditClick(user)}
                                                />
                                                <IconButton
                                                    aria-label="Delete user"
                                                    icon={<DeleteIcon />}
                                                    size="xs"
                                                    colorScheme="red"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteClick(user.uid)}
                                                />
                                            </Flex>
                                        </Td>
                                    </Tr>
                                ))
                            ) : (
                                <Tr><Td colSpan={3} textAlign="center" py={4}>Tidak ada data</Td></Tr>
                            )}
                        </Tbody>
                    </Table>
                </Box>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Flex justify="center" mt={4} mb={8} align="center" gap={4}>
                        <Button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            isDisabled={page === 1}
                            variant="outline"
                            size="sm"
                            borderColor="gray.200"
                            color="#347357"
                            _hover={{ bg: "gray.50" }}
                        >
                            <ChevronLeftIcon />
                        </Button>
                        <Text fontSize="14px" fontWeight="500" color="gray.700">
                            Halaman {page} dari {totalPages}
                        </Text>
                        <Button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            isDisabled={page === totalPages}
                            variant="outline"
                            size="sm"
                            borderColor="gray.200"
                            color="#347357"
                            _hover={{ bg: "gray.50" }}
                        >
                            <ChevronRightIcon />
                        </Button>
                    </Flex>
                )}

                <Box height="40px" />
            </Box>

            {/* Re-integrated Modal */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent mx="16px" maxWidth="328px">
                    <ModalHeader fontSize="16px">{modalMode === "add" ? "Tambah Pengguna Baru" : "Edit Pengguna"}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Stack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel fontSize="12px">Email</FormLabel>
                                <Input
                                    placeholder="user@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    fontSize="14px"
                                />
                            </FormControl>
                            <FormControl isRequired={modalMode === "add"}>
                                <FormLabel fontSize="12px">
                                    Password {modalMode === "edit" && "(Opsional)"}
                                </FormLabel>
                                <Input
                                    placeholder="******"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    fontSize="14px"
                                />
                                {modalMode === "edit" && (
                                    <Text fontSize="10px" color="gray.500" mt={1}>
                                        Kosongkan jika tidak ingin diubah
                                    </Text>
                                )}
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontSize="12px">Role</FormLabel>
                                <Select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    fontSize="14px"
                                >
                                    <option value="village">Desa</option>
                                    <option value="innovator">Inovator</option>
                                    <option value="admin">Admin</option>
                                    <option value="ministry">Kementerian</option>
                                </Select>
                            </FormControl>
                        </Stack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} size="sm" onClick={onClose}>Batal</Button>
                        <Button
                            colorScheme="green"
                            bg="#347357"
                            size="sm"
                            isLoading={submitting}
                            onClick={handleSubmit}
                        >
                            Simpan
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                isOpen={isDeleteOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => setIsDeleteOpen(false)}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent mx="16px" maxWidth="328px" borderRadius="xl">
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Hapus Pengguna
                        </AlertDialogHeader>

                        <AlertDialogBody fontSize="14px">
                            Apakah Anda yakin ingin menghapus pengguna ini? Profil Desa/Inovator yang terhubung dengan akun ini juga akan ikut terhapus secara permanen.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => setIsDeleteOpen(false)} size="sm">
                                Batal
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={confirmDelete}
                                ml={3}
                                size="sm"
                                bg="red.500"
                                _hover={{ bg: "red.600" }}
                            >
                                Hapus
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Container>
    );
};

export default UserManagementPage;
