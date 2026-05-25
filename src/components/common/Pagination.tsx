import React from 'react';
import { Flex, Button, Box, Text } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const paginationContainerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  mt: 4,
  mb: 2,
};

export const paginationButtonStyle = {
  size: "sm",
  minW: "32px",
  height: "32px",
  borderRadius: "md",
  bg: "#E8F5F0",
  color: "#244E3B",
  border: "1px solid",
  borderColor: "#D1EDE1",
  _hover: {
    bg: "#D1EDE1",
    borderColor: "#A5D6A7"
  },
  _active: {
    bg: "#A5D6A7"
  },
  mx: "1px",
  p: 0,
};

export const paginationActiveButtonStyle = {
  bg: "#244E3B",
  color: "white",
  border: "1px solid",
  borderColor: "#244E3B",
  _hover: {
    bg: "#1B5E20"
  },
  _active: {
    bg: "#1B5E20"
  },
};

export const paginationEllipsisStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  mx: 1,
  color: "#244E3B",
  fontSize: "sm",
};

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <Button
            key={i}
            onClick={() => onPageChange(i)}
            {...paginationButtonStyle}
            {...(currentPage === i ? paginationActiveButtonStyle : {})}
          >
            {i}
          </Button>
        );
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      }

      if (startPage > 1) {
        pageNumbers.push(
          <Button key={1} onClick={() => onPageChange(1)} {...paginationButtonStyle}>
            1
          </Button>
        );
        if (startPage > 2) {
          pageNumbers.push(
            <Box key="ellipsis-start" {...paginationEllipsisStyle}>
              ...
            </Box>
          );
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <Button
            key={i}
            onClick={() => onPageChange(i)}
            {...paginationButtonStyle}
            {...(currentPage === i ? paginationActiveButtonStyle : {})}
          >
            {i}
          </Button>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(
            <Box key="ellipsis-end" {...paginationEllipsisStyle}>
              ...
            </Box>
          );
        }
        pageNumbers.push(
          <Button key={totalPages} onClick={() => onPageChange(totalPages)} {...paginationButtonStyle}>
            {totalPages}
          </Button>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <Flex sx={paginationContainerStyle} gap={2}>
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        isDisabled={currentPage === 1}
        {...paginationButtonStyle}
        px={3}
        minW="auto"
      >
        <ChevronLeftIcon mr={1} /> Previous
      </Button>
      
      {renderPageNumbers()}
      
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        isDisabled={currentPage === totalPages}
        {...paginationButtonStyle}
        px={3}
        minW="auto"
      >
        Next <ChevronRightIcon ml={1} />
      </Button>
    </Flex>
  );
};

export default Pagination;
