"use client";

import { useRef, useEffect, useState } from 'react';
import {
    VStack,
    HStack,
    Text,
    IconButton,
    Input,
    Flex,
    Box,
} from '@chakra-ui/react';
import { X, Send } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { useTranslations } from 'next-intl';

interface ChatWindowProps {
    onClose: () => void;
    messages: any[];
    setMessages: React.Dispatch<React.SetStateAction<any[]>>;
}

const ChatWindow = ({ onClose, messages, setMessages }: ChatWindowProps) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const t = useTranslations('Chatbot');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const assistantMessageId = `assistant-${Date.now()}`;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });

            if (!response.ok) throw new Error('API request failed');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    assistantMessage += chunk;

                    setMessages(prev => {
                        const updated = [...prev];
                        const lastMsg = updated[updated.length - 1];

                        if (lastMsg?.id === assistantMessageId) {
                            updated[updated.length - 1] = {
                                ...lastMsg,
                                content: assistantMessage
                            };
                        } else {
                            updated.push({
                                id: assistantMessageId,
                                role: 'assistant',
                                content: assistantMessage
                            });
                        }

                        return updated;
                    });
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Flex direction="column" height="100%">
            
            {/* HEADER */}
            <HStack
                p={4}
                bg="green.500"
                color="white"
                justify="space-between"
                borderTopRadius="20px"
                boxShadow="0 2px 6px rgba(0,0,0,0.1)"
            >
                <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="lg">
                        {t('title')}
                    </Text>
                    <Text fontSize="xs" opacity={0.9}>
                        {t('online')}
                    </Text>
                </VStack>

                <IconButton
                    aria-label={t('ariaClose')}
                    icon={<X size={20} />}
                    size="sm"
                    variant="ghost"
                    color="white"
                    _hover={{ bg: 'green.600' }}
                    onClick={onClose}
                />
            </HStack>

            {/* MESSAGES */}
            <VStack
                flex={1}
                overflowY="auto"
                p={4}
                spacing={3}
                align="stretch"
                bg="gray.100"
                css={{
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#bbb',
                        borderRadius: '4px'
                    }
                }}
            >
                {messages.length === 0 && (
                    <Box textAlign="center" mt={10}>
                        <Text fontSize="xs" color="gray.500">
                            {t('welcome')}
                        </Text>
                    </Box>
                )}

                {messages.map((m: any) => (
                    <ChatMessage key={m.id} message={m} />
                ))}

                {isLoading && (
                    <ChatMessage
                        message={{ id: 'loading', content: t('thinking'), role: 'assistant' }}
                        isLoading
                    />
                )}

                <div ref={messagesEndRef} />
            </VStack>

            {/* INPUT */}
            <HStack
                p={3}
                bg="white"
                borderTop="1px"
                borderColor="gray.100"
            >
                <form
                    onSubmit={handleSubmit}
                    style={{ width: '100%', display: 'flex', gap: '8px' }}
                >
                    <Input
                        placeholder={t('placeholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        borderRadius="full"
                        bg="gray.100"
                        border="none"
                        px={4}
                        fontSize="14px"
                        _focus={{
                            bg: 'white',
                            boxShadow: '0 0 0 2px rgba(34,197,94,0.2)'
                        }}
                    />

                    <IconButton
                        type="submit"
                        aria-label={t('ariaSend')}
                        icon={<Send size={18} />}
                        borderRadius="full"
                        bg="green.500"
                        color="white"
                        minW="42px"
                        h="42px"
                        boxShadow="0 4px 10px rgba(34,197,94,0.3)"
                        _hover={{
                            bg: 'green.600',
                            transform: 'scale(1.05)'
                        }}
                        _active={{ bg: 'green.700' }}
                        isDisabled={!input.trim() || isLoading}
                    />
                </form>
            </HStack>
        </Flex>
    );
};

export default ChatWindow;