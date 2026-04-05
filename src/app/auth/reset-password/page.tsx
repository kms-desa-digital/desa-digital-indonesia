"use client";

import React, { useEffect } from "react";
import { Button, Text } from "@chakra-ui/react";
import { Background, Container, Title, Description } from "./_styles";
import { useRouter, useSearchParams } from "next/navigation";
import { paths } from "Consts/path";

const ResetPassword: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get("oobCode");

    useEffect(() => {
        if (oobCode) {
            router.replace(`${paths.NEW_PASSWORD_PAGE}?oobCode=${encodeURIComponent(oobCode)}`);
        }
    }, [oobCode, router]);

    return (
        <Background>
            <Container>
                <Title>Lupa Kata Sandi</Title>
                <Description>
                    Halaman ini memakai link reset dari Firebase. Jika Anda membuka link lama, sistem akan mengarahkan ke form kata sandi baru.
                </Description>

                <Text textAlign="center" fontSize="10pt" mt="12px">
                    Jika Anda belum menerima tautan reset, buat permintaan baru dari halaman lupa kata sandi.
                </Text>

                <Button mt={4} width="100%" onClick={() => router.push(paths.EMAIL_RESET_PASSWORD_PAGE)}>
                    Minta Link Reset Baru
                </Button>
            </Container>
        </Background>
    );
};

export default ResetPassword;
