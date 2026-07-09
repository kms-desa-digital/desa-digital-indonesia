/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VerifyPage from '@/app/admin/verification/[category]/page';
import { getInnovators } from 'Services/innovatorServices';

// Mock dependencies
jest.mock('Services/innovatorServices', () => ({
    getInnovators: jest.fn()
}));
jest.mock('Services/villageServices', () => ({
    getVillages: jest.fn(),
    getClaims: jest.fn()
}));
jest.mock('Services/innovationServices', () => ({
    getInnovation: jest.fn()
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useParams: () => ({ category: 'Verifikasi Inovator' }),
    useSearchParams: () => ({ get: jest.fn(() => null) }),
}));

jest.mock('Components/topBar', () => ({ children, title }: any) => (
    <div>
        <h1>{title}</h1>
        {children}
    </div>
));

describe('Pengujian Komponen Asli - Admin Verification Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Path 1: Merender list data verifikasi dari API', async () => {
        (getInnovators as jest.Mock).mockResolvedValue({
            success: true,
            innovators: [
                { id: '1', namaInovator: 'Inovator A', status: 'Menunggu' },
                { id: '2', namaInovator: 'Inovator B', status: 'Terverifikasi' }
            ]
        });

        render(<VerifyPage />);

        await waitFor(() => {
            expect(screen.getByText('Inovator A')).toBeTruthy();
            expect(screen.getByText('Inovator B')).toBeTruthy();
        });
    });

    test('Path 2: Memfilter data saat memilih status dari menu', async () => {
        (getInnovators as jest.Mock).mockResolvedValue({
            success: true,
            innovators: [
                { id: '1', namaInovator: 'Inovator A', status: 'Menunggu' }
            ]
        });

        render(<VerifyPage />);

        // Tunggu data muncul
        await screen.findByText('Inovator A');

        // Buka menu filter
        const filterButton = screen.getAllByText(/Semua Status|Status|Semua|verificationFilterAll/i)[0];
        fireEvent.click(filterButton);

        // Pilih "Menunggu" dari menu
        const pendingOption = (await screen.findAllByText(/Menunggu|verificationFilterPending/i)).pop();
        if (pendingOption) fireEvent.click(pendingOption);

        // Pastikan API dipanggil kembali dengan filter status yang benar
        await waitFor(() => {
            expect(getInnovators).toHaveBeenCalledWith(expect.objectContaining({
                status: 'Menunggu'
            }));
        });
    });
});