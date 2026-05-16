import React from "react";
import { Flex, Text, Box } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import CardInnovation from "Components/card/innovation";
import { paths } from "Consts/path";

const InnovationPreview = ({ innovations, innovatorId }: any) => {
  const router = useRouter();
  const handleClick = (id: string) => {
    const path = paths.DETAIL_INNOVATION_PAGE.replace(':id', id);
    router.push(path);
  }

  // Cek jumlah inovasi
  const hasMoreInnovations = innovations.length > 2;

  return (
    <Flex direction="row" gap={4} mt={2}>
      {innovations.slice(0, 5).map((innovation: any, idx: number) => (
        <Box key={innovation.id || idx} width="calc(50% - 8px)" display="flex" flexDirection="column" >
          <CardInnovation
            images={innovation.images}
            namaInovasi={innovation.namaInovasi}
            kategori={innovation.kategori}
            deskripsi={innovation.deskripsi}
            tahunDibuat={innovation.tahunDibuat}
            innovatorLogo={innovation.innovatorImgURL}
            innovatorName={innovation.namaInnovator}
            jumlahDesa={innovation.jumlahDesa || 0}
            onClick={() => handleClick(innovation.id)}
          />
        </Box>
      ))}
    </Flex>

  );
};

export default InnovationPreview;
