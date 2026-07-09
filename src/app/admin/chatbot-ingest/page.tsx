"use client";

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  Textarea,
  useToast,
  VStack,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Flex,
  Select,
  useColorModeValue,
} from "@chakra-ui/react";
import Container from "Components/container";
import TopBar from "Components/topBar";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiUpload, FiPlusCircle, FiFileText, FiSettings } from "react-icons/fi";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InnovationData {
  judul: string;
  deskripsi: string;
  perspektif: string;
  keunggulan_inovasi: string;
  potensi_aplikasi: string;
  inovator_nama: string;
  inovator_status_paten: string;
  kategori: string;
  source: string;
}

interface AiConfig {
  provider: string;
  modelName: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_INNOVATION: InnovationData = {
  judul: "",
  deskripsi: "",
  perspektif: "",
  keunggulan_inovasi: "",
  potensi_aplikasi: "",
  inovator_nama: "",
  inovator_status_paten: "",
  kategori: "",
  source: "",
};

const DEFAULT_AI_CONFIG: AiConfig = {
  provider: "ollama",
  modelName: "qwen3:8b",
  // provider: "chatanywhere",
  // modelName: "gpt-4o-mini",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatbotIngestPage() {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [innovationData, setInnovationData] =
    useState<InnovationData>(EMPTY_INNOVATION);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customSourceName, setCustomSourceName] = useState("");
  const [aiConfig, setAiConfig] = useState<AiConfig>(DEFAULT_AI_CONFIG);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const hoverBg = useColorModeValue("gray.100", "gray.600");
  const fileInfoBg = useColorModeValue("blue.50", "blue.900");
  const tabListBg = useColorModeValue("gray.100", "gray.700");

