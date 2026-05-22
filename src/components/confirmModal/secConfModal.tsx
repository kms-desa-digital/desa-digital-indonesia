import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  Flex,
  Image,
  Button,
  Text,
  Link,
  SimpleGrid,
  Spinner
} from "@chakra-ui/react";
import SmileRobot from "@public/icons/smile-robot.svg";
import { useRouter } from "next/navigation";
import { useRecommendations } from "Hooks/useRecommendation";
import { getInnovation } from "Services/innovationServices";
import CardInnovation from "Components/card/innovation";
import { auth } from "src/firebase/clientApp";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalBody2: string;    // Prop untuk konten modal
  onDone?: () => void;
  isRegularClaim?: boolean;
  innovationId?: string;
}

const ConfModal: React.FC<ClaimModalProps> = ({
  isOpen,
  onClose,
  modalBody2,
  onDone,
  isRegularClaim,
  innovationId,
}) => {
  const router = useRouter();

  // Load recommendations
  const { data: recData, loading: loadingRecs } = useRecommendations(
    isRegularClaim && innovationId ? innovationId : "",
    4
  );

  // Load fallback leaderboard list and metadata mapping
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [verifiedMap, setVerifiedMap] = useState<Map<string, any>>(new Map());
  const [loadingVerified, setLoadingVerified] = useState(true);

  useEffect(() => {
    if (!isRegularClaim || !innovationId) return;

    setLoadingVerified(true);
    getInnovation({ status: "Terverifikasi" })
      .then((res) => {
        const list = res.innovations || [];
        const map = new Map<string, any>();
        list.forEach((item: any) => {
          const key = item.id || item._id;
          if (key) map.set(key, item);
        });
        setVerifiedMap(map);

        const sorted = [...list]
          .sort((a, b) => (b.jumlahDesa || 0) - (a.jumlahDesa || 0))
          .filter((item) => (item.id || item._id) !== innovationId);
        setLeaderboard(sorted);
      })
      .catch((err) => console.error("Error fetching verified innovations:", err))
      .finally(() => setLoadingVerified(false));
  }, [isRegularClaim, innovationId]);

  const recs = recData?.data || [];

  const finalRecs = useMemo(() => {
    if (!isRegularClaim || !innovationId) return [];

    const mapped = recs.map((item: any) => {
      const verifiedItem = verifiedMap.get(item.id);
      if (verifiedItem) return verifiedItem;

      return {
        id: item.id,
        namaInovasi: item.inovasi || item.namaInovasi,
        deskripsi: item.deskripsi,
        kategori: item.kategori,
        namaInnovator: item.namaInnovator || "Umum",
        jumlahDesa: item.jumlahDesa || 0,
        fotoInovasi: item.images || item.fotoInovasi || [],
        images: item.images || item.fotoInovasi || []
      };
    });

    if (mapped.length > 0) {
      return mapped.slice(0, 4);
    }

    return leaderboard.slice(0, 4);
  }, [isRegularClaim, innovationId, recs, verifiedMap, leaderboard]);

  const isLoading = loadingRecs && loadingVerified;

  const handleClose = () => {
    if (onDone) onDone();
    onClose();
  };

  if (!isRegularClaim || !innovationId) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xs" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalBody paddingTop={4}>
            <Flex direction={'column'} alignItems={'center'} fontSize="12px" textAlign={'center'}>
              <Image src={SmileRobot.src} alt="question robot" boxSize={14} color="green.500" />
              {modalBody2}
            </Flex>
          </ModalBody>
          <ModalFooter paddingTop={2} justifyContent={'center'} >
            <Button borderRadius={4} onClick={onClose} size={'xs'} paddingInline={6} fontWeight={500} fontSize="11px">Oke</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxW="380px" borderRadius="16px" overflow="hidden" py={4} px={2}>
        <ModalBody>
          <Flex direction={'column'} alignItems={'center'} fontSize="12px" textAlign={'center'} mb={4}>
            <Image src={SmileRobot.src} alt="success robot" boxSize={14} color="green.500" />
            <Text fontSize="12px" fontWeight={400} textAlign="center" mt={2} px={2} color="gray.600">
              Pengajuan klaim berhasil dikirimkan dan menunggu verifikasi oleh admin. Pengajuan ini akan disimpan pada halaman{" "}
              <Link
                color="blue.500"
                onClick={() => {
                  handleClose();
                  router.push(`/village/pengajuan/${auth.currentUser?.uid}`);
                }}
                cursor="pointer"
                fontWeight="500"
                style={{ textDecoration: 'underline' }}
              >
                Pengajuan klaim
              </Link>
              .
            </Text>
          </Flex>

          <Text fontSize="14px" fontWeight={700} color="gray.800" textAlign="center" mb={4}>
            Rekomendasi Inovasi Lainnya untuk Desamu
          </Text>

          {isLoading ? (
            <Flex justify="center" align="center" py={6}>
              <Spinner size="md" color="green.500" />
            </Flex>
          ) : (
            <SimpleGrid columns={2} spacing={3} mb={4}>
              {finalRecs.map((r: any) => (
                <CardInnovation
                  key={r.id || r._id}
                  images={r.fotoInovasi && r.fotoInovasi.length > 0 ? r.fotoInovasi : (r.images && r.images.length > 0 ? r.images : ["/images/default-logo.svg"])}
                  namaInovasi={r.namaInovasi}
                  kategori={r.kategori}
                  deskripsi={r.deskripsi}
                  tahunDibuat={r.tahunDibuat}
                  innovatorName={r.namaInnovator}
                  jumlahDesa={r.jumlahDesa}
                  onClick={() => {
                    handleClose();
                    router.push(`/innovation/detail/${r.id || r._id}`);
                  }}
                  style={{
                    minWidth: "unset",
                    maxWidth: "unset",
                    width: "100%",
                  }}
                />
              ))}
            </SimpleGrid>
          )}
        </ModalBody>
        <ModalFooter justifyContent={'center'} pt={0}>
          <Button
            borderRadius={8}
            colorScheme="green"
            bg="green.600"
            _hover={{ bg: "green.700" }}
            onClick={handleClose}
            width="100%"
            py={5}
            fontWeight={600}
            fontSize="14px"
          >
            Kembali ke Beranda
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfModal;

