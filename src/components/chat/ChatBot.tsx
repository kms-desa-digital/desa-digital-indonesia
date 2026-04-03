"use client";

import { useState, useEffect } from 'react';
import { Box, IconButton } from '@chakra-ui/react';
import { Bot, X } from 'lucide-react'; // Mengubah MessageCircle menjadi Bot
import ChatWindow from './ChatWindow';
import { useTranslations } from 'next-intl';

const CHAT_HISTORY_KEY = 'desa-digital-chat-history';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const t = useTranslations('Chatbot');

    useEffect(() => {
        setMounted(true);

        try {
            const storedMessages = window.localStorage.getItem(CHAT_HISTORY_KEY);
            if (storedMessages) {
                setMessages(JSON.parse(storedMessages));
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        try {
            window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }, [messages, mounted]);

    const clearHistory = () => {
        setMessages([]);

        try {
            window.localStorage.removeItem(CHAT_HISTORY_KEY);
        } catch (error) {
            console.error('Failed to clear chat history:', error);
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    if (!mounted) return null;

    return (
        <>
            {isOpen && (
                <Box
                    position="fixed"
                    bottom="145px"
                    right={{ base: '15px', md: 'calc(50% - 157.5px)' }}
                    width={{ base: 'calc(100vw - 30px)', md: '315px' }}
                    maxWidth="315px"
                    height="600px"
                    bg="white"
                    borderRadius="20px"
                    boxShadow="0 10px 30px rgba(0,0,0,0.12)"
                    zIndex={999}
                    overflow="hidden"
                >
                    <ChatWindow 
                        onClose={toggleChat} 
                        messages={messages}
                        setMessages={setMessages}
                        onClearHistory={clearHistory}
                    />
                </Box>
            )}

            <IconButton
                aria-label={t('ariaOpen')}
                // Menggunakan ikon Bot saat tertutup, dan X saat terbuka
                icon={isOpen ? <X size={24} /> : <Bot size={24} />} 
                position="fixed"
                bottom="80px"
                right={{ base: '20px', md: 'calc(50% - 160px)' }}
                width="56px"
                height="56px"
                borderRadius="full"
                bg="green.500"
                color="white"
                boxShadow="xl"
                _hover={{ bg: 'green.600', transform: 'scale(1.05)' }}
                _active={{ bg: 'green.700' }}
                transition="all 0.2s"
                onClick={toggleChat}
                zIndex={999}
            />
        </>
    );
};

export default Chatbot;