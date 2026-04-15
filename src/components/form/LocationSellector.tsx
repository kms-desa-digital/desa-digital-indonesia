import { Box, Text } from "@chakra-ui/react";
import React from "react";
import Select from "react-select";

interface LocationSelectorProps {
    label: string;
    placeholder: string;
    options: { value: string; label: string }[];
    value: { value: string; label: string } | null;
    onChange: (selected: { value: string; label: string } | null) => void;
    isDisabled?: boolean;
    isRequired?: boolean;
    disabled?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
    label,
    placeholder,
    options,
    value,
    onChange,
    disabled,
    isDisabled = false,
    isRequired = false,
}) => {
    const customStyles = {
        control: (provide: any) => ({
            ...provide,
            width: "100%",
            fontSize: "12px",
            padding: "2px",
            border: "1px solid #E5E7EB",
            borderRadius: "4px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
        }),
        menu: (provide: any) => ({
            ...provide,
            fontSize: "12px",
            maxHeight: "500px",
        }),
        input: (provide: any) => ({
            ...provide,
            fontSize: "12px",
            width: "100%",
        }),
        placeholder: (provide: any) => ({
            ...provide,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
        }),
    };
    return (
        <Box>
            <Text fontSize="14px" fontWeight="400" mb="4px">
                {label} {isRequired && <span style={{ color: "red" }}>*</span>}
            </Text>
            <Select
                placeholder={placeholder}
                options={options}
                value={value}
                isDisabled={isDisabled || disabled}
                isClearable
                onChange={onChange}
                styles={customStyles}
            />
        </Box>
    );
};

export default LocationSelector;
