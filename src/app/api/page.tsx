"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Code,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Stack,
  Link,
  IconButton,
} from "@chakra-ui/react";
import Container from "Components/container";
import TopBar from "Components/topBar";
import { ChevronLeftIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";

interface Endpoint {
  method: string;
  url: string;
  desc: string;
  body?: any;
  params?: string[];
  auth?: string;
}

const ENDPOINTS: Record<string, Endpoint[]> = {
  Auth: [
    {
      method: "POST",
      url: "/api/auth/register",
      desc: "Mendaftarkan user baru.",
      body: { email: "string", password: "string", role: "innovator | village" },
    },
    {
      method: "POST",
      url: "/api/auth/login",
      desc: "Login user dan mendapatkan JWT token.",
      body: { email: "string", password: "string" },
    },
    {
      method: "GET",
      url: "/api/auth/me",
      desc: "Mendapatkan profil user yang sedang login.",
      auth: "Bearer Token",
    },
    {
      method: "GET",
      url: "/api/auth/users",
      desc: "Melihat daftar semua user.",
    },
    {
      method: "POST",
      url: "/api/auth/email-reset",
      desc: "Membuat link reset password Firebase (custom) dan mengirim email reset.",
      body: { email: "string" },
    },
    {
      method: "POST",
      url: "/api/auth/forgot-password",
      desc: "Deprecated: reset password lama tidak digunakan lagi. Gunakan Firebase Auth.",
      body: { email: "string", newPassword: "string", token: "string" },
    },
  ],
  Innovations: [
    {
      method: "GET",
      url: "/api/innovations",
      desc: "Mengambil daftar inovasi.",
      params: ["category", "status", "innovatorId"],
    },
    {
      method: "POST",
      url: "/api/innovations",
      desc: "Menambahkan inovasi baru.",
      body: { namaInovasi: "string", kategori: "string", deskripsi: "string", etc: "..." },
    },
    {
      method: "GET",
      url: "/api/innovations/categories",
      desc: "Mengambil kategori inovasi dan jumlahnya.",
      params: ["name"],
    },
    {
      method: "GET",
      url: "/api/innovations/[id]",
      desc: "Detail satu inovasi.",
    },
    {
      method: "PUT",
      url: "/api/innovations/[id]",
      desc: "Mengupdate data inovasi.",
    },
    {
      method: "DELETE",
      url: "/api/innovations/[id]",
      desc: "Menghapus inovasi.",
    },
    {
      method: "GET",
      url: "/api/innovations/[id]/villages",
      desc: "Melihat desa yang menerapkan inovasi ini.",
    },
  ],
  Villages: [
    {
      method: "GET",
      url: "/api/villages",
      desc: "Melihat daftar desa.",
      params: ["status"],
    },
    {
      method: "POST",
      url: "/api/villages",
      desc: "Membuat profil desa baru.",
      body: { userId: "string", namaDesa: "string", deskripsi: "string" },
    },
    {
      method: "GET",
      url: "/api/villages/[id]",
      desc: "Detail profil desa.",
    },
    {
      method: "PUT",
      url: "/api/villages/[id]",
      desc: "Update profil desa.",
    },
    {
      method: "POST",
      url: "/api/villages/claim",
      desc: "Mengajukan klaim inovasi (Manual & Otomatis).",
      body: { namaInovasi: "string", namaInovator: "string", buktiJenis: "string[]", etc: "..." },
    },
    {
      method: "GET",
      url: "/api/villages/claim",
      desc: "Melihat daftar klaim inovasi.",
      params: ["desaId", "status"],
    },
    {
      method: "GET",
      url: "/api/villages/[id]/innovations",
      desc: "Inovasi yang sudah diterapkan di desa ini.",
    },
    {
      method: "GET",
      url: "/api/villages/dashboard",
      desc: "Mengambil data statistik untuk dashboard akun desa.",
    },
  ],
  Chat: [
    {
      method: "POST",
      url: "/api/chat",
      desc: "Chat dengan asisten AI (RAG based).",
      body: { messages: [{ role: "user", content: "string" }] },
    },
  ],
  Admin: [
    {
      method: "GET",
      url: "/api/admin/dashboard",
      desc: "Mengambil data statistik komprehensif untuk dashboard admin.",
    },
    {
      method: "POST",
      url: "/api/admin/verify/village/[id]",
      desc: "Memverifikasi atau menolak profil desa.",
      body: { status: "Terverifikasi | Ditolak", catatanAdmin: "string?" },
    },
    {
      method: "POST",
      url: "/api/admin/verify/innovator/[id]",
      desc: "Memverifikasi atau menolak profil inovator.",
      body: { status: "Terverifikasi | Ditolak", catatanAdmin: "string?" },
    },
  ],
  Ministry: [
    {
      method: "GET",
      url: "/api/ministry/dashboard",
      desc: "Mengambil data rekapitulasi statistik untuk dashboard kementerian.",
    },
  ],
  Innovator: [
    {
      method: "GET",
      url: "/api/innovator",
      desc: "Mengambil daftar inovator.",
      params: ["status"],
    },
    {
      method: "GET",
      url: "/api/innovator/dashboard",
      desc: "Mengambil data statistik dan performa untuk dashboard inovator.",
    },
    {
      method: "GET",
      url: "/api/innovator/profile",
      desc: "Mengambil profil detail milik inovator yang sedang login.",
    },
    {
      method: "POST",
      url: "/api/innovator/profile/[id]",
      desc: "Membuat atau mengupdate profil inovator. Field wajib: namaInovator, deskripsi, kategori, whatsapp.",
      body: {
        namaInovator: "string",
        deskripsi: "string",
        kategori: "string",
        whatsapp: "string",
        instagram: "string?",
        website: "string?",
        logo: "string?",
        status: "string?"
      },
    },
    {
      method: "GET",
      url: "/api/innovator/detail",
      desc: "Melihat detail spesifik data inovator secara terperinci.",
      params: ["id"],
    },
    {
      method: "PUT",
      url: "/api/innovator/edit",
      desc: "Melakukan update terhadap data profil inovator.",
      body: { namaInovator: "string", kategori: "string", etc: "..." },
    },
  ],
};

const MethodBadge = ({ method }: { method: string }) => {
  const colors: Record<string, string> = {
    GET: "blue",
    POST: "green",
    PUT: "orange",
    DELETE: "red",
  };
  return (
    <Badge colorScheme={colors[method]} width="60px" textAlign="center">
      {method}
    </Badge>
  );
};

export default function ApiDocumentation() {
  const router = useRouter();

  return (
    <Container page>
      <TopBar
        title="API Documentation"
        onBack={() => router.back()}
      />

      <VStack spacing={6} align="stretch" p={4} mb={20}>
        <Box>
          <Heading size="md" color="#347357">KMS Desa Digital API</Heading>
          <Text fontSize="sm" color="gray.600">
            Dokumentasi teknis untuk pengembangan sistem Desa Digital Indonesia.
            Base URL: <Code>http://localhost:3000</Code>
          </Text>
        </Box>

        <Accordion allowMultiple defaultIndex={[0, 1, 2, 3]}>
          {Object.entries(ENDPOINTS).map(([category, list]) => (
            <AccordionItem key={category} border="none" mb={4}>
              <AccordionButton
                bg="gray.50"
                _hover={{ bg: "gray.100" }}
                borderRadius="md"
                p={3}
              >
                <Box flex="1" textAlign="left" fontWeight="bold">
                  {category}
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={4} align="stretch" mt={2}>
                  {list.map((api: Endpoint, idx: number) => (
                    <Box
                      key={idx}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor="gray.100"
                    >
                      <HStack wrap="wrap" spacing={3}>
                        <MethodBadge method={api.method} />
                        <Code fontSize="sm" bg="transparent" fontWeight="bold">
                          {api.url}
                        </Code>
                      </HStack>
                      <Text mt={2} fontSize="xs" color="gray.600">
                        {api.desc}
                      </Text>

                      {api.params && (
                        <Box mt={2}>
                          <Text fontSize="xs" fontWeight="bold">Query Params:</Text>
                          <HStack spacing={1} mt={1}>
                            {api.params.map((p: string) => (
                              <Badge key={p} variant="outline" fontSize="9px">{p}</Badge>
                            ))}
                          </HStack>
                        </Box>
                      )}

                      {api.body && (
                        <Box mt={2} bg="gray.50" p={2} borderRadius="sm">
                          <Text fontSize="xs" fontWeight="bold" mb={1}>Request Body Example:</Text>
                          <Code fontSize="10px" display="block" whiteSpace="pre" w="full" bg="transparent">
                            {JSON.stringify(api.body, null, 2)}
                          </Code>
                        </Box>
                      )}

                      {api.auth && (
                        <Badge colorScheme="purple" fontSize="9px" mt={2}>
                          Auth: {api.auth}
                        </Badge>
                      )}
                    </Box>
                  ))}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>

        <Divider />

        <Box textAlign="center" py={4}>
          <Text fontSize="xs" color="gray.400">
            Desa Digital v3 &copy; 2026
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
