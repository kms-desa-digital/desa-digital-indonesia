import React from "react";
import { Box, Text, Input, Textarea } from "@chakra-ui/react";

interface FormSectionProps {
  title: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  disabled?: boolean;
  isTextArea?: boolean;
  wordCount?: number;
  maxWords?: number;
  type?: string;
  isRequired?: boolean;
  description?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  name,
  placeholder,
  value,
  onChange,
  isTextArea = false,
  wordCount,
  maxWords,
  disabled,
  type = "text",
  isRequired = true,
  description,
}) => {
  return (
    <Box>
      <Text fontWeight="400" fontSize="14px" mb={description ? "0px" : "4px"}>
        {title} {isRequired && <span style={{ color: "red" }}>*</span>}
      </Text>
      {description && (
        <Text fontWeight="400" fontSize="10px" mb="6px" color="#9CA3AF">
          {description}
        </Text>
      )}
      {isTextArea ? (
        <Textarea
          name={name}
          fontSize="10pt"
          placeholder={placeholder}
          _placeholder={{ color: "gray.500" }}
          _focus={{
            outline: "none",
            bg: "white",
            border: "1px solid",
            borderColor: "black",
          }}
          height="100px"
          value={value}
          onChange={onChange}
          disabled={disabled}
          isRequired={isRequired}
        />
      ) : (
        <Input
          name={name}
          fontSize="10pt"
          placeholder={placeholder}
          _placeholder={{ color: "gray.500" }}
          _focus={{
            outline: "none",
            bg: "white",
            border: "1px solid",
            borderColor: "black",
          }}
          value={value}
          onChange={onChange}
          type={type}
          disabled={disabled}
          isRequired={isRequired}
        />
      )}
      {wordCount !== undefined && maxWords !== undefined && (
        <Text fontWeight="400" fontSize="10px" mt="4px" color="#9CA3AF">
          {wordCount}/{maxWords} kata
        </Text>
      )}
    </Box>
  );
};

export default FormSection;
