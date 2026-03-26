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
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Flex,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import Container from "Components/container";
import TopBar from "Components/topBar";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiUpload, FiPlusCircle, FiFileText } from "react-icons/fi";

export default function ChatbotIngestPage() {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [innovationData, setInnovationData] = useState({
    judul: "",
    deskripsi: "",
    perspektif: "",
    keunggulan_inovasi: "",
    potensi_aplikasi: "",
    inovator_nama: "",
    inovator_status_paten: "",
    kategori: "",
    source: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customSourceName, setCustomSourceName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // theme tokens biar konsisten
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const hoverBg = useColorModeValue("gray.100", "gray.800");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInnovationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInnovationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!innovationData.judul || !innovationData.deskripsi) {
      toast({
        title: "Error",
        description: "Judul dan Deskripsi wajib diisi",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/chatbot/ingest-innovation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(innovationData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: data.message,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        setInnovationData({
          judul: "",
          deskripsi: "",
          perspektif: "",
          keunggulan_inovasi: "",
          potensi_aplikasi: "",
          inovator_nama: "",
          inovator_status_paten: "",
          kategori: "",
          source: "",
        });
      } else {
        throw new Error(data.error || "Gagal menyimpan data");
      }
    } catch (error: any) {
      toast({
        title: "Gagal",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Peringatan",
        description: "Pilih file PDF terlebih dahulu",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!customSourceName.trim()) {
      toast({
        title: "Peringatan",
        description: "Masukkan nama dokumen (sumber) terlebih dahulu",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("sourceName", customSourceName);

    try {
      const response = await fetch("/api/admin/chatbot/upload-doc", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: data.message,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        setSelectedFile(null);
        setCustomSourceName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        throw new Error(data.error || "Gagal memproses file");
      }
    } catch (error: any) {
      toast({
        title: "Gagal",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container page>
      <TopBar title="Chatbot Data" onBack={() => router.back()} />

      <Box maxW="900px" mx="auto" pt="50px" px={{ base: 4, md: 6 }}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Heading size="lg" color="green.500">
              Chatbot Data Ingestion
            </Heading>
            <Text color="gray.500" fontSize="sm" mt={1}>
              Tambahkan data ke chatbot melalui input manual atau dokumen PDF
            </Text>
          </Box>

          <Tabs
            isFitted
            variant="soft-rounded"
            colorScheme="green"
            onChange={(index) => setActiveTab(index)}
          >
            <TabList
              bg={useColorModeValue("gray.100", "gray.700")}
              p={1}
              borderRadius="xl"
            >
              <Tab fontWeight="semibold">
                <Icon as={FiPlusCircle} mr={2} />
                Inovasi
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FiUpload} mr={2} />
                Dokumen
              </Tab>
            </TabList>

            <TabPanels mt={6}>
              {/* INOVASI */}
              <TabPanel p={0}>
                <form onSubmit={handleInnovationSubmit}>
                  <Stack
                    spacing={5}
                    bg={cardBg}
                    p={{ base: 5, md: 7 }}
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor={borderColor}
                    shadow="lg"
                  >
                    <FormControl isRequired>
                      <FormLabel fontWeight="medium">Nama Dokumen (Sumber)</FormLabel>
                      <Input
                        name="source"
                        value={innovationData.source}
                        onChange={handleInputChange}
                        placeholder="Contoh: Katalog Inovasi Desa 2024"
                        bg={inputBg}
                        borderRadius="lg"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="medium">Judul Inovasi</FormLabel>
                      <Input
                        name="judul"
                        value={innovationData.judul}
                        onChange={handleInputChange}
                        placeholder="Contoh: Mesin Pencacah Rumput Otomatis"
                        bg={inputBg}
                        borderRadius="lg"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="medium">Deskripsi</FormLabel>
                      <Textarea
                        name="deskripsi"
                        value={innovationData.deskripsi}
                        onChange={handleInputChange}
                        placeholder="Ringkasan atau detail inovasi yang mencakup cara kerja..."
                        bg={inputBg}
                        borderRadius="lg"
                        rows={4}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium">Kategori</FormLabel>
                      <Input
                        name="kategori"
                        value={innovationData.kategori}
                        onChange={handleInputChange}
                        placeholder="Contoh: PEMBERDAYAAN / PERTANIAN / TEKNOLOGI"
                        bg={inputBg}
                        borderRadius="lg"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium">Perspektif</FormLabel>
                      <Input
                        name="perspektif"
                        value={innovationData.perspektif}
                        onChange={handleInputChange}
                        placeholder="Contoh: Ekonomi, Sosial, atau Lingkungan"
                        bg={inputBg}
                        borderRadius="lg"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium">Keunggulan Inovasi</FormLabel>
                      <Textarea
                        name="keunggulan_inovasi"
                        value={innovationData.keunggulan_inovasi}
                        onChange={handleInputChange}
                        placeholder="Apa yang membedakan inovasi ini dengan yang lain?"
                        bg={inputBg}
                        borderRadius="lg"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium">Potensi Aplikasi</FormLabel>
                      <Input
                        name="potensi_aplikasi"
                        value={innovationData.potensi_aplikasi}
                        onChange={handleInputChange}
                        placeholder="Di mana inovasi ini bisa diterapkan?"
                        bg={inputBg}
                        borderRadius="lg"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium">Nama Inovator</FormLabel>
                      <Input
                        name="inovator_nama"
                        value={innovationData.inovator_nama}
                        onChange={handleInputChange}
                        placeholder="Nama Individu, Tim, atau Instansi"
                        bg={inputBg}
                        borderRadius="lg"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium">Status Paten</FormLabel>
                      <Input
                        name="inovator_status_paten"
                        value={innovationData.inovator_status_paten}
                        onChange={handleInputChange}
                        placeholder="Sudah Terdaftar / Dalam Proses / Belum Ada"
                        bg={inputBg}
                        borderRadius="lg"
                      />
                    </FormControl>

                    <Button
                      type="submit"
                      colorScheme="blue"
                      size="lg"
                      borderRadius="xl"
                      isLoading={loading}
                      loadingText="Menyimpan..."
                    >
                      Simpan ke Chatbot
                    </Button>
                  </Stack>
                </form>
              </TabPanel>

              {/* DOKUMEN */}
              <TabPanel p={0}>
                <VStack
                  spacing={5}
                  bg={cardBg}
                  p={{ base: 5, md: 7 }}
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor={borderColor}
                  shadow="lg"
                  align="stretch"
                >
                  <FormControl isRequired>
                    <FormLabel fontWeight="medium">Nama Dokumen</FormLabel>
                    <Input
                      placeholder="Contoh: Dokumen Kebijakan Desa 2024"
                      value={customSourceName}
                      onChange={(e) => setCustomSourceName(e.target.value)}
                      bg={inputBg}
                      borderRadius="lg"
                    />
                  </FormControl>

                  {/* Upload Box */}
                  <Box
                    border="2px dashed"
                    borderColor={selectedFile ? "blue.400" : borderColor}
                    bg={inputBg}
                    p={10}
                    borderRadius="xl"
                    textAlign="center"
                    cursor="pointer"
                    onClick={() => fileInputRef.current?.click()}
                    _hover={{ bg: hoverBg }}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      hidden
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />

                    <Icon as={FiFileText} w={10} h={10} mb={3} />

                    <Text fontWeight="medium">
                      {selectedFile
                        ? selectedFile.name
                        : "Klik untuk upload PDF"}
                    </Text>

                    <Text fontSize="sm" color="gray.500">
                      Akan diproses per halaman menjadi embedding
                    </Text>
                  </Box>

                  {selectedFile && (
                    <Flex
                      justify="space-between"
                      align="center"
                      bg="blue.50"
                      p={3}
                      borderRadius="lg"
                    >
                      <Text fontSize="sm" fontWeight="medium">
                        {selectedFile.name}
                      </Text>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        Hapus
                      </Button>
                    </Flex>
                  )}

                  <Button
                    colorScheme="blue"
                    size="lg"
                    borderRadius="xl"
                    leftIcon={<FiUpload />}
                    onClick={handleFileUpload}
                    isLoading={loading}
                    isDisabled={!selectedFile}
                  >
                    Mulai Ingestion
                  </Button>

                  {loading && (
                    <Flex direction="column" align="center" py={3}>
                      <Spinner />
                      <Text fontSize="sm" mt={2}>
                        Processing embedding...
                      </Text>
                    </Flex>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>
    </Container>
  );
}