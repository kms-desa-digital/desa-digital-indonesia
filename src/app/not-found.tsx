'use client'

import { Box, Button } from '@chakra-ui/react'
import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Box
      w="100%"
      h="100vh"
      position="relative"
      bg="#f3f9f6"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      <Box
        w="100%"
        maxW="360px"
        position="relative"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        h="100%"
      >
        <Box position="relative" w="100%" h="100%">
          <Image
            src="/images/403.svg"
            alt="403 Halaman Tidak Ditemukan"
            fill
            style={{
              objectFit: 'contain',
              objectPosition: 'center'
            }}
            priority
          />
        </Box>

        <Button
          as={Link}
          href="/"
          position="absolute"
          top="56.5%"
          right="26%"
          colorScheme="green"
          bg="#337456"
          _hover={{ bg: '#285e45' }}
          size="sm"
          fontSize="xs"
          h="26px"
          rounded="md"
          px={4}
          zIndex={10}
        >
          Kembali
        </Button>
      </Box>

    </Box>
  )
}