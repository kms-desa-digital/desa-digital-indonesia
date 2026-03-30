import { border } from '@chakra-ui/react';
import { marginStyle } from 'Consts/sizing';
import React, { useState, useId } from 'react';
import Select from 'react-select';

interface Option {
  label: string;
  value: string;
}

interface DropdownProps {
  options: { id: string; name: string }[];
  placeholder?: string;
  onChange?: (selected: Option | null) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  placeholder = "Pilih Opsi",
  options,
  onChange
}) => {
  const selectId = useId();
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const handleCategoryChange = (selected: Option | null) => {
    setSelectedOption(selected);
    if (onChange) {
      onChange(selected);
    }
  };

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      width: '100%',
      fontSize: '12px',
      padding: '2px',
      border: '1px solid #E5E7EB',
      borderRadius: '4px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    menu: (provided: any) => ({
      ...provided,
      fontSize: '12px',
      maxHeight: '500px',
    }),
    input: (provided: any) => ({
      ...provided,
      fontSize: '12px',
      width: '100%',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),
  };

  return (
    <Select
      instanceId={selectId}
      value={selectedOption}
      onChange={handleCategoryChange}
      options={options.map((opt) => ({
        label: opt.name,
        value: opt.id
      }))}
      placeholder={placeholder}
      isSearchable
      isClearable
      styles={customStyles}
    />
  );
};

export default Dropdown;
