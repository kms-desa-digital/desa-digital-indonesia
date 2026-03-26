"use client";

import { Box, HStack, Avatar, Text } from '@chakra-ui/react';
import { Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import { Global } from '@emotion/react';

import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
    message: {
        id: string;
        content: string;
        role: 'user' | 'assistant' | string;
        createdAt?: Date;
    };
    isLoading?: boolean;
}

const ChatMessage = ({ message, isLoading = false }: ChatMessageProps) => {
    const isUser = message.role === 'user';
    const [formattedTime, setFormattedTime] = useState<string>('');

    useEffect(() => {
        const timestamp = message.createdAt || new Date();
        setFormattedTime(timestamp.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        }));
    }, [message.createdAt]);

    return (
        <HStack
            align="start"
            spacing={2}
            justify={isUser ? 'flex-end' : 'flex-start'}
            w="100%"
        >
            {!isUser && (
                <Avatar
                    size="sm"
                    bg="green.500"
                    icon={<Bot size={14} color="white" />}
                />
            )}

            <Box
                maxW="85%"
                bg={isUser ? 'green.500' : 'white'}
                color={isUser ? 'white' : 'gray.700'}
                px={4}
                py={2.5}
                borderRadius="16px"
                borderBottomLeftRadius={isUser ? '16px' : '6px'}
                borderBottomRightRadius={isUser ? '6px' : '16px'}
                boxShadow={isUser ? "sm" : "0 2px 8px rgba(0,0,0,0.06)"}
                wordBreak="break-word"
                transition="all 0.2s ease"
                _hover={{ transform: 'translateY(-1px)' }}
            >
                <Box fontSize="14px" lineHeight="1.6">
                    {isLoading ? (
                        <HStack spacing={1}>
                            <Box w="6px" h="6px" bg="gray.400" borderRadius="full" animation="bounce 1.2s infinite ease-in-out" />
                            <Box w="6px" h="6px" bg="gray.400" borderRadius="full" animation="bounce 1.2s infinite ease-in-out 0.2s" />
                            <Box w="6px" h="6px" bg="gray.400" borderRadius="full" animation="bounce 1.2s infinite ease-in-out 0.4s" />
                        </HStack>
                    ) : (
                        <Box
                            sx={{
                                '& p': { marginBottom: '0.8rem' },
                                '& p:last-child': { marginBottom: 0 },
                                '& strong': { fontWeight: 'bold' },
                                '& em': { fontStyle: 'italic' },
                                '& ul, & ol': { marginLeft: '1.5rem', marginBottom: '0.8rem' },
                                '& li': { marginBottom: '0.4rem' },
                                '& a': { textDecoration: 'underline', color: isUser ? 'white' : 'blue.600' },
                                '& h1, & h2, & h3, & h4': { 
                                    fontWeight: 'bold', 
                                    marginTop: '1rem', 
                                    marginBottom: '0.5rem',
                                    color: isUser ? 'white' : 'gray.800'
                                },
                                '& h1': { fontSize: '1.25rem' },
                                '& h2': { fontSize: '1.15rem' },
                                '& h3': { fontSize: '1.1rem' },
                                '& blockquote': {
                                    borderLeft: '4px solid',
                                    borderColor: isUser ? 'whiteAlpha.400' : 'green.200',
                                    paddingLeft: '1rem',
                                    fontStyle: 'italic',
                                    marginBottom: '0.8rem',
                                    color: isUser ? 'whiteAlpha.900' : 'gray.600'
                                },
                                '& table': {
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    marginBottom: '1rem',
                                    fontSize: '13px'
                                },
                                '& th, & td': {
                                    border: '1px solid',
                                    borderColor: isUser ? 'whiteAlpha.400' : 'gray.200',
                                    padding: '0.5rem',
                                    textAlign: 'left'
                                },
                                '& th': {
                                    bg: isUser ? 'whiteAlpha.200' : 'gray.50',
                                    fontWeight: 'bold'
                                },
                                '& code': {
                                    bg: isUser ? 'whiteAlpha.200' : 'gray.100',
                                    px: '4px',
                                    py: '2px',
                                    borderRadius: '4px',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9em'
                                },
                                '& pre': {
                                    bg: isUser ? 'whiteAlpha.200' : 'gray.800',
                                    color: isUser ? 'white' : 'gray.100',
                                    p: '1rem',
                                    borderRadius: '8px',
                                    overflowX: 'auto',
                                    marginBottom: '1rem',
                                    '& code': { bg: 'transparent', p: 0 }
                                },
                                '& hr': {
                                    border: '0',
                                    borderTop: '1px solid',
                                    borderColor: isUser ? 'whiteAlpha.400' : 'gray.200',
                                    my: '1rem'
                                }
                            }}
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                            </ReactMarkdown>
                        </Box>
                    )}
                </Box>

                {formattedTime && (
                    <Text fontSize="9px" opacity={0.6} mt={1} textAlign={isUser ? 'right' : 'left'}>
                        {formattedTime}
                    </Text>
                )}
            </Box>

            {isUser && (
                <Avatar
                    size="sm"
                    bg="gray.400"
                    icon={<UserIcon size={14} color="white" />}
                />
            )}

            <Global styles={`
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            `} />
        </HStack>
    );
};

export default ChatMessage;