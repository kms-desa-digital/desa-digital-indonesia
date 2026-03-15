"use client";

import { Box, HStack, Avatar, Text } from '@chakra-ui/react';
import { Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import { Global } from '@emotion/react';

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
                    icon={<Bot size={16} color="white" />}
                />
            )}

            <Box
                maxW="80%"
                bg={isUser ? 'green.500' : 'white'}
                color={isUser ? 'white' : 'gray.800'}
                px={3}
                py={2}
                borderRadius="12px"
                borderBottomLeftRadius={isUser ? '12px' : '4px'}
                borderBottomRightRadius={isUser ? '4px' : '12px'}
                boxShadow="sm"
                wordBreak="break-word"
            >
                <Box fontSize="13px" lineHeight="1.5">
                    {isLoading ? (
                        <HStack spacing={1}>
                            <Box as="span" display="inline-block" w="8px" h="8px" bg="gray.400" borderRadius="full" sx={{ animation: "bounce 1.4s infinite ease-in-out both" }} />
                            <Box as="span" display="inline-block" w="8px" h="8px" bg="gray.400" borderRadius="full" sx={{ animation: "bounce 1.4s infinite ease-in-out both 0.2s" }} />
                            <Box as="span" display="inline-block" w="8px" h="8px" bg="gray.400" borderRadius="full" sx={{ animation: "bounce 1.4s infinite ease-in-out both 0.4s" }} />
                        </HStack>
                    ) : (
                        <Box
                            sx={{
                                '& p': { marginBottom: '0.5rem' },
                                '& p:last-child': { marginBottom: 0 },
                                '& strong': { fontWeight: 'bold' },
                                '& em': { fontStyle: 'italic' },
                                '& ul, & ol': { marginLeft: '1.2rem', marginBottom: '0.5rem' },
                                '& li': { marginBottom: '0.2rem' },
                                '& a': { textDecoration: 'underline', color: isUser ? 'white' : 'blue.500' }
                            }}
                        >
                            <ReactMarkdown>{(message as any)["content"] || message.content}</ReactMarkdown>
                        </Box>
                    )}
                </Box>

                {formattedTime && (
                    <Text fontSize="8px" opacity={0.7} mt={1} textAlign={isUser ? 'right' : 'left'}>
                        {formattedTime}
                    </Text>
                )}
            </Box>

            {isUser && (
                <Avatar
                    size="sm"
                    bg="gray.500"
                    icon={<UserIcon size={16} color="white" />}
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
