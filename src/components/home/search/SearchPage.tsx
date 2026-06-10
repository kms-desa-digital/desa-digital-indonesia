import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import CardInnovation from "Components/card/innovation";
import Container from "Components/container";
import TopBar from "Components/topBar";
import SearchBarLink from "./SearchBarLink";
import { getInnovation } from "Services/innovationServices";
import { paths } from "Consts/path";

interface InovationData {
  id: string;
  namaInovasi?: string;
  kategori?: string;
  deskripsi?: string;
  tahunDibuat?: string;
  images?: string[];
  innovatorLogo?: string;
  innovatorName?: string;
  manfaat?: { deskripsi: string }[];
  status?: string;
  [key: string]: any;
}

function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearchTerm = searchParams.get("q")?.toLowerCase().trim() || "";
  const [results, setResults] = useState<InovationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState(initialSearchTerm);

  const sortByRelevance = (items: InovationData[], keyword: string) => {
    const normalizedKeyword = keyword.toLowerCase().trim();

    const scoreItem = (item: InovationData) => {
      const fields = [
        item.namaInovasi,
        item.innovatorName,
        item.kategori,
        item.deskripsi,
      ]
        .filter(Boolean)
        .map((field) => String(field).toLowerCase());

      const title = fields[0] || "";
      const exactTitle = title === normalizedKeyword;
      const titleStartsWith = title.startsWith(normalizedKeyword);
      const fieldContains = fields.some((field) => field.includes(normalizedKeyword));

      if (exactTitle) return 0;
      if (titleStartsWith) return 1;
      if (fieldContains) return 2;
      return 3;
    };

    return [...items].sort((a, b) => scoreItem(a) - scoreItem(b));
  };

  const fetchData = debounce(async (keyword: string) => {
    setLoading(true);
    setResults([]);

    try {
      const res: any = await getInnovation({
        search: keyword || undefined,
        status: "Terverifikasi",
      });
      const innovations = sortByRelevance(res.innovations || [], keyword);
      setResults(innovations);
    } catch (error) {
      console.error("Error fetching data via API:", error);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    fetchData(searchValue.toLowerCase().trim());
    return () => fetchData.cancel();
  }, [searchValue]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCardClick = (id: string) => {
    router.push(paths.INNOVATION_DETAIL.replace(":id", id));
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchValue(e.currentTarget.value.trim());
      router.push(`/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
    }
  };

  return (
    <Container page>
      <TopBar title="Hasil Pencarian" onBack={() => router.push(paths.LANDING_PAGE)} />
      <Box px={5} py={8}>
        <SearchBarLink
          key={searchParams.toString()}
          placeholderText="Cari Inovasi di sini..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleSearchSubmit}
          width="100%"
          maxW="100%"
        />

        <Flex align="center" mb={2} mt={6}>
          <Heading fontSize="15px" fontWeight="800" color="gray.700">
            Hasil Pencarian: &quot;{searchValue || 'Semua Inovasi'}&quot;
          </Heading>
        </Flex>

        {loading ? (
          <Text color="gray.500" fontSize="12px">
            Sedang mencari...
          </Text>
        ) : results.length === 0 ? (
          <Text fontSize="12px" color="gray.500">
            Tidak ada inovasi yang ditemukan.
          </Text>
        ) : (
          <Box
            display="grid"
            gridTemplateColumns="repeat(2, 1fr)"
            gap={4}
            mt={3}
          >
            {results.map((item) => (
              <CardInnovation
                key={item.id}
                images={item.images}
                namaInovasi={item.namaInovasi}
                kategori={item.kategori}
                deskripsi={item.deskripsi}
                tahunDibuat={item.tahunDibuat}
                innovatorLogo={item.innovatorLogo}
                innovatorName={item.innovatorName}
                highlightQuery={searchValue}
                jumlahDesa={item.jumlahDesa || 0}
                onClick={() => handleCardClick(item.id)}
                style={{ minWidth: "unset", maxWidth: "unset", width: "100%" }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default SearchPage;
