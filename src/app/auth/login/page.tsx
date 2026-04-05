"use client";

import {
    Button,
    Input,
    InputGroup,
    InputRightElement,
    Text,
} from "@chakra-ui/react";
import TopBar from "Components/topBar";
import { paths } from "Consts/path";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { FIREBASE_ERRORS } from "src/firebase/errors";
import { auth, firestore } from "src/firebase/clientApp";
import {
    Action,
    ActionContainer,
    Background,
    Container,
    Description,
    Label,
    Title,
} from "./_styles";
import { toast } from "react-toastify";

const Login: React.FC = () => {
    const [loginForm, setLoginForm] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const router = useRouter();
    const onShowPassword = () => setShow(!show);

    const onChange = ({ target }: { target: HTMLInputElement }) => {
        setLoginForm((prev) => ({ ...prev, [target.name]: target.value }));
        if (error) setError("");
    };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (error) setError("");

        // Form validation
        if (!loginForm.email.includes("@")) return setError("Email tidak valid");
        if (loginForm.password.length < 6)
            return setError("Kata sandi minimal 6 karakter");

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                loginForm.email,
                loginForm.password
            );

            const userRef = doc(firestore, "users", userCredential.user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                setError("Data pengguna tidak ditemukan");
                return;
            }

            const userData = userDoc.data();
            const userRole = (userData?.role || "").toLowerCase();

            localStorage.removeItem("token");
            localStorage.setItem("userRole", userRole);
            window.dispatchEvent(new Event("auth:tokenChanged"));
            router.refresh();

            if (userRole === "admin") {
                router.push(paths.ADMIN_PAGE);
            } else if (userRole === "ministry") {
                router.push(paths.DASHBOARD_MINISTRY_HOME);
            } else {
                router.push(paths.LANDING_PAGE);
            }
            
            toast.success("Berhasil Masuk", {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (error: any) {
            console.log("Error during login:", error);
            setError(
                FIREBASE_ERRORS[error?.message as keyof typeof FIREBASE_ERRORS] ||
                    "Terjadi kesalahan, coba lagi"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <TopBar title="" onBack={() => router.back()} />
            <Background>
                <Container>
                    <Title>Halo!</Title>
                    <Description>Silahkan masukkan akun</Description>

                    <form onSubmit={onSubmit}>
                        <Text fontSize="10pt" mt="12px">
                            Email
                        </Text>
                        <Input
                            name="email"
                            type="email"
                            onChange={onChange}
                            required
                            placeholder="Email"
                            mt="4px"
                            fontSize="10pt"
                        />
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
                                fontSize="10pt"
                            />
                            <InputRightElement onClick={onShowPassword} cursor="pointer" height="100%">
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
                            // alignItems="center"
                            width="100%"
                            isLoading={loading}
                        >
                            Masuk
                        </Button>
                    </form>

                    <ActionContainer mt={20}>
                        <Label>Lupa kata sandi?</Label>
                        <Action onClick={() => router.push(paths.EMAIL_RESET_PASSWORD_PAGE)}>
                            Klik disini
                        </Action>
                    </ActionContainer>

                    <ActionContainer mt={4}>
                        <Label>Belum memiliki akun?</Label>
                        <Action onClick={() => router.push(paths.REGISTER_PAGE)}>
                            Registrasi
                        </Action>
                    </ActionContainer>
                </Container>
            </Background>
        </>
    );
};

export default Login;
