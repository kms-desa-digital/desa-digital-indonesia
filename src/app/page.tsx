"use client";

import { AddIcon } from "@chakra-ui/icons";
import {
  Box,
  Flex,
  IconButton,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import Ads from "Components/ads/Ads";
import BestBanner from "Components/banner/BestBanner";
import Container from "Components/container";
import Dashboard from "Components/dashboard/dashboard";
import Loading from "Components/loading";
import Rediness from "Components/rediness/Rediness";
import SearchBarLink from "src/components/home/search/SearchBarLink";
import TopBar from "Components/topBar";
import { paths } from "Consts/path";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useUser } from "src/contexts/UserContext";
import { getInnovation } from "src/services/innovationServices";
import Hero from "src/components/home/hero";
import Innovator from "src/components/home/innovator";
import Villages from "src/components/home/villages";
import Menu from "src/components/home/menu";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "Components/topBar/LanguageSwitcher";

export default function Home() {
  type HomeSuggestion = {
    id: string;
    title: string;
    subtitle?: string;
    images?: string[];
    kategori?: string;
    deskripsi?: string;
    tahunDibuat?: string;
    innovatorLogo?: string;
    innovatorName?: string;
  };

  const sortByRelevance = (items: any[], keyword: string) => {
    const normalizedKeyword = keyword.toLowerCase().trim();

    const scoreItem = (item: any) => {
      const fields = [item.namaInovasi, item.innovatorName, item.namaInnovator, item.kategori, item.deskripsi]
        .filter(Boolean)
        .map((field) => String(field).toLowerCase());

      const exactTitle = fields[0] === normalizedKeyword;
      const titleStartsWith = fields[0]?.startsWith(normalizedKeyword);
      const fieldContains = fields.some((field) => field.includes(normalizedKeyword));

      if (exactTitle) return 0;
      if (titleStartsWith) return 1;
      if (fieldContains) return 2;
      return 3;
    };

    return [...items].sort((a, b) => scoreItem(a) - scoreItem(b));
  };

  const t = useTranslations("Home");
  const router = useRouter();
  const { role, isInnovatorVerified, loading } = useUser()
  const [searchValue, setSearchValue] = useState("");
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<HomeSuggestion[]>([]);

  const showSuggestions = isSearchFocused && searchValue.trim().length > 0;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter no longer navigates — use the "Cari" button instead
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleSearchClick = () => {
    if (searchValue.trim()) {
      setIsSearchFocused(false);
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleSuggestionClick = (item: HomeSuggestion) => {
    setIsSearchFocused(false);
    setSearchValue(item.title);
    router.push(paths.INNOVATION_DETAIL.replace(":id", item.id));
  };

  useEffect(() => {
    const keyword = searchValue.trim();

    if (!keyword) {
      setSuggestions([]);
      setIsSuggestionsLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSuggestionsLoading(true);

      try {
        const response: any = await getInnovation({
          search: keyword,
          status: "Terverifikasi",
        });

        const innovationList = Array.isArray(response?.innovations)
          ? response.innovations
          : [];

        const rankedInnovations = sortByRelevance(innovationList, keyword);

        const nextSuggestions: HomeSuggestion[] = rankedInnovations
          .slice(0, 4)
          .map((item: any) => ({
            id: String(item.id || item._id),
            title: item.namaInovasi || "Tanpa Judul",
            subtitle: item.namaInnovator || item.innovatorName || item.kategori,
            images: item.images,
            kategori: item.kategori,
            deskripsi: item.deskripsi,
            tahunDibuat: item.tahunDibuat,
            innovatorLogo: item.innovatorLogo,
            innovatorName: item.innovatorName || item.namaInnovator,
          }))
          .filter((item: HomeSuggestion) => Boolean(item.id));

        setSuggestions(nextSuggestions);
      } catch (error) {
        console.error("Error fetching home suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  useEffect(() => {
    const handleChatbotStateChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ isOpen?: boolean }>;
      setIsChatbotOpen(Boolean(customEvent.detail?.isOpen));
    };

    window.addEventListener("chatbot:stateChanged", handleChatbotStateChanged);

    return () => {
      // Cleanup the event listener
      window.removeEventListener("chatbot:stateChanged", handleChatbotStateChanged);
    };
  }, []);

  useEffect(() => {
    if (!loading && role === "admin") {
      router.push(paths.ADMIN_PAGE);
    }
  }, [role, loading, router]);

  if (loading) {
    return <Loading />
  }

  const handleAddInnovationClick = () => {
    if (role === "innovator" && isInnovatorVerified) {
      // Assuming paths.ADD_INNOVATION is correct (e.g. /innovation/add)
      router.push(paths.ADD_INNOVATION);
    } else {
      toast.warning(
        t("toastInnovatorNotVerified"),
        {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      );
    }
  };

  return (
    <Container page>
      <TopBar
        title={t("title")}
        rightElement={<LanguageSwitcher />}
      />
      <Hero
        description={t("description")}
        text={t("country")}
        isAdmin={role === "admin"}
        isInnovator={role === "innovator"}
        isVillage={role === "village"}
      />
      <Stack direction="column" gap={2}>
        <SearchBarLink
          placeholderText={t("searchPlaceholder")}
          value={searchValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
          highlightQuery={searchValue}
          showSuggestions={showSuggestions}
          isSuggestionsLoading={isSuggestionsLoading}
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
          showSearchButton={true}
          onSearchClick={handleSearchClick}
        />
        <Menu />
        <Flex direction="row" justifyContent="space-between" padding="0 14px">
          <Rediness />
          <Ads />
        </Flex>
        {(role === "village" || role === "innovator") && <Dashboard />}
        <BestBanner />
        <Box mt="120px">
          <Innovator />
        </Box>
        <Box mt="-32px">
          <Villages />
        </Box>
      </Stack>
      {role === "innovator" && !isChatbotOpen && (
        <Tooltip
          label={t("addInnovation")}
          aria-label="Tambah Inovasi Tooltip"
          placement="top"
          hasArrow
          bg="#347357"
          color="white"
          fontSize="12px"
          p={1}
          borderRadius="8"
        >
          <IconButton
            icon={<AddIcon />}
            aria-label="Tambah Inovasi"
            borderRadius="50%"
            width="60px"
            height="60px"
            padding="0"
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="fixed"
            right={{ base: "20px", md: "calc(50% - 160px)" }}
            bottom="128px"
            zIndex="1000"
            onClick={handleAddInnovationClick}
          />
        </Tooltip>
      )}
    </Container>
  );
}
