import { SearchIcon, CloseIcon } from "@chakra-ui/icons";
import {
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Box
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";

type SearchBarProps = {
  placeholder?: string;
  onChange?: (keyword: string) => void;
  initialValue?: string;
};

const SearchBarVil: React.FC<SearchBarProps> = ({ placeholder, onChange, initialValue }) => {
  const [inputValue, setInputValue] = useState(initialValue || "");

  useEffect(() => {
    setInputValue(initialValue || "");
  }, [initialValue]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    if (onChange) {
      onChange(value);
    }
  };

  const handleClear = () => {
    setInputValue("");
    if (onChange) {
      onChange("");
    }
  };

  return (
    <Flex justify="center" maxW="474px" width="100%">
      <InputGroup>
        <InputLeftElement
          pointerEvents="none"
          children={<SearchIcon color="gray.300" />}
        />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          fontSize="10pt"
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
          width="100%"
          pr="40px"
        />
        {inputValue && (
          <InputRightElement>
            <Box
              as="button"
              onClick={handleClear}
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

export default SearchBarVil;