"use client";

import { Box, Flex, Stack } from "@chakra-ui/react";
import Ads from "Components/ads/Ads";
import BestBanner from "Components/banner/BestBanner";
import Container from "Components/container";
import Dashboard from "Components/dashboard/dashboard";
import Rediness from "Components/rediness/Rediness";
import SearchBarLink from "src/components/home/search/SearchBarLink";
import TopBar from "Components/topBar";
import React, { useState, useEffect } from "react";
import Hero from "src/components/home/hero";
import Innovator from "src/components/home/innovator";
import Menu from "src/components/home/menu";
import Villages from "src/components/home/villages";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "Components/topBar/LanguageSwitcher";
import { getInnovation } from "src/services/innovationServices";
import { paths } from "src/consts/path";

export default function AdminPage() {
    const t = useTranslations("Admin");
    const router = useRouter();
    const [searchValue, setSearchValue] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);

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

    const handleSuggestionClick = (item: any) => {
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

                const nextSuggestions = rankedInnovations
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
                    .filter((item: any) => Boolean(item.id));

                setSuggestions(nextSuggestions);
            } catch (error) {
                console.error("Error fetching admin suggestions:", error);
                setSuggestions([]);
            } finally {
                setIsSuggestionsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchValue]);

    return (
        <Container page>
            <TopBar title={t("title")} rightElement={<LanguageSwitcher />} />
            <Hero
                description={t("heroDescription")}
                text={t("heroText")}
                isAdmin={true}
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
                <Menu isAdmin={true} />
                <Flex direction="row" justifyContent="space-between" padding="0 14px">
                    <Rediness />
                    <Ads />
                </Flex>
                <Dashboard />
                <BestBanner />
                <Box mt="120px">
                    <Innovator />
                </Box>
                <Box mt="-10px">
                    <Villages />
                </Box>
            </Stack>
        </Container>
    );
}
