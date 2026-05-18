"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Flex,
    Stack,
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Text,
    Button,
    useDisclosure,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
} from '@chakra-ui/react';
import {
    Description,
    NavbarButton,
} from "./_styles";
import TopBar from 'Components/topBar';
import circle from "@public/icons/circlegreen.svg";
import Whatsapp from "@public/icons/whatsapp.svg";
import Envelope from "@public/icons/envelope.svg";
import { useTranslations } from 'next-intl';


const BantuanFAQ: React.FC = () => {
    const t = useTranslations("FAQ");
    const { isOpen, onOpen, onClose } = useDisclosure();
    const router = useRouter();

    // Mengambil data pertanyaan dari file translasi
    const questions = [0, 1, 2, 3].map(i => ({
        title: t(`questions.${i}.title`),
        description: t(`questions.${i}.description`)
    }));

    return (
        <Box>
            {/* Top Bar */}
            <TopBar title={t("title")} onBack={() => router.back()} />
            <Stack padding="16px" gap="16px" paddingTop="70px">
                <Flex>
                    <Accordion width="360px" allowMultiple>
                        {questions.map((item, index) => (
                            <Flex
                                key={index}
                                mb="12px"
                                border="1px solid var(--Gray-30, #E5E7EB)"
                                borderRadius="8px"
                            >
                                <AccordionItem width="100%" border="none">
                                    <h2>
                                        <AccordionButton>
                                            <Flex justifyContent="space-between"
                                                flexDirection="row"
                                                alignItems="center"
                                                gap="8px"
                                                alignSelf="stretch"
                                                width="100%">
                                                <Flex alignItems="center" gap="12px">
                                                    <img src={circle.src} alt="circle" width="10px" height="10px" />
                                                    <Text fontSize="12px" fontWeight="700" textAlign="start">
                                                        {item.title}
                                                    </Text>
                                                </Flex>
                                                <AccordionIcon color="#568A73" />
                                            </Flex>
                                        </AccordionButton>
                                    </h2>
                                    <AccordionPanel pb={4}>
                                        <Description>{item.description}</Description>
                                    </AccordionPanel>
                                </AccordionItem>
                            </Flex>
                        ))}
                    </Accordion>
                </Flex>
            </Stack>
            <NavbarButton>
                <Button width="100%" maxWidth="328px" onClick={onOpen} fontSize="16px" >
                    {t("contactSupport")}
                </Button>
            </NavbarButton>
            <Drawer
                isOpen={isOpen}
                placement='bottom'
                onClose={onClose}
            >
                <DrawerOverlay />
                <DrawerContent
                    sx={{
                        borderRadius: "lg",
                        width: "360px",
                        my: "auto",
                        mx: "auto",
                        zIndex: 1001
                    }}>
                    <DrawerCloseButton marginTop="4px" color="#1F2937" />
                    <DrawerHeader
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            color: "#1F2937",
                            fontSize: "16px",
                        }}>{t("contactSupport")}</DrawerHeader>
                    <DrawerBody fontSize={12} color="#374151" paddingX={4} gap={4}>
                        {t("drawerDesc")}
                        <Flex width="328px" align-items="flex-start" gap="16px" padding="4px 0px 4px" mt={2}>
                            <img src={Whatsapp.src} alt="WA" width="16px" height="16px" />
                            00000000000
                        </Flex>
                        <Flex width="328px" align-items="flex-start" gap="16px" padding="0px 0px 8px">
                            <img src={Envelope.src} alt="WA" width="16px" height="16px" />
                            kms.desadigital.ipb@gmail.com
                        </Flex>

                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </Box >

    );
};

export default BantuanFAQ;
