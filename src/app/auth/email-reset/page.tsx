"use client";

import React, { useState } from "react";
import { Input, Button, Text, Flex, Box, Link } from "@chakra-ui/react";
import { Background, Container, Title, Description } from "./_styles";
import { useRouter } from "next/navigation";
// import { auth } from "src/firebase/clientApp";
// import {
//     useAuthState,
//     useSendPasswordResetEmail,
// } from "react-firebase-hooks/auth";
import TopBar from "Components/topBar";


const EmailReset: React.FC = () => {
    // const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [resetLink, setResetLink] = useState("");
    // const [sendPasswordResetEmail, sending, error] =
    //     useSendPasswordResetEmail(auth);
    const [success, setSuccess] = useState(false);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSending(true);
        setError("");
        setResetLink("");
        try {
            const res = await fetch("/api/auth/email-reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Gagal mengirim email reset");
                setSending(false);
                return;
            }

            setSuccess(true);
            setResetLink(data.resetLink || "");
            console.log("Email berhasil dikirim", email);

            // === Firebase auth (di-comment, diganti API MongoDB) ===
            // await sendPasswordResetEmail(email);
            // setSuccess(true);
        } catch (error) {
            console.error(error);
            setError("Terjadi kesalahan, coba lagi");
        } finally {
            setSending(false);
        }
    };

    // === Firebase: useEffect authState (di-comment) ===
    // useEffect(() => {
    //     if (user) {
    //         console.log("User sudah login:", user);
    //     }
    // }, [user]);

    return (
        <Box>
            <TopBar title="" onBack={() => router.back()} />
            <Background>
                <Container>
                    {/* <ArrowBackIcon /> */}
                    <Title>Lupa Kata Sandi</Title>
                    <Description>
                        Masukkan email akun Anda untuk kami kirimkan tautan reset password.
                    </Description>
                    {success ? (
                        <>
                            <Text textAlign="start" color="green" fontSize="10pt" mt="4px">
                                Link reset password berhasil dibuat.
                            </Text>
                        </>
                    ) : (
                        <>
                            <form onSubmit={onSubmit}>
                                <Text fontSize="10pt" mt="12px">
                                    Email
                                </Text>
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    mt="4px"
                                    fontSize="10pt"
                                    onChange={(event) => setEmail(event.target.value)}
                                />
                                {/* Error tambahan */}
                                {error && (
                                    <Text textAlign="left" color="red" fontSize="10pt" mt="4px">
                                        {error}
                                    </Text>
                                )}
                                <Flex direction="column" gap={1}>
                                    <Button mt={3} fontSize="14px" type="submit" width="100%" isLoading={sending}>
                                        Kirim Email
                                    </Button>
                                </Flex>
                            </form>
                        </>
                    )}
                </Container>
            </Background>
        </Box>
    );
};

export default EmailReset;
