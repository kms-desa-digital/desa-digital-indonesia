"use client";

import React, { useEffect, useState } from "react";
import { paths } from "Consts/path";
import { Button, Input, InputGroup, InputRightElement } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Background, Container, Description, Title } from "./_styles";
import { Text } from "@chakra-ui/react";
import { FaEyeSlash, FaEye } from "react-icons/fa";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "src/firebase/clientApp";

const NewPassword: React.FC = () => {
    const [NewPasswordForm, setNewPasswordForm] = useState({
        password: "",
    });
    const [confirmPassword, setConfirmPassword] = useState(""); // State untuk konfirmasi kata sandi
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [accountEmail, setAccountEmail] = useState("");
    const [oobCodeValid, setOobCodeValid] = useState(false);

    const [show, setShow] = useState(false);
    const onShowPassword = () => setShow(!show);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const oobCode = searchParams.get("oobCode");

        if (!oobCode) {
            setError("Link reset password tidak valid atau tidak lengkap");
            return;
        }

        const validateCode = async () => {
            try {
                const email = await verifyPasswordResetCode(auth, oobCode);
                setAccountEmail(email);
                setOobCodeValid(true);
            } catch (validationError) {
                console.error("Invalid reset code:", validationError);
                setError("Link reset password tidak valid atau sudah expired");
            }
        };

        validateCode();
    }, [searchParams]);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(""); // Reset error

        // Validasi konfirmasi password
        if (NewPasswordForm.password !== confirmPassword) {
            return setError("Konfirmasi kata sandi tidak cocok");
        }
        if (NewPasswordForm.password.length < 6) {
            return setError("Kata sandi minimal 6 karakter");
        }

        if (!oobCodeValid) {
            return setError("Link reset password belum siap digunakan");
        }

        setLoading(true);
        try {
            const oobCode = searchParams.get("oobCode");

            if (!oobCode) {
                setError("Link reset password tidak valid atau tidak lengkap");
                return;
            }

            await confirmPasswordReset(auth, oobCode, NewPasswordForm.password);

            router.push(paths.LOGIN_PAGE);
        } catch (error) {
            console.error("Error during password reset:", error);
            setError("Terjadi kesalahan, coba lagi");
        } finally {
            setLoading(false);
        }
    };

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewPasswordForm((prev) => ({
            ...prev,
            [event.target.name]: event.target.value,
        }));
    };

    const onConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(event.target.value); // Update konfirmasi kata sandi
    };

    // === Firebase: createUserDocument & useEffect (di-comment) ===
    // const createUserDocument = async (user: User) => {
    //     const userData = {
    //         id: user.uid,
    //         email: user.email,
    //     };
    //     await addDoc(
    //         collection(firestore, "users"),
    //         JSON.parse(JSON.stringify(userData))
    //     );
    // };
    // useEffect(() => {
    //     if (userCred) {
    //         createUserDocument(userCred.user);
    //         router.push(paths.LOGIN_PAGE);
    //     }
    // }, [userCred, router]);

    return (
        <Background>
            <Container>
                <Title>Lupa Kata Sandi</Title>
                <Description>
                    Silahkan masukkan kata sandi baru
                </Description>
                {accountEmail && (
                    <Text fontSize="10pt" mt="8px" color="gray.600">
                        Akun: {accountEmail}
                    </Text>
                )}

                <form onSubmit={onSubmit}>
                    <Text fontSize="10pt" mt="12px">
                        Kata sandi
                    </Text>

                    <InputGroup mt="4px" alignItems="center">
                        <Input
                            name="password"
                            type={show ? "text" : "password"}
                            onChange={onChange}
                            required
                            placeholder="Kata sandi"
                        />
                        <InputRightElement
                            onClick={onShowPassword}
                            cursor="pointer"
                        >
                            {show ? <FaEyeSlash /> : <FaEye />}
                        </InputRightElement>
                    </InputGroup>

                    <Text fontSize="10pt" mt="12px">
                        Konfirmasi kata sandi
                    </Text>

                    <InputGroup mt="4px" alignItems="center">
                        <Input
                            name="confirmPassword"
                            type={show ? "text" : "password"}
                            onChange={onConfirmPasswordChange}
                            required
                            placeholder="Konfirmasi kata sandi"
                        />
                        <InputRightElement
                            onClick={onShowPassword}
                            cursor="pointer"
                        >
                            {show ? <FaEyeSlash /> : <FaEye />}
                        </InputRightElement>
                    </InputGroup>

                    {error && (
                        <Text textAlign="center" color="red" fontSize="10pt" mt={2}>
                            {error}
                        </Text>
                    )}

                    <Button
                        mt={4}
                        type="submit"
                        alignItems="center"
                        width="100%"
                        isLoading={loading}
                    >
                        Konfirmasi
                    </Button>
                </form>
            </Container>
        </Background>
    );
};

export default NewPassword;
