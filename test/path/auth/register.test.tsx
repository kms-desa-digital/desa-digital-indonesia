/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '@/app/auth/register/page'; // Mengimpor KOMPONEN ASLI
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';

// Mock dependencies eksternal (Firebase & Router)
// Kita tetap mock ini karena kita tidak ingin menulis ke database asli saat test berjalan
jest.mock('firebase/auth', () => ({
    createUserWithEmailAndPassword: jest.fn(),
    getAuth: jest.fn(() => ({ currentUser: null }))
}));

jest.mock('firebase/firestore', () => ({
    setDoc: jest.fn(),
    doc: jest.fn(),
    getFirestore: jest.fn()
}));

jest.mock('src/firebase/clientApp', () => ({
    auth: { currentUser: { uid: 'uid-baru-123', getIdToken: jest.fn().mockResolvedValue('token') } },
    firestore: {}
}));

jest.mock('Components/topBar', () => () => <div data-testid="mock-topbar" />);

const mockPush = jest.fn();
const mockGetParams = jest.fn<any, any>();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, back: jest.fn(), refresh: jest.fn() }),
    useSearchParams: () => ({ get: mockGetParams })
}));

describe('Pengujian Komponen Asli - Register Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Path 1: Harus memunculkan pesan error di layar jika mendaftar tanpa memilih Role', async () => {
        // 1. Me-render komponen asli ke dalam DOM virtual
        render(<Register />);

        // 2. Simulasi User mengetik email & password
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { name: 'email', value: 'test@mail.com' } });

        // Karena ada dua input untuk password (password & konfirmasi)
        const passwordInputs = screen.getAllByPlaceholderText(/Kata sandi/i);
        fireEvent.change(passwordInputs[0], { target: { name: 'password', value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Tulis ulang kata sandi'), { target: { value: 'password123' } });

        // 3. User menekan tombol submit (TANPA memilih role radio button)
        fireEvent.click(screen.getByRole('button', { name: /Registrasi/i }));

        // 4. Kita cek apakah komponen ASLI benar-benar memunculkan teks error
        // Gunakan findByText (async) untuk menangani Suspense/Loading
        expect(await screen.findByText(/Silakan pilih role/i)).toBeTruthy();
    });

    test('Path 3: Harus memunculkan pesan error jika konfirmasi password tidak cocok', async () => {
        render(<Register />);

        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { name: 'email', value: 'test@mail.com' } });

        const passwordInputs = screen.getAllByPlaceholderText(/Kata sandi/i);
        fireEvent.change(passwordInputs[0], { target: { name: 'password', value: 'password123' } });

        // Simulasi typo pada konfirmasi password
        fireEvent.change(screen.getByPlaceholderText('Tulis ulang kata sandi'), { target: { value: 'typopassword' } });

        // Memilih Role Inovator (Radio button value "innovator")
        const radios = screen.getAllByRole('radio');
        fireEvent.click(radios[0]);

        fireEvent.click(screen.getByRole('button', { name: /Registrasi/i }));

        await waitFor(() => {
            expect(screen.getByText(/konfirmasi kata sandi tidak cocok/i)).toBeTruthy();
        });
    });

    test('Path 4: Pendaftaran standar berhasil dan memanggil fungsi Firebase', async () => {
        // Setup mock agar fungsi createUser dianggap sukses
        (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { uid: 'uid-baru-123' } });
        mockGetParams.mockReturnValue(null);

        render(<Register />);

        // Isi Form
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { name: 'email', value: 'test@gmail.com' } });

        const passwordInputs = screen.getAllByPlaceholderText(/Kata sandi/i);
        fireEvent.change(passwordInputs[0], { target: { name: 'password', value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Tulis ulang kata sandi'), { target: { value: 'password123' } });

        const radios = screen.getAllByRole('radio');
        fireEvent.click(radios[0]); // Pilih Inovator

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /Registrasi/i }));

        // Pastikan fungsi asli bereaksi memanggil Firebase dan router
        await waitFor(() => {
            expect(createUserWithEmailAndPassword).toHaveBeenCalled();
            expect(setDoc).toHaveBeenCalled();
            expect(mockPush).toHaveBeenCalled();
        }, { timeout: 3000 });
    });

    test('Path 2: Registrasi sukses melalui Google Flow', async () => {
        mockGetParams.mockReturnValue('google');

        render(<Register />);

        const radios = screen.getAllByRole('radio');
        fireEvent.click(radios[0]); // Pilih Inovator

        fireEvent.click(screen.getByRole('button', { name: /Registrasi/i }));

        await waitFor(() => {
            expect(setDoc).toHaveBeenCalled();
            expect(mockPush).toHaveBeenCalled();
        });
    });

    test('Path 5: Harus memunculkan error dari API (misal: email sudah digunakan)', async () => {
        mockGetParams.mockReturnValue(null);
        (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Firebase: Error (auth/email-already-in-use).'));

        render(<Register />);

        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { name: 'email', value: 'test@gmail.com' } });

        const passwordInputs = screen.getAllByPlaceholderText(/Kata sandi/i);
        fireEvent.change(passwordInputs[0], { target: { name: 'password', value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Tulis ulang kata sandi'), { target: { value: 'password123' } });

        const radios = screen.getAllByRole('radio');
        fireEvent.click(radios[0]);

        fireEvent.click(screen.getByRole('button', { name: /Registrasi/i }));

        await waitFor(() => {
            expect(screen.getByText(/Firebase: Error \(auth\/email-already-in-use\)\./i)).toBeTruthy();
        });
    });
});