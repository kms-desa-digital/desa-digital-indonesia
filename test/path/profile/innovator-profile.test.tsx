/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import InnovatorProfile from '@/app/innovator/profile/[id]/page';
import { getInnovatorById } from 'Services/innovatorServices';

// Mock dependencies
jest.mock('Services/innovatorServices', () => ({
    getInnovatorById: jest.fn(),
    getAssistedVillages: jest.fn().mockResolvedValue({ success: true, villages: [] })
}));

jest.mock('Services/innovationServices', () => ({
    getInnovation: jest.fn().mockResolvedValue({ success: true, innovations: [] })
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useParams: () => ({ id: 'innovator-123' }),
}));

jest.mock('src/contexts/UserContext', () => ({
    useUser: () => ({ role: 'innovator', user: { uid: 'innovator-123' } })
}));

jest.mock('react-firebase-hooks/auth', () => ({
    useAuthState: jest.fn(() => [{ uid: 'innovator-123' }])
}));

jest.mock('Components/topBar', () => () => <div data-testid="mock-topbar" />);
jest.mock('Components/loading', () => () => <div data-testid="mock-loading" />);

describe('Pengujian Komponen Asli - Innovator Profile Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Harus memunculkan data profil inovator dengan benar', async () => {
        (getInnovatorById as jest.Mock).mockResolvedValue({
            success: true,
            innovator: {
                namaInovator: 'Inovator Handal',
                deskripsi: 'Ahli teknologi desa',
                lokasi: 'Bandung',
                logo: 'logo.png'
            }
        });

        render(<InnovatorProfile />);

        // 1. Tunggu loading selesai
        await waitFor(() => expect(screen.queryByTestId('mock-loading')).toBeNull());

        // 2. Pastikan data muncul
        await waitFor(() => {
            expect(screen.getByText(/Inovator Handal/i)).toBeTruthy();
            expect(screen.getByText(/Ahli teknologi desa/i)).toBeTruthy();
        });
    });
});