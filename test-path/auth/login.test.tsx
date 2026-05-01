/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '@/app/auth/login/page';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

// Mock eksternal dependensi
jest.mock('firebase/auth', () => ({
    signInWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    GoogleAuthProvider: jest.fn(),
    getAuth: jest.fn(() => ({ currentUser: null }))
}));

jest.mock('firebase/firestore', () => ({
    getDoc: jest.fn(),
    doc: jest.fn(),
    getFirestore: jest.fn()
}));

jest.mock('src/firebase/clientApp', () => ({
    auth: {},
    firestore: {}
}));

// Mock routing Next.js
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, back: jest.fn(), refresh: jest.fn() }),
    useSearchParams: () => ({ get: jest.fn() })
}));

// Mock TopBar dan Toastify agar tidak error saat render
jest.mock('Components/topBar', () => () => <div data-testid="mock-topbar" />);
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
    }
}));

// Mock Path Consts agar kita tahu persis nilai kembaliannya
jest.mock('Consts/path', () => ({
    paths: {
        ADMIN_PAGE: '/admin',
        DASHBOARD_MINISTRY_HOME: '/ministry',
        LANDING_PAGE: '/home',
        REGISTER_PAGE: '/register'
    }
}));

describe('Pengujian Komponen Asli - Login Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Path 1: Harus memunculkan pesan error di layar jika email tidak valid', async () => {
        render(<Login />);
        
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { name: 'email', value: 'emailtanpa-at-sign' } });
        fireEvent.change(screen.getByPlaceholderText('Kata sandi'), { target: { name: 'password', value: '123456' } });
        
        const submitBtn = screen.getByRole('button', { name: /Masuk/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Email tidak valid')).toBeTruthy();
        });
    });

    test('Path 2: Harus memunculkan error jika password kurang dari 6 karakter', async () => {
        render(<Login />);
        
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { name: 'email', value: 'test@mail.com' } });
        fireEvent.change(screen.getByPlaceholderText('Kata sandi'), { target: { name: 'password', value: '123' } });
        
        const submitBtn = screen.getByRole('button', { name: /Masuk/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Kata sandi minimal 6 karakter')).toBeTruthy();
        });
    });

    test('Path 3: Login Sukses sebagai Admin dan diredirect', async () => {
        (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
            user: { uid: 'admin-uid', getIdToken: jest.fn() }
        });
        
        (getDoc as jest.Mock).mockResolvedValue({
            exists: () => true,
            data: () => ({ role: 'admin' })
        });

        render(<Login />);
        
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { name: 'email', value: 'admin@mail.com' } });
        fireEvent.change(screen.getByPlaceholderText('Kata sandi'), { target: { name: 'password', value: 'rahasia123' } });
        
        const submitBtn = screen.getByRole('button', { name: /Masuk/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(signInWithEmailAndPassword).toHaveBeenCalled();
            expect(getDoc).toHaveBeenCalled();
            expect(mockPush).toHaveBeenCalledWith('/admin');
        });
    });
});
