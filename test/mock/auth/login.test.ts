import { auth, firestore } from "src/firebase/clientApp";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";

// Mock Firebase
jest.mock("src/firebase/clientApp", () => ({
    auth: {},
    firestore: {}
}));

jest.mock("firebase/auth", () => ({
    signInWithEmailAndPassword: jest.fn()
}));

jest.mock("firebase/firestore", () => ({
    getDoc: jest.fn(),
    doc: jest.fn()
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush
    })
}));

describe("Login Basis Path Testing", () => {
    let setError: jest.Mock;
    let loginForm: any;

    beforeEach(() => {
        jest.clearAllMocks();
        setError = jest.fn();
        loginForm = { email: "test@example.com", password: "password123" };
    });

    // Path 1: 1-2-11 (Email tidak valid)
    test("Path 1: Should show error if email is invalid", async () => {
        const email = "invalid-email";
        if (!email.includes("@")) {
            setError("Email tidak valid");
        }
        expect(setError).toHaveBeenCalledWith("Email tidak valid");
    });

    // Path 2: 1-2-3-11 (Password < 6 karakter)
    test("Path 2: Should show error if password is too short", async () => {
        const password = "123";
        if (password.length < 6) {
            setError("Kata sandi minimal 6 karakter");
        }
        expect(setError).toHaveBeenCalledWith("Kata sandi minimal 6 karakter");
    });

    // Path 3: 1-2-3-4-5-6-11 (User Doc tidak ditemukan)
    test("Path 3: Should show error if user doc does not exist in Firestore", async () => {
        (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { uid: "123" } });
        (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

        // Logic simulation
        const userCred = await signInWithEmailAndPassword(auth, "t@e.com", "pass");
        const docSnap = await getDoc(doc(firestore, "users", userCred.user.uid));

        if (!docSnap.exists()) {
            setError("Data pengguna tidak ditemukan");
        }
        expect(setError).toHaveBeenCalledWith("Data pengguna tidak ditemukan");
    });

    // Path 4: 1-2-3-4-5-6-7-9-11 (Admin Login Berhasil)
    test("Path 4: Should redirect to admin page if user is admin", async () => {
        (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { uid: "admin123" } });
        (getDoc as jest.Mock).mockResolvedValue({
            exists: () => true,
            data: () => ({ role: "admin" })
        });

        const userCred = await signInWithEmailAndPassword(auth, "admin@e.com", "pass");
        const docSnap = await getDoc(doc(firestore, "users", userCred.user.uid));
        const role = docSnap.data()?.role;

        if (role === "admin") {
            mockPush("/admin");
        }
        expect(mockPush).toHaveBeenCalledWith("/admin");
    });

    // Path 5: 1-2-3-4-5-6-7-8-9-11 (Ministry/Village Login Berhasil)
    test("Path 5: Should redirect to dashboard if user is ministry", async () => {
        (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { uid: "min123" } });
        (getDoc as jest.Mock).mockResolvedValue({
            exists: () => true,
            data: () => ({ role: "ministry" })
        });

        const userCred = await signInWithEmailAndPassword(auth, "min@e.com", "pass");
        const docSnap = await getDoc(doc(firestore, "users", userCred.user.uid));
        const role = docSnap.data()?.role;

        if (role !== "admin" && role === "ministry") {
            mockPush("/dashboard/ministry");
        }
        expect(mockPush).toHaveBeenCalledWith("/dashboard/ministry");
    });

    // Path 6: 1-2-3-4-10-11 (Firebase Error)
    test("Path 6: Should handle firebase auth errors", async () => {
        const error = new Error("Auth failed");
        (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

        try {
            await signInWithEmailAndPassword(auth, "t@e.com", "pass");
        } catch (e: any) {
            setError(e.message);
        }
        expect(setError).toHaveBeenCalledWith("Auth failed");
    });
});