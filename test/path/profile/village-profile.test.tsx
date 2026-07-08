/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import VillageProfile from '@/app/village/profile/[id]/page';
import { getVillageById } from 'Services/villageServices';

// Mock dependencies
jest.mock('Services/villageServices', () => ({
    getVillageById: jest.fn(),
    getVillageInnovations: jest.fn().mockResolvedValue({ success: true, innovations: [] })
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useParams: () => ({ id: 'village-123' }),
}));

jest.mock('src/contexts/UserContext', () => ({
    useUser: () => ({ role: 'village', user: { uid: 'village-123' } })
}));

jest.mock('react-firebase-hooks/auth', () => ({
    useAuthState: jest.fn(() => [{ uid: 'village-123' }])
}));

jest.mock('Components/topBar', () => () => <div data-testid="mock-topbar" />);
jest.mock('Components/loading', () => () => <div data-testid="mock-loading" />);

describe('Pengujian Komponen Asli - Village Profile Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Harus memunculkan data profil desa dengan benar', async () => {
        (getVillageById as jest.Mock).mockResolvedValue({
            success: true,
            village: {
                namaDesa: 'Desa Mandiri',
                deskripsi: 'Desa percontohan digital',
                lokasi: { provinsi: 'Jawa Barat' }
            }
        });

        render(<VillageProfile />);

        // 1. Tunggu loading selesai
        await waitFor(() => expect(screen.queryByTestId('mock-loading')).toBeNull());

        // 2. Pastikan data muncul
        await waitFor(() => {
            expect(screen.getByText(/Desa Mandiri/i)).toBeTruthy();
            expect(screen.getByText(/Desa percontohan digital/i)).toBeTruthy();
        });
    });
});