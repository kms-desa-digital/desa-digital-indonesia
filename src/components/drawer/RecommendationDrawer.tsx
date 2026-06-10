import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Image,
  Link,
  SimpleGrid,
  Spinner,
  Text
} from "@chakra-ui/react";

import CardInnovation from "Components/card/innovation";
import { paths } from "Consts/path";
import { useRecommendations } from "Hooks/useRecommendation";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getInnovation } from "Services/innovationServices";

type RecommendationDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  innovationId: string;
};

const RecommendationDrawer: React.FC<RecommendationDrawerProps> = ({
  isOpen,
  onClose,
  innovationId,
}) => {
  const router = useRouter();
  
  // Ambil rekomendasi machine learning / similarity
  const { data, loading: loadingRecs, error } = useRecommendations(innovationId, 4);
  
  // Ambil data terverifikasi (leaderboard) sebagai fallback jika ML kosong atau gagal
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    getInnovation({ status: "Terverifikasi" })
      .then((res) => {
        const list = res.innovations || [];
        const sorted = [...list]
          .sort((a, b) => (b.jumlahDesa || 0) - (a.jumlahDesa || 0))
          .filter((item) => item.id !== innovationId); // Jangan tampilkan inovasi yang sama
        setLeaderboard(sorted);
      })
      .catch((err) => console.error("Error fetching fallback leaderboard:", err))
      .finally(() => setLoadingLeaderboard(false));
  }, [innovationId]);

  const recs = data?.data || [];
  
  // Jika data dari FastAPI kosong/error, gunakan top 4 leaderboard terpopuler!
  const finalRecs = recs.length > 0 
    ? recs.slice(0, 4)
    : leaderboard.slice(0, 4).map(item => ({
        id: item.id || item._id,
        images: item.fotoInovasi || item.images || ["/images/default-logo.svg"],
        inovasi: item.namaInovasi,
        kategori: item.kategori,
        deskripsi: item.deskripsi,
        tahunDibuat: item.tahunDibuat,
        namaInnovator: item.namaInnovator || "Umum"
      }));

  const isLoading = loadingRecs && loadingLeaderboard;

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent
        sx={{
          borderRadius: "lg",
          width: "360px",
          my: "auto",
          mx: "auto",
        }}
      >
        <DrawerHeader>
          <DrawerCloseButton
            position="absolute"
            top={2}
            right={2}
            color="gray.500"
            _hover={{ color: "gray.700" }}
            _focus={{ boxShadow: "none" }}
            _active={{ boxShadow: "none" }}
          />
          <Flex justifyContent="center" alignItems="center" direction="column">
            <Image
              src="/icons/smile-robot.svg"
              alt="robot"
              boxSize={14}
              color="green.500"
            />
            <Text fontSize="12px" fontWeight={400} textAlign="center" mt={2}>
              Pengajuan klaim berhasil dikirimkan dan menunggu verifikasi oleh
              admin. Pengajuan ini akan disimpan pada halaman{" "}
              <Link color="blue.500" href="#">
                Pengajuan klaim.
              </Link>
            </Text>
          </Flex>
        </DrawerHeader>
        <DrawerBody>
          <Text fontSize="14px" fontWeight={700} textAlign="center">
            Rekomendasi Inovasi Lainnya untuk Desamu
          </Text>
          {isLoading && <Spinner mt={4} display="block" mx="auto" />}
          {!isLoading && (
            <SimpleGrid columns={{ base: 2 }} spacing={4} mt={4}>
              {finalRecs.map((r: any) => (
                <CardInnovation
                  key={r.id}
                  images={r.images && r.images.length > 0 ? r.images : ["/images/default-logo.svg"]}
                  namaInovasi={r.inovasi}
                  kategori={r.kategori}
                  deskripsi={r.deskripsi}
                  tahunDibuat={r.tahunDibuat}
                  innovatorLogo={r.innovatorImgURL || r.logo || r.logoInovator || r.innovatorLogo}
                  innovatorName={r.namaInnovator || r.namaInovator || r.innovatorName}
                  onClick={() => {
                    onClose();
                    router.push(`/innovation/detail/${r.id}`);
                  }}
                />
              ))}
            </SimpleGrid>
          )}
        </DrawerBody>
        <DrawerFooter>
          <Button
            variant="solid"
            colorScheme="blue"
            size="sm"
            width="100%"
            onClick={() => {
              onClose();
              router.push(paths.VILLAGE_DASHBOARD);
            }}
          >
            Kembali ke Beranda
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default RecommendationDrawer;
