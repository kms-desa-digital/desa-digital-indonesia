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
import React from "react";
import { useRouter } from "next/navigation";


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
  console.log("ini innovationId", innovationId)

  const router = useRouter()
  const { data, loading, error } = useRecommendations(innovationId, 4)
  const recs = data?.data || [];

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
          {loading && <Spinner mt={4} display="block" mx="auto" />}
          {!loading && !error && (
            <SimpleGrid columns={{ base: 2 }} spacing={4} mt={4}>
              {recs.map((r: any) => (
                <CardInnovation
                  key={r.id}
                  images={r.images ? r.images : ["/images/default-header.svg"]}
                  namaInovasi={r.inovasi}
                  kategori={r.kategori}
                  deskripsi={r.deskripsi}
                  tahunDibuat={r.tahunDibuat}
                  innovatorName={r.namaInnovator}
                  onClick={() => router.push(`/innovation/detail/${r.id}`)}
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
            onClick={() => { }}
          >
            Kembali ke Beranda
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
export default RecommendationDrawer;
