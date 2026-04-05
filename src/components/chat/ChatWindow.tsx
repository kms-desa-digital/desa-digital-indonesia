"use client";

import { useRef, useEffect, useState } from 'react';
import {
    VStack,
    HStack,
    Text,
    IconButton,
    Flex,
    Box,
    Textarea,
} from '@chakra-ui/react';
import { X, Send, Trash2, Bot } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { useTranslations } from 'next-intl';

interface ChatWindowProps {
    onClose: () => void;
    onClearHistory: () => void;
    messages: any[];
    setMessages: React.Dispatch<React.SetStateAction<any[]>>;
}

const ChatWindow = ({ onClose, onClearHistory, messages, setMessages }: ChatWindowProps) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const t = useTranslations('Chatbot');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleInputResize = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim() && !isLoading) {
                handleSubmit(e as any);
            }
        }
    };

    const handleSuggestionClick = (promptText: string) => {
        setInput(promptText);
        if (textareaRef.current) {
            textareaRef.current.focus(); // Arahkan kursor langsung ke text area
            setTimeout(() => handleInputResize(), 10);
        }
    };

    const submitMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage = { id: Date.now().toString(), role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        const assistantMessageId = `assistant-${Date.now()}`;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();

            setMessages(prev => [
                ...prev,
                {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: data.text,
                    extra: { 
                        linkCards: data.linkCards || [],
                        suggestions: data.suggestions || []
                    }
                }
            ]);
            
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [
                ...prev,
                {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: "Maaf, terjadi kesalahan saat menghubungi server.",
                    error: true
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitMessage(input);
    };

    return (
        <Flex direction="column" height="100%">
            <HStack
                p={4}
                bg="green.500"
                color="white"
                justify="space-between"
                borderTopRadius="20px"
                boxShadow="0 2px 10px rgba(0,0,0,0.15)"
                zIndex={10}
            >
                <VStack align="start" spacing={0} pl={1}>
                    <Text fontWeight="bold" fontSize="md" lineHeight="1.2">
                        {t('title') || "Asisten Desa"}
                    </Text>
                    <HStack spacing={1.5}>
                        <Box w="6px" h="6px" bg="green.200" borderRadius="full" animation="pulseDot 2s infinite" />
                        <Text fontSize="11px" opacity={0.9} fontWeight="medium">
                            {t('online') || "Online"}
                        </Text>
                    </HStack>
                </VStack>

                <HStack spacing={1}>
                    <IconButton
                        aria-label={t('ariaClearHistory')}
                        icon={<Trash2 size={18} />}
                        size="sm"
                        variant="ghost"
                        color="white"
                        _hover={{ bg: 'whiteAlpha.300' }}
                        onClick={onClearHistory}
                        isDisabled={messages.length === 0}
                    />

                    <IconButton
                        aria-label={t('ariaClose')}
                        icon={<X size={20} />}
                        size="sm"
                        variant="ghost"
                        color="white"
                        _hover={{ bg: 'whiteAlpha.300' }}
                        onClick={onClose}
                    />
                </HStack>
            </HStack>

            {/* Area Pesan */}
            <VStack
                flex={1}
                overflowY="auto"
                p={4}
                spacing={3}
                align="stretch"
                bg="gray.50"
                css={{
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#cbd5e1',
                        borderRadius: '4px'
                    }
                }}
            >
                {messages.length === 0 && (
                    <Box textAlign="center" mt={6} px={2} animation="fadeIn 0.5s ease-out forwards">
                        <Flex justify="center" mb={4}>
                            <Flex w="64px" h="64px" bg="green.100" borderRadius="full" align="center" justify="center" boxShadow="sm">
                                <Bot size={32} color="#16a34a" />
                            </Flex>
                        </Flex>
                        <Text fontSize="15px" fontWeight="700" color="gray.800" mb={1.5}>
                            Halo! Ada yang bisa saya bantu?
                        </Text>
                        <Text fontSize="12px" color="gray.500" mb={6} px={4} lineHeight="1.5">
                            Pilih pertanyaan di bawah atau ketik langsung kebutuhan informasi Anda.
                        </Text>
                        
                        <VStack spacing={2.5} align="stretch">
                            {[
                                "Apa potensi utama Desa Petir?",
                                "Rekomendasi inovasi perikanan",
                                "Siapa saja inovator yang terdaftar?"
                            ].map((promptText, index) => (
                                <Box
                                    key={index}
                                    as="button"
                                    onClick={() => handleSuggestionClick(promptText)}
                                    textAlign="left"
                                    bg="white"
                                    p={3.5}
                                    borderRadius="14px"
                                    border="1px solid"
                                    borderColor="gray.200"
                                    fontSize="13px"
                                    fontWeight="500"
                                    color="green.700"
                                    boxShadow="sm"
                                    transition="all 0.2s"
                                    _hover={{ bg: 'green.50', borderColor: 'green.300', transform: 'translateY(-2px)', boxShadow: 'md' }}
                                >
                                    {promptText}
                                </Box>
                            ))}
                        </VStack>
                    </Box>
                )}

                {messages.map((m: any) => (
                    <ChatMessage 
                        key={m.id} 
                        message={m} 
                        onSuggestionClick={handleSuggestionClick} 
                        onRetry={() => submitMessage(messages[messages.length-1].content)}
                    />
                ))}

                {isLoading && (
                    <ChatMessage
                        message={{ id: 'loading', content: t('thinking'), role: 'assistant' }}
                        isLoading
                    />
                )}

                <div ref={messagesEndRef} />
            </VStack>

            {/* Input Area */}
            <Box p={3} bg="white" borderTop="1px" borderColor="gray.100" boxShadow="0 -4px 10px rgba(0,0,0,0.02)">
                <form onSubmit={handleSubmit}>
                    <HStack align="flex-end" spacing={2} bg="gray.100" borderRadius="24px" p={1.5} pr={2}>
                        <Textarea
                            ref={textareaRef}
                            placeholder={t('placeholder') || "Ketik pertanyaan Anda..."}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                handleInputResize();
                            }}
                            onKeyDown={handleKeyDown}
                            bg="transparent"
                            border="none"
                            px={3}
                            py={2.5}
                            fontSize="14px"
                            minH="40px"
                            maxH="120px"
                            rows={1}
                            resize="none"
                            _focus={{ boxShadow: 'none' }}
                            _placeholder={{ color: 'gray.500' }}
                            css={{
                                '&::-webkit-scrollbar': { width: '0px' },
                            }}
                        />

                        <IconButton
                            type="submit"
                            aria-label={t('ariaSend')}
                            icon={<Send size={18} />}
                            borderRadius="full"
                            bg={input.trim() ? "green.500" : "gray.300"} 
                            color="white"
                            minW="36px"
                            h="36px"
                            mb={0.5}
                            boxShadow={input.trim() ? "0 4px 10px rgba(34,197,94,0.3)" : "none"}
                            _hover={input.trim() ? {
                                bg: 'green.600',
                                transform: 'scale(1.05)'
                            } : {}}
                            _active={input.trim() ? { bg: 'green.700' } : {}}
                            isDisabled={!input.trim() || isLoading}
                        />
                    </HStack>
                </form>
            </Box>

            <style jsx global>{`
                @keyframes pulseDot {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(134, 239, 172, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(134, 239, 172, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(134, 239, 172, 0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </Flex>
    );
};

export default ChatWindow;