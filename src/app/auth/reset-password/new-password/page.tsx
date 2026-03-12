"use client";

import React, { useEffect, useState } from "react";
import { paths } from "Consts/path";
import { User } from "firebase/auth";
import { Button, Input, InputGroup, InputRightElement } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { Background, Container, Description, Title } from "./_styles";
import { auth, firestore } from "src/firebase/clientApp";
import { FIREBASE_ERRORS } from "src/firebase/errors";
import { Text } from "@chakra-ui/react";
import { FaEyeSlash, FaEye } from "react-icons/fa";
import { addDoc, collection } from "firebase/firestore";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";

const NewPassword: React.FC = () => {
    const [NewPasswordForm, setNewPasswordForm] = useState({
        password: "",
    });
    const [confirmPassword, setConfirmPassword] = useState(""); // State untuk konfirmasi kata sandi
    const [error, setError] = useState("");
    const [createUserWithEmailAndPassword, userCred, loading, userError] =
        useCreateUserWithEmailAndPassword(auth);

    const [show, setShow] = useState(false);
    const onShowPassword = () => setShow(!show);

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(""); // Reset error

        // Validasi konfirmasi password
        if (NewPasswordForm.password !== confirmPassword) {
            return setError("Konfirmasi kata sandi tidak cocok");
        }
        if (NewPasswordForm.password.length < 6) {
            return setError("Kata sandi minimal 6 karakter");
        }

        // Proses pembuatan user
        createUserWithEmailAndPassword(auth.currentUser?.email || "", NewPasswordForm.password);
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

    const router = useRouter();

    const createUserDocument = async (user: User) => {
        const userData = {
            id: user.uid,
            email: user.email,
        };
        await addDoc(
            collection(firestore, "users"),
            JSON.parse(JSON.stringify(userData))
        );
    };

    useEffect(() => {
        if (userCred) {
            createUserDocument(userCred.user);
            router.push(paths.LOGIN_PAGE);
        }
    }, [userCred, router]);

    return (
        <Background>
            <Container>
                <Title>Lupa Kata Sandi</Title>
                <Description>
                    Silahkan masukkan kata sandi baru
                </Description>

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

                    {(error || userError) && (
                        <Text textAlign="center" color="red" fontSize="10pt" mt={2}>
                            {error || FIREBASE_ERRORS[userError?.message as keyof typeof FIREBASE_ERRORS]}
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
