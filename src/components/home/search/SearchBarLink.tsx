import { SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import CardInnovation from "Components/card/innovation";
import { useTranslations } from "next-intl";

type SearchSuggestion = {
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

interface SearchBarLinkProps {
  placeholderText: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  highlightQuery?: string;
  width?: string | number;
  maxW?: string | number;
  showSuggestions?: boolean;
  isSuggestionsLoading?: boolean;
  suggestions?: SearchSuggestion[];
  onSuggestionClick?: (item: SearchSuggestion) => void;
  showSearchButton?: boolean;
  onSearchClick?: () => void;
}

const SearchBarLink: React.FC<SearchBarLinkProps> = ({
  placeholderText,
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  highlightQuery,
  width = "100%",
  maxW = "100%",
  showSuggestions = false,
  isSuggestionsLoading = false,
  suggestions = [],
  onSuggestionClick,
  showSearchButton = false,
  onSearchClick,
}) => {
  const t = useTranslations("Home");
  const renderHighlightedText = (value: string) => {
    const query = highlightQuery?.trim();

    if (!query) {
      return value;
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = value.split(new RegExp(`(${escapedQuery})`, "ig"));

    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Text as="mark" key={`${part}-${index}`} bg="green.200" color="inherit" px={1} borderRadius="4px">
          {part}
        </Text>
      ) : (
        <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      )
    );
  };

  return (
    <Flex justify="center" width={width} maxW={maxW}>
      <Box width="90%" mt={-3} mb={-3} position="relative" zIndex={20}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            bg="white"
            type="text"
            placeholder={placeholderText}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            fontSize="10pt"
            pr={showSearchButton ? "90px" : undefined}
            _placeholder={{ color: "#9CA3AF" }}
            _hover={{
              bg: "white",
              border: "1px solid",
              borderColor: "brand.100",
            }}
            _focus={{
              bg: "white",
              border: "1px solid",
              borderColor: "#9CA3AF",
            }}
            borderRadius={100}
          />
          {showSearchButton && (
            <InputRightElement width="auto" pr={1}>
              <Button
                size="sm"
                bg="#347357"
                color="white"
                borderRadius="full"
                px={5}
                h="32px"
                fontSize="13px"
                fontWeight="600"
                _hover={{ bg: "#2a5e47" }}
                _active={{ bg: "#1f4a37" }}
                onClick={onSearchClick}
                onMouseDown={(e) => e.preventDefault()}
              >
                {t('searchButton')}
              </Button>
            </InputRightElement>
          )}
        </InputGroup>

        {showSuggestions && (
          <Box
            mt={2}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="16px"
            boxShadow="0 10px 24px rgba(0, 0, 0, 0.08)"
            maxH="420px"
            overflowY="auto"
            p={3}
            sx={{
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-thumb": {
                bg: "gray.300",
                borderRadius: "full",
              },
            }}
          >
            {isSuggestionsLoading ? (
              <Flex py={6} justify="center" align="center" gap={2}>
                <Spinner size="sm" color="green.500" />
                <Text fontSize="sm" color="gray.500">{t('searchLoading')}</Text>
              </Flex>
            ) : suggestions.length === 0 ? (
              <Text px={2} py={4} fontSize="sm" color="gray.500" textAlign="center">
                {t('searchEmpty')}
              </Text>
            ) : (
              <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={3}>
                {suggestions.map((item) => (
                  <Box
                    key={item.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSuggestionClick?.(item)}
                    cursor="pointer"
                    transition="transform 0.15s ease, box-shadow 0.15s ease"
                    _hover={{ transform: "scale(1.02)", boxShadow: "md" }}
                    borderRadius="12px"
                    overflow="hidden"
                  >
                    <CardInnovation
                      images={item.images}
                      namaInovasi={item.title}
                      kategori={item.kategori}
                      deskripsi={item.deskripsi}
                      tahunDibuat={item.tahunDibuat}
                      innovatorLogo={item.innovatorLogo}
                      innovatorName={item.innovatorName}
                      highlightQuery={highlightQuery}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Flex>
  );
};

export default SearchBarLink;
