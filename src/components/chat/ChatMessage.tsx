"use client";

import { Box, HStack, Avatar, Text, VStack, Flex, Button } from '@chakra-ui/react';
import { Bot, User as UserIcon, Lightbulb, MapPinned, UserCheck, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import { Global } from '@emotion/react';
import remarkGfm from 'remark-gfm';

interface LinkCard {
    sourceId: string;
    kind: 'innovation' | 'village' | 'innovator';
    title: string;
    subtitle: string;
    href: string;
}

interface ChatMessageProps {
    message: {
        id: string;
        content: string;
        role: 'user' | 'assistant' | string;
        createdAt?: Date;
        error?: boolean;
        // FIX: Tambah retryContent untuk menyimpan teks asli yang akan di-retry
        retryContent?: string;
        extra?: {
            linkCards?: LinkCard[];
            suggestions?: string[];
        };
    };
    isLoading?: boolean;
    onSuggestionClick?: (text: string) => void;
    onRetry?: () => void;
}

// FIX: Pindahkan icon resolver ke fungsi tersendiri agar mudah di-extend
// Sebelumnya kind === 'innovator' tidak di-handle, fallback ke MapPinned yang tidak relevan
function getCardIcon(kind: LinkCard['kind']) {
    switch (kind) {
        case 'innovation':
            return <Lightbulb size={20} strokeWidth={2.5} />;
        case 'village':
            return <MapPinned size={20} strokeWidth={2.5} />;
        case 'innovator':
            // FIX: Gunakan ikon yang relevan untuk inovator
            return <UserCheck size={20} strokeWidth={2.5} />;
        default:
            return <Lightbulb size={20} strokeWidth={2.5} />;
    }
}

const ChatMessage = ({ message, isLoading = false, onSuggestionClick, onRetry }: ChatMessageProps) => {
    const isUser = message.role === 'user';
    const [formattedTime, setFormattedTime] = useState<string>('');
    const linkCards = message.extra?.linkCards ?? [];
    const suggestions = message.extra?.suggestions ?? [];

    const hasCards = !isUser && !isLoading && !message.error && linkCards.length > 0;
    const hasSuggestions = !isUser && !isLoading && !message.error && suggestions.length > 0;

    useEffect(() => {
        const timestamp = message.createdAt || new Date();
        setFormattedTime(timestamp.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        }));
    }, [message.createdAt]);

    return (
        <VStack
            align={isUser ? 'flex-end' : 'flex-start'}
            spacing={2}
            w="100%"
            mb={3}
            opacity={0}
            animation="slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        >
            <HStack
                align="start"
                spacing={3}
                w="100%"
                justify={isUser ? 'flex-end' : 'flex-start'}
            >
                {!isUser && (
                    <Avatar
                        size="sm"
                        bg={message.error ? "red.500" : "green.500"}
                        icon={message.error
                            ? <AlertCircle size={16} color="white" />
                            : <Bot size={16} color="white" />
                        }
                        boxShadow="sm"
                    />
                )}

                <Box
                    maxW={isUser
                        ? { base: '88%', md: '82%' }
                        : { base: 'calc(100% - 46px)', md: '86%' }
                    }
                    bg={message.error ? 'red.50' : (isUser ? 'green.500' : 'white')}
                    color={message.error ? 'red.800' : (isUser ? 'white' : 'gray.800')}
                    px={4}
                    py={3}
                    borderRadius="20px"
                    borderBottomLeftRadius={isUser ? '20px' : '4px'}
                    borderBottomRightRadius={isUser ? '4px' : '20px'}
                    boxShadow={isUser
                        ? '0 2px 6px rgba(34,197,94,0.2)'
                        : '0 4px 14px rgba(0,0,0,0.04)'
                    }
                    border={isUser ? 'none' : '1px solid'}
                    borderColor={message.error ? 'red.200' : 'gray.100'}
                    wordBreak="break-word"
                    overflowWrap="anywhere"
                >
                    <Box fontSize={{ base: '12px', md: '12.5px' }}>
                        {isLoading ? (
                            <HStack spacing={1.5} py={2}>
                                <Box w="6px" h="6px" bg="gray.400" borderRadius="full" animation="bounce 1.2s infinite ease-in-out" />
                                <Box w="6px" h="6px" bg="gray.400" borderRadius="full" animation="bounce 1.2s infinite ease-in-out 0.2s" />
                                <Box w="6px" h="6px" bg="gray.400" borderRadius="full" animation="bounce 1.2s infinite ease-in-out 0.4s" />
                            </HStack>
                        ) : message.error ? (
                            <VStack align="start" spacing={2}>
                                <Text fontWeight="600">{message.content}</Text>
                                {/* FIX: Tombol retry hanya muncul jika ada retryContent */}
                                {onRetry && message.retryContent && (
                                    <Button
                                        leftIcon={<RefreshCw size={12} />}
                                        size="xs"
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={onRetry}
                                        height="24px"
                                    >
                                        Coba kirim ulang
                                    </Button>
                                )}
                            </VStack>
                        ) : (
                            <Box
                                sx={{
                                    '& mark': { bg: 'yellow.200', color: 'orange.900', px: '3px', py: '1px', borderRadius: '4px', fontWeight: '600' },
                                    '& p': { marginBottom: '0.6rem', lineHeight: '1.5', color: isUser ? 'whiteAlpha.900' : 'gray.700' },
                                    '& p:last-child': { marginBottom: 0 },
                                    '& strong': { fontWeight: '700', color: isUser ? 'white' : 'gray.900' },
                                    '& em': { fontStyle: 'italic', color: isUser ? 'whiteAlpha.800' : 'gray.600' },
                                    '& ul, & ol': { marginLeft: '1rem', marginBottom: '0.6rem', paddingLeft: '0' },
                                    '& li': { marginBottom: '0.3rem', lineHeight: '1.5', color: isUser ? 'whiteAlpha.900' : 'gray.700', paddingLeft: '0.2rem' },
                                    '& li::marker': { color: isUser ? 'white' : 'green.500', fontWeight: '700' },
                                    '& a': { textDecoration: 'none', color: isUser ? 'white' : 'green.600', fontWeight: '600', borderBottom: '1px dashed', borderColor: isUser ? 'whiteAlpha.500' : 'green.300', wordBreak: 'break-word', transition: 'all 0.2s', _hover: { color: isUser ? 'white' : 'green.700', borderBottomStyle: 'solid' } },
                                    '& blockquote': { bg: isUser ? 'whiteAlpha.200' : 'green.50', borderLeft: '4px solid', borderColor: isUser ? 'white' : 'green.500', p: '0.5rem 0.75rem', borderRadius: '0 8px 8px 0', my: '0.75rem', color: isUser ? 'white' : 'green.800', fontWeight: '500', fontSize: '0.95em', lineHeight: '1.5', '& p': { marginBottom: 0 } },
                                    '& h1, & h2, & h3, & h4': { fontWeight: '800', marginTop: '1rem', marginBottom: '0.5rem', color: isUser ? 'white' : 'gray.900', lineHeight: '1.4' },
                                    '& h3': { fontSize: '1.1em' },
                                    '& table': { width: '100%', borderCollapse: 'collapse', my: '0.75rem', fontSize: '12px', borderRadius: '8px', overflow: 'hidden', boxShadow: isUser ? 'none' : '0 0 0 1px rgba(0,0,0,0.05)' },
                                    '& th, & td': { padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid', borderColor: isUser ? 'whiteAlpha.200' : 'gray.100' },
                                    '& th': { bg: isUser ? 'whiteAlpha.300' : 'gray.50', fontWeight: '700', color: isUser ? 'white' : 'gray.800', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' },
                                    '& tr:last-child td': { borderBottom: 'none' },
                                    '& code': { bg: isUser ? 'whiteAlpha.300' : 'green.50', px: '4px', py: '2px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.9em', color: isUser ? 'white' : 'green.700', border: isUser ? 'none' : '1px solid', borderColor: 'green.100' },
                                    '& pre': { bg: isUser ? 'whiteAlpha.200' : 'gray.800', color: 'gray.100', p: '0.75rem', borderRadius: '8px', overflowX: 'auto', my: '0.75rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)', '& code': { bg: 'transparent', p: 0, color: 'inherit', border: 'none' } }
                                }}
                            >
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                </ReactMarkdown>
                            </Box>
                        )}
                    </Box>

                    {/* Link Cards */}
                    {hasCards && (
                        <Box mt={4} pt={3} borderTop="1px dashed" borderColor="gray.200">
                            <VStack spacing={2.5} align="stretch">
                                {linkCards.map((card) => (
                                    <Box
                                        key={`card-${card.kind}-${card.sourceId}`}
                                        as="a"
                                        href={card.href}
                                        display="block"
                                        bg="white"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        borderRadius="12px"
                                        p={3}
                                        transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                                        position="relative"
                                        _hover={{
                                            borderColor: 'green.300',
                                            boxShadow: '0 4px 12px rgba(34,197,94,0.1)',
                                            transform: 'translateY(-1px)',
                                        }}
                                    >
                                        <HStack align="center" spacing={3} pr={5}>
                                            <Flex
                                                w="40px"
                                                h="40px"
                                                borderRadius="10px"
                                                bg="green.50"
                                                color="green.600"
                                                align="center"
                                                justify="center"
                                                flexShrink={0}
                                            >
                                                {/* FIX: Gunakan getCardIcon() yang handle semua kind */}
                                                {getCardIcon(card.kind)}
                                            </Flex>
                                            <VStack align="start" spacing={0} flex={1} minW={0}>
                                                <Text fontSize="12px" fontWeight="700" color="blue.700" noOfLines={1} lineHeight="short">
                                                    {card.title}
                                                </Text>
                                                <Text fontSize="11px" fontWeight="600" color="purple.600" noOfLines={1} opacity={0.9} mt={0.5}>
                                                    {card.subtitle}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                        <Flex position="absolute" right={2} top="50%" transform="translateY(-50%)" color="gray.400">
                                            <ChevronRight size={16} />
                                        </Flex>
                                    </Box>
                                ))}
                            </VStack>
                        </Box>
                    )}

                    {/* Waktu Chat */}
                    {formattedTime && (
                        <Text
                            fontSize="8px"
                            fontWeight="600"
                            color={isUser ? 'whiteAlpha.700' : 'gray.400'}
                            mt={0}
                            textAlign={isUser ? 'right' : 'left'}
                            letterSpacing="0.5px"
                        >
                            {formattedTime}
                        </Text>
                    )}
                </Box>

                {isUser && (
                    <Avatar
                        size="sm"
                        bg="gray.300"
                        icon={<UserIcon size={16} color="white" />}
                    />
                )}
            </HStack>

            {/* Pertanyaan Lanjutan */}
            {hasSuggestions && (
                <Flex flexWrap="wrap" gap={2} pl={12} pr={4} mt={1}>
                    {suggestions.map((sug, idx) => (
                        <Box
                            key={idx}
                            as="button"
                            onClick={() => onSuggestionClick && onSuggestionClick(sug)}
                            bg="white"
                            border="1px solid"
                            borderColor="green.200"
                            color="green.700"
                            px={3.5}
                            py={1.5}
                            borderRadius="full"
                            fontSize="10.5px"
                            fontWeight="600"
                            boxShadow="sm"
                            transition="all 0.2s"
                            _hover={{
                                bg: 'green.50',
                                transform: 'translateY(-1px)',
                                borderColor: 'green.400',
                                boxShadow: 'md',
                            }}
                        >
                            {sug}
                        </Box>
                    ))}
                </Flex>
            )}

            <Global styles={`
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
                    40% { transform: scale(1); opacity: 1; }
                }
                @keyframes slideUpFade {
                    0% { opacity: 0; transform: translateY(12px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `} />
        </VStack>
    );
};

export default ChatMessage;