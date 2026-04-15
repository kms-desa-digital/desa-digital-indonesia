import { Box, Text } from "@chakra-ui/react";
import CreatableSelect from "react-select/creatable";
import React from "react";

type MultiSellectProps = {
  label?: string;
  note?: string;
  placeholder: string;
  options: { value: string; label: string }[];
  value: { value: string; label: string }[];
  isNoteRequired?: boolean;
  disabled?: boolean;
  isMulti?: boolean;
  onChange: (selected: any) => void;
};

const MultiSellect: React.FC<MultiSellectProps> = ({
  label,
  note,
  placeholder,
  options,
  value,
  disabled,
  isNoteRequired = false,
  isMulti = true,
  onChange,
}) => {
  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      borderColor: "gray",
      borderRadius: "4px",
      fontSize: "12px",
      padding: "2px",
      "&:hover": {
        borderColor: "black",
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      fontSize: "12px",
      maxHeight: "500px",
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: "#f5f5f5",
      borderRadius: "4px",
      padding: "2px",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      fontSize: "12px",
      color: "#333",
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: "red",
      ":hover": {
        backgroundColor: "#ffcccb",
        color: "black",
      },
    }),
  };

  return (
    <Box>
      {label && (
        <Text fontWeight="400" fontSize="14px">
          {label} <span style={{ color: "red" }}>*</span>
        </Text>
      )}
      {isNoteRequired && (
        <Text fontSize="10px" color="gray.500" mb="4px">
          {note}
        </Text>
      )}
      <CreatableSelect
        isMulti={isMulti}
        options={options}
        placeholder={placeholder}
        styles={customStyles}
        value={isMulti ? value : (value && value.length > 0 ? value[0] : null)}
        onChange={(selected: any) => {
          if (isMulti) {
            onChange(selected);
          } else {
            onChange(selected ? [selected] : []);
          }
        }}
        isDisabled={disabled}
      />
    </Box>
  );
};
export default MultiSellect;