  // ── Load AI config on mount ─────────────────────────────────────────────────
  React.useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.provider) setAiConfig(data);
      })
      .catch((err) => console.error("Error loading config:", err));
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const showToast = (
    title: string,
    description: string,
    status: "success" | "error" | "warning"
  ) =>
    toast({ title, description, status, duration: 5000, isClosable: true });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInnovationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInnovationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!innovationData.judul || !innovationData.deskripsi) {
      showToast("Error", "Judul dan Deskripsi wajib diisi", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/chatbot/ingest-innovation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(innovationData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan data");
      showToast("Berhasil", data.message, "success");
      setInnovationData(EMPTY_INNOVATION);
    } catch (err: any) {
      showToast("Gagal", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      showToast("Peringatan", "Pilih file PDF terlebih dahulu", "warning");
      return;
    }
    if (!customSourceName.trim()) {
      showToast(
        "Peringatan",
        "Masukkan nama dokumen (sumber) terlebih dahulu",
        "warning"
      );
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("sourceName", customSourceName);

    try {
      const res = await fetch("/api/admin/chatbot/upload-doc", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses file");
      showToast("Berhasil", data.message, "success");
      setCustomSourceName("");
      clearFile();
    } catch (err: any) {
      showToast("Gagal", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(aiConfig),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal update config");
      showToast("Berhasil", data.message, "success");
    } catch (err: any) {
      showToast("Gagal", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Shared field props for consistency ──────────────────────────────────────
  const fieldProps = { bg: inputBg, borderRadius: "md", size: "sm" as const };
  const labelProps = { fontWeight: "medium", fontSize: "xs" as const };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Container page>
      <TopBar title="Chatbot Management" onBack={() => router.back()} />

      <Box maxW="550px" mx="auto" pt="20px" px={{ base: 4, md: 6 }}>
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Heading size="sm" color="green.500">
              Chatbot Data & AI Management
            </Heading>
            <Text color="gray.500" fontSize="xs" mt={1}>
              Tambahkan data ke chatbot melalui input manual atau dokumen PDF
            </Text>
          </Box>

          <Tabs variant="soft-rounded" colorScheme="green">
            <TabList
              bg={tabListBg}
              p={1}
              borderRadius="xl"
              gap={1}
            >
              <Tab
                fontWeight="semibold"
                fontSize="xs"
                flex={1}
                whiteSpace="nowrap"
                gap={1}
              >
                <Icon as={FiPlusCircle} />
                Inovasi
              </Tab>
              <Tab
                fontWeight="semibold"
                fontSize="xs"
                flex={1}
                whiteSpace="nowrap"
                gap={1}
              >
                <Icon as={FiUpload} />
                Dokumen
              </Tab>
              <Tab
                fontWeight="semibold"
                fontSize="xs"
                flex={1}
                whiteSpace="nowrap"
                gap={1}
              >
                <Icon as={FiSettings} />
                AI Config
              </Tab>
            </TabList>

            <TabPanels mt={6}>
              {/* ── Tab: Inovasi ─────────────────────────────────────────── */}
              <TabPanel p={0}>
                <form onSubmit={handleInnovationSubmit}>
                  <Stack
                    spacing={3}
                    bg={cardBg}
                    p={4}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={borderColor}
                    shadow="md"
                  >
                    <FormControl isRequired>
                      <FormLabel {...labelProps}>
                        Nama Dokumen (Sumber)
                      </FormLabel>
                      <Input
                        name="source"
                        value={innovationData.source}
                        onChange={handleInputChange}
                        placeholder="Contoh: Katalog Inovasi Desa 2024"
                        {...fieldProps}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel {...labelProps}>Judul Inovasi</FormLabel>
                      <Input
                        name="judul"
                        value={innovationData.judul}
                        onChange={handleInputChange}
                        placeholder="Contoh: Mesin Pencacah Rumput Otomatis"
                        {...fieldProps}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel {...labelProps}>Deskripsi</FormLabel>
                      <Textarea
                        name="deskripsi"
                        value={innovationData.deskripsi}
                        onChange={handleInputChange}
                        placeholder="Ringkasan atau detail inovasi yang mencakup cara kerja..."
                        rows={3}
                        {...fieldProps}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel {...labelProps}>Kategori</FormLabel>
                      <Input
                        name="kategori"
                        value={innovationData.kategori}
                        onChange={handleInputChange}
                        placeholder="Contoh: PEMBERDAYAAN / PERTANIAN / TEKNOLOGI"
                        {...fieldProps}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel {...labelProps}>Perspektif</FormLabel>
                      <Input
                        name="perspektif"
                        value={innovationData.perspektif}
                        onChange={handleInputChange}
                        placeholder="Contoh: Ekonomi, Sosial, atau Lingkungan"
                        {...fieldProps}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel {...labelProps}>Keunggulan Inovasi</FormLabel>
                      <Textarea
                        name="keunggulan_inovasi"
                        value={innovationData.keunggulan_inovasi}
                        onChange={handleInputChange}
                        placeholder="Apa yang membedakan inovasi ini dengan yang lain?"
                        {...fieldProps}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel {...labelProps}>Potensi Aplikasi</FormLabel>
                      <Input
                        name="potensi_aplikasi"
                        value={innovationData.potensi_aplikasi}
                        onChange={handleInputChange}
                        placeholder="Di mana inovasi ini bisa diterapkan?"
                        {...fieldProps}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel {...labelProps}>Nama Inovator</FormLabel>
                      <Input
                        name="inovator_nama"
                        value={innovationData.inovator_nama}
                        onChange={handleInputChange}
                        placeholder="Nama Individu, Tim, atau Instansi"
                        {...fieldProps}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel {...labelProps}>Status Paten</FormLabel>
                      <Input
                        name="inovator_status_paten"
                        value={innovationData.inovator_status_paten}
                        onChange={handleInputChange}
                        placeholder="Sudah Terdaftar / Dalam Proses / Belum Ada"
                        {...fieldProps}
                      />
                    </FormControl>

                    <Button
                      type="submit"
                      colorScheme="blue"
                      size="sm"
                      fontSize="xs"
                      borderRadius="xl"
                      isLoading={loading}
                      loadingText="Menyimpan..."
                    >
                      Simpan ke Chatbot
                    </Button>
                  </Stack>
                </form>
              </TabPanel>

              {/* ── Tab: Dokumen ──────────────────────────────────────────── */}
              <TabPanel p={0}>
                <VStack
                  spacing={3}
                  bg={cardBg}
                  p={4}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                  shadow="md"
                  align="stretch"
                >
                  <FormControl isRequired>
                    <FormLabel {...labelProps}>Nama Dokumen</FormLabel>
                    <Input
                      placeholder="Contoh: Dokumen Kebijakan Desa 2024"
                      value={customSourceName}
                      onChange={(e) => setCustomSourceName(e.target.value)}
                      {...fieldProps}
                    />
                  </FormControl>

                  {/* Upload drop zone */}
                  <Box
                    border="2px dashed"
                    borderColor={selectedFile ? "blue.400" : borderColor}
                    bg={inputBg}
                    p={6}
                    borderRadius="md"
                    textAlign="center"
                    cursor="pointer"
                    onClick={() => fileInputRef.current?.click()}
                    _hover={{ bg: hoverBg }}
                    transition="background 0.2s"
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      hidden
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <Icon as={FiFileText} w={6} h={6} mb={2} />
                    <Text fontWeight="medium" fontSize="xs">
                      {selectedFile ? selectedFile.name : "Klik untuk upload PDF"}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Akan diproses per halaman menjadi embedding
                    </Text>
                  </Box>

                  {/* Selected file info bar */}
                  {selectedFile && (
                    <Flex
                      justify="space-between"
                      align="center"
                      bg={fileInfoBg}
                      p={3}
                      borderRadius="md"
                    >
                      <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        ml={2}
                        flexShrink={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                      >
                        Hapus
                      </Button>
                    </Flex>
                  )}

                  <Button
                    colorScheme="blue"
                    size="sm"
                    fontSize="xs"
                    borderRadius="xl"
                    leftIcon={<FiUpload />}
                    onClick={handleFileUpload}
                    isLoading={loading}
                    loadingText="Processing..."
                    isDisabled={!selectedFile}
                  >
                    Mulai Ingestion
                  </Button>
                </VStack>
              </TabPanel>

              {/* ── Tab: Konfigurasi AI ───────────────────────────────────── */}
              <TabPanel p={0}>
                <form onSubmit={handleConfigSubmit}>
                  <VStack
                    spacing={4}
                    bg={cardBg}
                    p={4}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={borderColor}
                    shadow="md"
                    align="stretch"
                  >
                    <FormControl isRequired>
                      <FormLabel {...labelProps}>Pilih AI Provider</FormLabel>
                      <Select
                        value={aiConfig.provider}
                        onChange={(e) =>
                          setAiConfig({ ...aiConfig, provider: e.target.value })
                        }
                        {...fieldProps}
                      >
                        <option value="chatanywhere">
                          ChatAnywhere (OpenAI)
                        </option>
                        <option value="gemini">Google Gemini</option>
                        <option value="ollama">Ollama (Local)</option>
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel {...labelProps}>Model Name</FormLabel>
                      <Input
                        value={aiConfig.modelName}
                        onChange={(e) =>
                          setAiConfig({
                            ...aiConfig,
                            modelName: e.target.value,
                          })
                        }
                        placeholder="Contoh: gpt-4o-mini, gemma-3-27b-it, qwen3:8b"
                        {...fieldProps}
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Pastikan Model Name sesuai dengan Provider yang dipilih.
                      </Text>
                    </FormControl>

                    <Button
                      type="submit"
                      colorScheme="green"
                      size="sm"
                      fontSize="xs"
                      borderRadius="xl"
                      isLoading={loading}
                      loadingText="Menyimpan..."
                    >
                      Update Konfigurasi
                    </Button>
                  </VStack>
                </form>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>
    </Container>
  );
}