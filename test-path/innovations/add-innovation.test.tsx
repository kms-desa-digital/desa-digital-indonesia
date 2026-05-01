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

jest.mock('Services/innovatorServices', () => ({
    getInnovatorById: jest.fn(),
    updateInnovator: jest.fn()
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useParams: () => ({ id: '123' }),
    useSearchParams: () => ({ get: jest.fn() })
}));

jest.mock('src/firebase/clientApp', () => ({
    auth: {},
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

    test('Path 1: Memvalidasi pengisian form dan pemanggilan simpan', async () => {
        render(<AddInnovation />);
        
        // 1. Isi Nama Inovasi
        const nameInput = screen.getByPlaceholderText('Nama Inovasi');
        fireEvent.change(nameInput, { target: { name: 'name', value: 'Inovasi Desa Pintar' } });

        // 2. Isi Tahun
        const yearInput = screen.getByPlaceholderText('Ketik tahun');
        fireEvent.change(yearInput, { target: { name: 'year', value: '2024' } });

        // 3. Isi Deskripsi
        const descInput = screen.getByPlaceholderText('Masukkan deskripsi singkat tentang inovasi');
        fireEvent.change(descInput, { target: { name: 'description', value: 'Ini adalah deskripsi inovasi yang sangat berguna untuk masyarakat desa.' } });

        // 4. Pilih Kategori (Klik mock category selector)
        fireEvent.click(screen.getByTestId('mock-category-selector'));

        // 5. Pilih Model Bisnis (Checkbox)
        const checkboxModel = screen.getByText(/Marketplace/i);
        fireEvent.click(checkboxModel);

        // 6. Upload Foto (Klik mock image upload)
        fireEvent.click(screen.getByTestId('mock-image-upload'));

        // 7. Klik Tambahkan di TopBar
        const submitButton = screen.getByText('Tambahkan');
        fireEvent.click(submitButton);

        // 8. Muncul Modal Konfirmasi, klik Confirm
        await waitFor(() => {
            const confirmBtn = screen.getByText('Confirm');
            fireEvent.click(confirmBtn);
        });

        // 9. Pastikan service dipanggil
        await waitFor(() => {
            expect(addInnovation).toHaveBeenCalled();
        });
    });
});
