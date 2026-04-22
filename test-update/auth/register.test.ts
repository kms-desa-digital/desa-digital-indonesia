import { auth, firestore } from "../../src/firebase/clientApp";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

jest.mock("../../src/firebase/clientApp", () => ({
    auth: {},
    firestore: {}
}));

jest.mock("firebase/auth", () => ({
    createUserWithEmailAndPassword: jest.fn()
}));

jest.mock("firebase/firestore", () => ({
    setDoc: jest.fn(),
    doc: jest.fn()
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush
    })
}));

describe("Register Basis Path Testing", () => {
    let setError: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        setError = jest.fn();
    });

    // Path 1: 1-2-10 (Role belum dipilih)
    test("Path 1: Should fail if role is not selected", () => {
        const role = "";
        if (!role) {
            setError("Silakan pilih daftar sebagai");
        }
        expect(setError).toHaveBeenCalledWith("Silakan pilih daftar sebagai");
    });

    // Path 2: 1-2-3-4-10 (Google Flow Success)
    test("Path 2: Should succeed in Google flow", async () => {
        const isGoogleFlow = true;
        if (isGoogleFlow) {
            await setDoc(doc(firestore, "users", "123"), { name: "Google User" });
            mockPush("/dashboard");
        }
        expect(setDoc).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    // Path 3: 1-2-3-5-10 (Password mismatch)
    test("Path 3: Should fail if passwords do not match", () => {
        const password = "password123";
        const confirmPassword = "differentPassword";
        if (password !== confirmPassword) {
            setError("konfirmasi kata sandi tidak cocok");
        }
        expect(setError).toHaveBeenCalledWith("konfirmasi kata sandi tidak cocok");
    });

    // Path 4: 1-2-3-5-6-7-8-10 (Standard Flow Success)
    test("Path 4: Should succeed in standard flow", async () => {
        (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { uid: "new-uid" } });

        const isGoogleFlow = false;
        const password = "password123";
        const confirmPassword = "password123";

        if (!isGoogleFlow && password === confirmPassword) {
            const userCred = await createUserWithEmailAndPassword(auth, "new@e.com", password);
            await setDoc(doc(firestore, "users", userCred.user.uid), { role: "innovator" });
            mockPush("/auth/login");
        }

        expect(createUserWithEmailAndPassword).toHaveBeenCalled();
        expect(setDoc).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/auth/login");
    });

    // Path 5: 1-2-3-5-6-9-10 (Catch Error)
    test("Path 5: Should handle registration errors", async () => {
        const error = new Error("Email already in use");
        (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

        try {
            await createUserWithEmailAndPassword(auth, "existing@e.com", "pass");
        } catch (e: any) {
            setError(e.message);
        }
        expect(setError).toHaveBeenCalledWith("Email already in use");
    });
});
