"use client";

import {
    Button,
    Input,
    InputGroup,
    InputRightElement,
    Text,
    Box,
} from "@chakra-ui/react";
import { paths } from "Consts/path";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { Suspense, useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import { FIREBASE_ERRORS } from "src/firebase/errors";
import { auth, firestore } from "src/firebase/clientApp";
import {
    Action,
    ActionContainer,
    Background,
    CheckboxContainer,
    Container,
    Description,
    Label,
    Title,
} from "./_styles";
import TopBar from "Components/topBar";

const RegisterContent: React.FC = () => {
    const [regisForm, setRegisForm] = useState({
        email: "",
        password: "",
        role: "",
    });

    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const isGoogleFlow = searchParams.get("google") === "1";

    const onTogglePassword = () => setShowPassword((prev) => !prev);
    const onToggleConfirmPassword = () =>
        setShowConfirmPassword((prev) => !prev);

    useEffect(() => {
        if (isGoogleFlow && auth.currentUser?.email) {
            setRegisForm((prev) => ({
                ...prev,
                email: auth.currentUser?.email || "",
            }));
        }
    }, [isGoogleFlow]);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setRegisForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (error) setError("");
    };

    const handleConfirmPasswordChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setConfirmPassword(event.target.value);

        if (error) setError("");
    };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (error) setError("");

        if (isGoogleFlow) {
            if (!regisForm.role) {
                return setError("Silakan pilih daftar sebagai");
            }

            const currentUser = auth.currentUser;

            if (!currentUser) {
                return setError("Sesi Google tidak ditemukan, silakan login ulang");
            }

            setLoading(true);

            try {
                const role = regisForm.role.toLowerCase();

                await setDoc(doc(firestore, "users", currentUser.uid), {
                    id: currentUser.uid,
                    email: currentUser.email || regisForm.email || "",
                    role,
                });

                localStorage.setItem("userRole", role);
                window.dispatchEvent(new Event("auth:tokenChanged"));
                router.refresh();

                if (role === "admin") {
                    router.push(paths.ADMIN_PAGE);
                } else if (role === "ministry") {
                    router.push(paths.DASHBOARD_MINISTRY_HOME);
                } else {
                    router.push(paths.LANDING_PAGE);
                }
            } catch (submitError: any) {
                console.error("Error completing Google registration:", submitError);
                setError("Terjadi kesalahan, coba lagi");
            } finally {
                setLoading(false);
            }

            return;
        }

        if (!regisForm.email && !regisForm.password) {
            return setError("Email dan kata sandi harus diisi");
        }

        if (!regisForm.email) {
            return setError("Email wajib diisi");
        }

        if (!regisForm.email.includes("@")) {
            return setError("Gunakan @ untuk format email");
        }

        if (!regisForm.password) {
            return setError("Kata sandi wajib diisi");
        }

        if (regisForm.password.length < 6) {
            return setError("Kata sandi minimal 6 karakter");
        }

        if (!confirmPassword) {
            return setError("Konfirmasi kata sandi wajib diisi");
        }

        if (regisForm.password !== confirmPassword) {
            return setError("Kata sandi dan konfirmasi kata sandi tidak cocok");
        }

        if (!regisForm.role) {
            return setError("Silakan pilih role");
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                regisForm.email,
                regisForm.password
            );

            await setDoc(doc(firestore, "users", userCredential.user.uid), {
                id: userCredential.user.uid,
                email: regisForm.email,
                role: regisForm.role,
            });

            router.push(paths.LOGIN_PAGE);
        } catch (error: any) {
            console.error("Error during registration:", error);
            setError(
                FIREBASE_ERRORS[error?.message as keyof typeof FIREBASE_ERRORS] ||
                    "Terjadi kesalahan, coba lagi"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <TopBar title="" onBack={() => router.back()} />

            <Background>
                <Container>
                    <Title>Halo!</Title>
                    <Description>Silahkan melakukan registrasi akun</Description>

                    <form onSubmit={onSubmit} noValidate>
                        <Text fontSize="10pt" mt="12px">
                            Email
                        </Text>

                        <Input
                            name="email"
                            type="text"
                            inputMode="email"
                            autoComplete="email"
                            onChange={onChange}
                            placeholder="Email"
                            mt="4px"
                            fontSize="10pt"
                            value={regisForm.email}
                            readOnly={isGoogleFlow}
                        />

                        {!isGoogleFlow && (
                            <>
                                <Text fontSize="10pt" mt="12px">
                                    Kata sandi
                                </Text>

                                <InputGroup mt="4px" alignItems="center">
                                    <Input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        onChange={onChange}
                                        placeholder="Kata sandi"
                                        fontSize="10pt"
                                        value={regisForm.password}
                                    />

                                    <InputRightElement
                                        onClick={onTogglePassword}
                                        cursor="pointer"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </InputRightElement>
                                </InputGroup>

                                <Text
                                    fontWeight="400"
                                    fontStyle="normal"
                                    fontSize="10px"
                                    color="#9CA3AF"
                                    mb="-2"
                                >
                                    Kata sandi minimal 6 karakter.
                                </Text>

                                <Text fontSize="10pt" mt="12px">
                                    Ulangi kata sandi
                                </Text>

                                <InputGroup mt="4px" alignItems="center">
                                    <Input
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        onChange={handleConfirmPasswordChange}
                                        placeholder="Tulis ulang kata sandi"
                                        fontSize="10pt"
                                        value={confirmPassword}
                                    />

                                    <InputRightElement
                                        onClick={onToggleConfirmPassword}
                                        cursor="pointer"
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </InputRightElement>
                                </InputGroup>
                            </>
                        )}

                        <Label mt={12}>Daftar sebagai:</Label>

                        <CheckboxContainer mt={12}>
                            <input
                                name="role"
                                type="radio"
                                value="innovator"
                                onChange={onChange}
                                checked={regisForm.role === "innovator"}
                            />
                            <Label>Inovator</Label>
                        </CheckboxContainer>

                        <CheckboxContainer mt={12}>
                            <input
                                name="role"
                                type="radio"
                                value="village"
                                onChange={onChange}
                                checked={regisForm.role === "village"}
                            />
                            <Label>Perangkat desa</Label>
                        </CheckboxContainer>

                        <CheckboxContainer mt={12}>
                            <input
                                name="role"
                                type="radio"
                                value="ministry"
                                onChange={onChange}
                                checked={regisForm.role === "ministry"}
                            />
                            <Label>Kementerian</Label>
                        </CheckboxContainer>

                        {error && (
                            <Text
                                textAlign="center"
                                color="red"
                                fontSize="10pt"
                                mt={2}
                            >
                                {error}
                            </Text>
                        )}

                        <Button
                            mt={4}
                            type="submit"
                            formNoValidate
                            alignItems="center"
                            width="100%"
                            isLoading={loading}
                            fontSize="14px"
                        >
                            {isGoogleFlow ? "Lanjutkan" : "Registrasi"}
                        </Button>
                    </form>

                    <ActionContainer mt={16}>
                        <Label>Sudah memiliki akun?</Label>
                        <Action onClick={() => router.push(paths.LOGIN_PAGE)}>
                            Login
                        </Action>
                    </ActionContainer>
                </Container>
            </Background>
        </Box>
    );
};

const Register: React.FC = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterContent />
        </Suspense>
    );
};

export default Register;