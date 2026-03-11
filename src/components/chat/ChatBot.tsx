"use client";

import { useState, useEffect } from 'react';
import { Box, IconButton } from '@chakra-ui/react';
import { MessageCircle, X } from 'lucide-react';
import ChatWindow from './ChatWindow';
import { useTranslations } from 'next-intl';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [messages, setMessages] = useState<any[]>([]); // State di parent
    const t = useTranslations('Chatbot');

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    if (!mounted) return null;

    return (
        <>
            {/* Chat Window */}
            {isOpen && (
                <Box
                    position="fixed"
                    bottom="145px"
                    right={{ base: '15px', md: 'calc(50% - 157.5px)' }}
                    width={{ base: 'calc(100vw - 30px)', md: '315px' }}
                    maxWidth="315px"
                    height="600px"
                    bg="white"
                    borderRadius="16px"
                    boxShadow="2xl"
                    zIndex={999}
                    overflow="hidden"
                
                >
                    <ChatWindow 
                        onClose={toggleChat} 
                        messages={messages}
                        setMessages={setMessages}
                    />
                </Box>
            )}

            {/* Floating Button */}
            <IconButton
                aria-label={t('ariaOpen')}
                icon={isOpen ? <X size={24} /> : <MessageCircle size={24} />}
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
