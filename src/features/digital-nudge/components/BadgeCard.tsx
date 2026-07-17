import React from "react";
import { Box, Flex, Image, Stack, Text, Button, Tag, TagLabel } from "@chakra-ui/react";
import { Badge } from "../types";

interface BadgeCardProps {
  badge: Badge;
  isActive: boolean;
  onApply: () => void;
  isLoading: boolean;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, isActive, onApply, isLoading }) => {
  const isLocked = !badge.isUnlocked;

  return (
    <Box
      p={4}
      borderRadius="16px"
      borderWidth="1px"
      bg="white"
      borderColor={isActive ? "#347357" : "gray.200"}
      shadow="xs"
      opacity={isLocked ? 0.6 : 1}
      filter={isLocked ? "grayscale(10%)" : "none"}
    >
      <Flex align="center">
        {/* Badge Icon on Left */}
        <Box p={2.5} bg={isLocked ? "gray.100" : "green.50"} borderRadius="12px" mr={4}>
          <Image src={badge.icon} alt={badge.name} boxSize="36px" />
        </Box>

        {/* Mid Text */}
        <Stack spacing={0.5} flex={1}>
          <Text fontSize="14px" fontWeight="700" color="#1F2937">
            {badge.name}
          </Text>
          <Text fontSize="11px" color="#6B7280" lineHeight="1.3">
            {badge.description}
          </Text>
        </Stack>

        {/* Action Button / Progress on Right */}
        <Box pl={2}>
          {isActive ? (
            <Tag size="md" variant="solid" bg="#DCFCE7" color="#15803D" fontWeight="bold" borderRadius="full">
              <TagLabel fontSize="10px">Digunakan</TagLabel>
            </Tag>
          ) : isLocked ? (
            <Text fontSize="11px" fontWeight="bold" color="#EF4444">
              {badge.progress}/{badge.target}
            </Text>
          ) : (
            <Button
              size="sm"
              bg="#347357"
              color="white"
              fontWeight="bold"
              fontSize="11px"
              borderRadius="8px"
              px={4}
              height="28px"
              _hover={{ bg: "#2d6149" }}
              isLoading={isLoading}
              onClick={onApply}
            >
              Gunakan
            </Button>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default BadgeCard;
