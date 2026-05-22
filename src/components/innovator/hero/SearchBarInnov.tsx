import { SearchIcon, CloseIcon } from "@chakra-ui/icons";
import {
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Box
} from "@chakra-ui/react";
import React from "react";

type SearchBarInnovProps = {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
};

const SearchBarinnov: React.FC<SearchBarInnovProps> = ({ placeholder, value, onChange, onClear }) => {
  return (
    <Flex justify="center" maxW="360px" width="100%">
        <InputGroup>
          <InputLeftElement
            pointerEvents="none"
            children={<SearchIcon color="gray.300" />}
          />
          <Input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            fontSize="10pt"
            _placeholder={{ color: "#9CA3AF"  }}
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
            maxW="329px"
            width="100%"
            pr="40px"
          />
          {value && onClear && (
            <InputRightElement>
              <Box
                as="button"
                onClick={onClear}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="full"
                bg="#6B7280"
                color="white"
                boxSize="18px"
                _hover={{ bg: "gray.600" }}
                _active={{ bg: "gray.700" }}
                cursor="pointer"
                mr="8px"
              >
                <CloseIcon w="6px" h="6px" />
              </Box>
            </InputRightElement>
          )}
        </InputGroup>
      </Flex>
  );
};
export default SearchBarinnov;