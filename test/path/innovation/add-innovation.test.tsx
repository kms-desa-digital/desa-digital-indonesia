/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddInnovation from '@/app/innovation/add/page';
import { addInnovation } from 'Services/innovationServices';
import { useAuthState } from 'react-firebase-hooks/auth';

// Mock dependencies
jest.mock('react-firebase-hooks/auth', () => ({
    useAuthState: jest.fn()
}));

jest.mock('Services/innovationServices', () => ({
    addInnovation: jest.fn(),
    updateInnovation: jest.fn(),
    getInnovationById: jest.fn()
}));

jest.mock('react-toastify', () => ({
    useToast: () => jest.fn()
}));

jest.mock('Services/innovatorServices', () => ({
    getInnovatorById: jest.fn(),
    updateInnovator: jest.fn()
}));

const mockGetParams = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useParams: () => ({ id: '123' }),
    useSearchParams: () => ({ get: mockGetParams })
}));

jest.mock('src/contexts/UserContext', () => ({
    useUser: () => ({ role: 'innovator', loading: false, user: { uid: 'innovator-123' } })
}));

jest.mock('src/firebase/clientApp', () => ({
    auth: { currentUser: { uid: 'innovator-123', getIdToken: jest.fn().mockResolvedValue('token') } },
    firestore: {},
    storage: {}
}));

jest.mock('Components/topBar', () => ({ children, title }: any) => (
    <div data-testid="mock-topbar">
        <h1>{title}</h1>
        {children}
    </div>
));
jest.mock('Components/form/BottomSheetSelector', () => (props: any) => (
    <div data-testid="mock-category-selector" onClick={() => props.onChange('cat-1', 'Teknologi')}>
        {props.value || 'Pilih kategori'}
    </div>
));
jest.mock('Components/form/ImageUpload', () => (props: any) => (
    <div data-testid="mock-image-upload" onClick={() => props.setSelectedFile(['file1.jpg'])}>
        Image Upload Mock
    </div>
));
jest.mock('Components/confirmModal/confModal', () => (props: any) => (
    props.isOpen ? <div data-testid="mock-conf-modal"><button onClick={props.onConfirm}>Confirm</button></div> : null
));

describe('Pengujian Komponen Asli - Add Innovation Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthState as jest.Mock).mockReturnValue([{ uid: 'innovator-123' }]);
    });

    test('Path 3: Memvalidasi pengisian form dan pemanggilan simpan (Create New)', async () => {
        mockGetParams.mockReturnValue(null);
        render(<AddInnovation />);

        const nameInput = screen.getByPlaceholderText('Nama Inovasi');
        fireEvent.change(nameInput, { target: { name: 'name', value: 'Inovasi Desa Pintar' } });

        const yearInput = screen.getByPlaceholderText('Ketik tahun');
        fireEvent.change(yearInput, { target: { name: 'year', value: '2024' } });

        const descInput = screen.getByPlaceholderText('Masukkan deskripsi singkat tentang inovasi');
        fireEvent.change(descInput, { target: { name: 'description', value: 'Ini adalah deskripsi inovasi yang sangat berguna untuk masyarakat desa.' } });

        fireEvent.click(screen.getByTestId('mock-category-selector'));

        const checkboxModel = screen.getByText(/Gratis/i);
        fireEvent.click(checkboxModel);

        fireEvent.click(screen.getByTestId('mock-image-upload'));

        const submitButton = screen.getByText('Ajukan Inovasi');
        fireEvent.click(submitButton);

        await waitFor(() => {
            const confirmBtn = screen.getByText('Confirm');
            fireEvent.click(confirmBtn);
        });

        await waitFor(() => {
            expect(addInnovation).toHaveBeenCalled();
        });
    });

    test('Path 1: Form belum lengkap (Simpan gagal)', async () => {
        mockGetParams.mockReturnValue(null);
        render(<AddInnovation />);
        
        // Klik tambah tanpa mengisi apa-apa
        const submitButton = screen.getByText('Ajukan Inovasi');
        fireEvent.click(submitButton);

        // Toast atau pesan error muncul, fungsi simpan tidak dipanggil
        await waitFor(() => {
            expect(addInnovation).not.toHaveBeenCalled();
            // Toast biasanya susah di-assert secara langsung jika tidak pakai spyOn, tapi kita pastikan addInnovation tidak terpanggil
        });
    });

    test('Path 2: Memperbarui Inovasi yang Ditolak (Edit Mode)', async () => {
        // Mock seolah-olah kita mengedit inovasi yang ditolak
        mockGetParams.mockImplementation((key: string) => {
            if (key === 'status') return 'Ditolak';
            if (key === 'innovationId') return 'inno-edit-123';
            return null;
        });
        
        // Mock getInnovationById untuk mengembalikan data awal
        const { getInnovationById, updateInnovation } = require('Services/innovationServices');
        getInnovationById.mockResolvedValue({
            innovation: {
                namaInovasi: 'Inovasi Lama',
                deskripsi: 'Desc lama',
                kategori: 'Kategori Lama',
                modelBisnis: ['B2B'],
                tahunDibuat: '2020',
                images: ['image1.png']
            }
        });

        render(<AddInnovation />);

        // Tunggu data di-load
        await waitFor(() => {
            expect(screen.getByDisplayValue('Inovasi Lama')).toBeTruthy();
        });

        // Edit nama
        const nameInput = screen.getByPlaceholderText('Nama Inovasi');
        fireEvent.change(nameInput, { target: { name: 'name', value: 'Inovasi Lama Diedit' } });

        const submitButton = screen.getByText('Ajukan Ulang');
        fireEvent.click(submitButton);

        await waitFor(() => {
            const confirmBtn = screen.getByText('Confirm');
            fireEvent.click(confirmBtn);
        });

        await waitFor(() => {
            expect(updateInnovation).toHaveBeenCalled();
        });
    });

    test('Path 4: Menangani error dari API saat submit', async () => {
        mockGetParams.mockReturnValue(null);
        const { addInnovation } = require('Services/innovationServices');
        addInnovation.mockRejectedValue(new Error('API Gagal'));

        render(<AddInnovation />);

        fireEvent.change(screen.getByPlaceholderText('Nama Inovasi'), { target: { name: 'name', value: 'Test Error' } });
        fireEvent.change(screen.getByPlaceholderText('Ketik tahun'), { target: { name: 'year', value: '2024' } });
        fireEvent.change(screen.getByPlaceholderText('Masukkan deskripsi singkat tentang inovasi'), { target: { name: 'description', value: 'Deskripsi lengkap' } });
        fireEvent.click(screen.getByTestId('mock-category-selector'));
        fireEvent.click(screen.getByText(/Gratis/i));
        fireEvent.click(screen.getByTestId('mock-image-upload'));

        fireEvent.click(screen.getByText('Ajukan Inovasi'));

        await waitFor(() => {
            const confirmBtn = screen.getByText('Confirm');
            fireEvent.click(confirmBtn);
        });

        // Pastikan tidak crash dan toast error terpanggil (di component)
        await waitFor(() => {
            expect(addInnovation).toHaveBeenCalled();
        });
    });
});