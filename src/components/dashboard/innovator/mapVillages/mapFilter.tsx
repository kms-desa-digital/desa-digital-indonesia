import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Select,
  Text,
  VStack,
  Box,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";

interface DesaPin {
  desaId: string;
  namaDesa: string;
  lat: number;
  lng: number;
  provinsi: string;
  rawProvinsi?: string;
  kabupatenKota?: string;
  kecamatan?: string;
  inovasiId: string;
  inovasiList: string[];
}

interface FilterValues {
  provinsi: string;
  kabupatenKota: string;
  kecamatan: string;
  namaDesa: string;
}

const ProvinceFilter = ({
  isOpen,
  onClose,
  onApply,
  allPins,
  currentFilters,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  allPins: DesaPin[];
  currentFilters: FilterValues;
}) => {
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedKabupaten, setSelectedKabupaten] = useState("");
  const [selectedKecamatan, setSelectedKecamatan] = useState("");
  const [selectedDesa, setSelectedDesa] = useState("");

  // Sync state with currentFilters when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProvince(currentFilters.provinsi);
      setSelectedKabupaten(currentFilters.kabupatenKota);
      setSelectedKecamatan(currentFilters.kecamatan);
      setSelectedDesa(currentFilters.namaDesa);
    }
  }, [isOpen, currentFilters]);

  // Unique options based on cascading selections
  const provinces = Array.from(
    new Set(allPins.map((p) => p.rawProvinsi || p.provinsi).filter(Boolean))
  ).sort();

  const kabupatens = selectedProvince
    ? Array.from(
        new Set(
          allPins
            .filter((p) => (p.rawProvinsi || p.provinsi) === selectedProvince)
            .map((p) => p.kabupatenKota)
            .filter(Boolean)
        )
      ).sort()
    : [];

  const kecamatans = selectedKabupaten
    ? Array.from(
        new Set(
          allPins
            .filter((p) => p.kabupatenKota === selectedKabupaten)
            .map((p) => p.kecamatan)
            .filter(Boolean)
        )
      ).sort()
    : [];

  const desas = selectedKecamatan
    ? Array.from(
        new Set(
          allPins
            .filter((p) => p.kecamatan === selectedKecamatan)
            .map((p) => p.namaDesa)
            .filter(Boolean)
        )
      ).sort()
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent maxW="340px" borderRadius="xl">
        <ModalHeader fontSize="16px" fontWeight="bold">Filter Wilayah</ModalHeader>
        <ModalCloseButton mt={2} mr={2} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Province Select */}
            <Box>
              <Text mb={1} fontSize="xs" fontWeight="medium" color="gray.600">Provinsi:</Text>
              <Select
                placeholder="Semua Provinsi"
                size="sm"
                borderRadius="md"
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedKabupaten("");
                  setSelectedKecamatan("");
                  setSelectedDesa("");
                }}
              >
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </Select>
            </Box>

            {/* Regency Select */}
            <Box>
              <Text mb={1} fontSize="xs" fontWeight="medium" color="gray.600">Kabupaten/Kota:</Text>
              <Select
                placeholder={selectedProvince ? "Semua Kabupaten/Kota" : "Pilih Provinsi terlebih dahulu"}
                size="sm"
                borderRadius="md"
                isDisabled={!selectedProvince}
                value={selectedKabupaten}
                onChange={(e) => {
                  setSelectedKabupaten(e.target.value);
                  setSelectedKecamatan("");
                  setSelectedDesa("");
                }}
              >
                {kabupatens.map((kab) => (
                  <option key={kab} value={kab}>
                    {kab}
                  </option>
                ))}
              </Select>
            </Box>

            {/* District Select */}
            <Box>
              <Text mb={1} fontSize="xs" fontWeight="medium" color="gray.600">Kecamatan:</Text>
              <Select
                placeholder={selectedKabupaten ? "Semua Kecamatan" : "Pilih Kabupaten/Kota terlebih dahulu"}
                size="sm"
                borderRadius="md"
                isDisabled={!selectedKabupaten}
                value={selectedKecamatan}
                onChange={(e) => {
                  setSelectedKecamatan(e.target.value);
                  setSelectedDesa("");
                }}
              >
                {kecamatans.map((kec) => (
                  <option key={kec} value={kec}>
                    {kec}
                  </option>
                ))}
              </Select>
            </Box>

            {/* Village Select */}
            <Box>
              <Text mb={1} fontSize="xs" fontWeight="medium" color="gray.600">Nama Desa:</Text>
              <Select
                placeholder={selectedKecamatan ? "Semua Desa" : "Pilih Kecamatan terlebih dahulu"}
                size="sm"
                borderRadius="md"
                isDisabled={!selectedKecamatan}
                value={selectedDesa}
                onChange={(e) => setSelectedDesa(e.target.value)}
              >
                {desas.map((desa) => (
                  <option key={desa} value={desa}>
                    {desa}
                  </option>
                ))}
              </Select>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            bg="#1E5631"
            color="white"
            _hover={{ bg: "#16432D" }}
            width="100%"
            size="sm"
            onClick={() => {
              onApply({
                provinsi: selectedProvince,
                kabupatenKota: selectedKabupaten,
                kecamatan: selectedKecamatan,
                namaDesa: selectedDesa,
              });
              onClose();
            }}
          >
            Terapkan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProvinceFilter;