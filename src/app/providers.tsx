"use client";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { theme } from "src/chakra/theme";
import { UserProvider } from "src/contexts/UserContext";
import { LanguageProvider } from "src/contexts/LanguageContext";

const queryClient = new QueryClient();
export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <CacheProvider>
                <ChakraProvider theme={theme}>
                    <LanguageProvider>
                        <UserProvider>
                            <div suppressHydrationWarning={true}>
                                {children}
                                <ToastContainer
                                    position="top-center"
                                    autoClose={2000}
                                    theme="light"
                                    transition={Bounce}
                                />
                            </div>
                        </UserProvider>
                    </LanguageProvider>
                </ChakraProvider>
            </CacheProvider>
        </QueryClientProvider>
    );
}
