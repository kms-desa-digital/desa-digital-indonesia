/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KlaimInovasi from '@/app/village/klaimInovasi/page';
import { claimInnovation, getVillageById } from 'Services/villageServices';
import { getInnovationById } from 'Services/innovationServices';
import { useAuthState } from 'react-firebase-hooks/auth';

// Mock dependencies
jest.mock('react-firebase-hooks/auth', () => ({
    useAuthState: jest.fn()
}));

jest.mock('src/contexts/UserContext', () => ({
    useUser: () => ({ role: 'village' })
}));

jest.mock('Services/villageServices', () => ({
    getVillageById: jest.fn().mockResolvedValue({ data: { namaDesa: 'Desa Uji' } }),
    claimInnovation: jest.fn(),
    getClaimById: jest.fn(),
    updateClaim: jest.fn(),
    deleteClaim: jest.fn()
}));

jest.mock('Services/innovationServices', () => ({
    getInnovationById: jest.fn().mockResolvedValue({ data: { namaInovasi: 'Inovasi Eksis' } })
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
    useSearchParams: () => ({
        get: jest.fn((key) => {
            if (key === 'inovasiId') return 'inovasi-123';
            return null;
        })
    })
}));

jest.mock('src/firebase/clientApp', () => ({
    auth: { currentUser: { uid: 'village-123' } },
    firestore: {}
}));

// Mock UI Components
jest.mock('Components/topBar', () => ({ children, title }: any) => (
    <div data-testid="mock-topbar">
        <h1>{title}</h1>
        {children}
    </div>
));
jest.mock('Components/form/ImageUpload', () => (props: any) => (
    <div data-testid="mock-image-upload" onClick={() => props.setSelectedFile(['file1.jpg'])}>
        Upload Image Mock
    </div>
));
jest.mock('Components/loading', () => () => <div data-testid="mock-loading" />);
jest.mock('Components/confirmModal/confModal', () => (props: any) => (
    props.isOpen ? <div data-testid="mock-conf-modal"><button onClick={props.onConfirm}>Confirm</button></div> : null
));

describe('Pengujian Komponen Asli - Klaim Inovasi (Normal)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthState as jest.Mock).mockReturnValue([{ uid: 'village-123' }]);
    });

    test('Path 1: Tombol Ajukan Klaim harus disabled jika belum memilih bukti', async () => {
        render(<KlaimInovasi />);
        await waitFor(() => expect(screen.queryByTestId('mock-loading')).toBeNull());

        const submitButton = screen.getByRole('button', { name: /Ajukan Klaim/i });
        expect(submitButton).toBeDisabled();
    });

    test('Path 2: Memilih jenis bukti foto dan mengisi file akan meng-enable tombol', async () => {
        render(<KlaimInovasi />);
        await waitFor(() => expect(screen.queryByTestId('mock-loading')).toBeNull());

        // 1. Pilih jenis bukti
        fireEvent.click(screen.getByText(/Foto/i));

        // 2. Simulasi upload file via mock click
        fireEvent.click(screen.getByTestId('mock-image-upload'));

        // 3. Tombol harusnya jadi enabled
        await waitFor(() => {
            const submitButton = screen.getByRole('button', { name: /Ajukan Klaim/i });
            expect(submitButton).not.toBeDisabled();
        });
    });

    test('Path 3: Berhasil mengajukan klaim', async () => {
        (claimInnovation as jest.Mock).mockResolvedValue({ success: true });
        
        render(<KlaimInovasi />);
        await waitFor(() => expect(screen.queryByTestId('mock-loading')).toBeNull());

        // 1. Pilih bukti dan isi file
        fireEvent.click(screen.getByText(/Foto/i));
        fireEvent.click(screen.getByTestId('mock-image-upload'));

        // 2. Klik submit
        const submitButton = screen.getByRole('button', { name: /Ajukan Klaim/i });
        fireEvent.click(submitButton);

        // 3. Konfirmasi di modal
        await waitFor(() => {
            const confirmBtn = screen.getByText('Confirm');
            fireEvent.click(confirmBtn);
        });

        // 4. Pastikan service dipanggil
        await waitFor(() => {
            expect(claimInnovation).toHaveBeenCalled();
        });
    });
});
