/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClaimInovasiManual from '@/app/village/klaimInovasi/manual/page';
import { claimInnovation } from 'Services/villageServices';
import { useAuthState } from 'react-firebase-hooks/auth';

// Mock dependencies
jest.mock('react-firebase-hooks/auth', () => ({
    useAuthState: jest.fn()
}));

jest.mock('Services/villageServices', () => ({
    getVillageById: jest.fn(),
    claimInnovation: jest.fn(),
    getClaimById: jest.fn(),
    updateClaim: jest.fn(),
    deleteClaim: jest.fn()
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useParams: () => ({ id: '123' }),
    useSearchParams: () => ({
        get: (key: string) => {
            if (key === 'innovationId') return 'inov-123';
            if (key === 'innovationName') return 'Inovasi Keren';
            return null;
        }
    })
}));

jest.mock('src/firebase/clientApp', () => ({
    auth: { currentUser: { uid: 'village-123', getIdToken: jest.fn().mockResolvedValue('token') } },
    firestore: {}
}));

// Mock komponen UI yang kompleks
jest.mock('Components/topBar', () => ({ children }: any) => <div>{children}</div>);
jest.mock('Components/form/ImageUpload', () => () => <div data-testid="mock-image-upload" />);
jest.mock('Components/confirmModal/confModal', () => (props: any) => (
    props.isOpen ? <div data-testid="mock-conf-modal"><button onClick={props.onConfirm}>Confirm</button></div> : null
));

describe('Pengujian Komponen Asli - Klaim Inovasi Manual', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthState as jest.Mock).mockReturnValue([{ uid: 'village-123' }]);
    });

    test('Path 1: Render halaman dengan data inovasi dari URL', () => {
        render(<ClaimInovasiManual />);
        expect(screen.getByDisplayValue(/Inovasi Keren/i)).toBeTruthy();
    });

    test('Path 2: Memilih Checkbox Foto harus merender komponen ImageUpload', async () => {
        render(<ClaimInovasiManual />);

        // Pilih checkbox Foto
        const labelFoto = screen.getByText(/^Foto$/);
        fireEvent.click(labelFoto);

        // Pastikan ImageUpload muncul
        await waitFor(() => {
            expect(screen.getAllByTestId('mock-image-upload')).toHaveLength(3);
        });
    });

    test('Path 3: Simulasi pengisian form dan submit', async () => {
        render(<ClaimInovasiManual />);

        // Fill text inputs
        fireEvent.change(screen.getByPlaceholderText('Nama Inovator'), { target: { name: 'inovatorName', value: 'Inovator Handal' } });
        fireEvent.change(screen.getByPlaceholderText('Nama Inovasi'), { target: { name: 'inovationName', value: 'Inovasi Keren' } });
        fireEvent.change(screen.getByPlaceholderText('Masukkan deskripsi singkat tentang inovasi'), { target: { name: 'description', value: 'Kami sudah menerapkan inovasi ini sejak lama.' } });

        // 1. Pilih jenis klaim
        fireEvent.click(screen.getByText(/^Foto$/));

        // Click mock image uploads to simulate file uploads
        const uploads = screen.getAllByTestId('mock-image-upload');
        fireEvent.click(uploads[0]); // Logo
        fireEvent.click(uploads[1]); // Main Photo
        fireEvent.click(uploads[2]); // Evidence Photo

        // 3. Klik tombol submit
        fireEvent.click(screen.getByRole('button', { name: /Ajukan Klaim/i }));

        // 4. Konfirmasi di modal
        await waitFor(() => {
            const confirmBtn = screen.getByText('Confirm');
            fireEvent.click(confirmBtn);
        });

        // 5. Pastikan service dipanggil
        await waitFor(() => {
            expect(claimInnovation).toHaveBeenCalled();
        });
    });
});