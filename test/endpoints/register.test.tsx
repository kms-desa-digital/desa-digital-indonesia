import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Register from '@/app/auth/register/page';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { paths } from 'Consts/path';
import { auth } from 'src/firebase/clientApp';

describe('Modul Autentikasi Register (UI & Logic)', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockRefresh = jest.fn();

  let dispatchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      prefetch: jest.fn(),
      refresh: mockRefresh,
      back: jest.fn(),
    });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    (auth as any).currentUser = null;
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
  });

  const getFormElements = () => ({
    emailInput: screen.getByPlaceholderText(/^Email$/i),
    passwordInput: screen.getByPlaceholderText(/^Kata sandi$/i),
    confirmPasswordInput: screen.getByPlaceholderText(/Tulis ulang kata sandi/i),
    registerButton: screen.getByRole('button', { name: /^Registrasi$/i }),
  });

  const selectRole = (container: HTMLElement, role: 'innovator' | 'village' | 'ministry') => {
    const radio = container.querySelector(`input[name="role"][value="${role}"]`) as HTMLInputElement;
    fireEvent.click(radio);
    fireEvent.change(radio, { target: { name: 'role', value: role } });
  };

  test('Path 1 (Error): Register tanpa memilih role', async () => {
    const { container } = render(<Register />);
    const { emailInput, passwordInput, confirmPasswordInput, registerButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/Silakan pilih role/i)).toBeInTheDocument();
    });

    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
  });

  test('Path 2 (Success): Register sukses dengan Google Sign-In', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?google=1'));
    (auth as any).currentUser = { uid: 'google-uid-innovator', email: 'googleuser@example.com' };

    const { container } = render(<Register />);

    (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

    selectRole(container, 'innovator');

    const submitButton = screen.getByRole('button', { name: /Lanjutkan/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(paths.LANDING_PAGE);
    });

    expect(setDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        id: 'google-uid-innovator',
        email: 'googleuser@example.com',
        role: 'innovator',
      })
    );
    expect(localStorage.getItem('userRole')).toBe('innovator');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth:tokenChanged' })
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  test('Path 3 (Error): Register gagal - format email salah', async () => {
    const { container } = render(<Register />);
    const { emailInput, passwordInput, confirmPasswordInput, registerButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'no-at-sign' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    selectRole(container, 'innovator');

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/Gunakan @ untuk format email/i)).toBeInTheDocument();
    });
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('Path 4 (Error): Register dengan email dan password kosong', async () => {
    const { container } = render(<Register />);
    const { registerButton } = getFormElements();
    selectRole(container, 'innovator');

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/Email dan kata sandi harus diisi/i)).toBeInTheDocument();
    });
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('Path 5 (Error): Register dengan password kurang 6 karakter', async () => {
    const { container } = render(<Register />);
    const { emailInput, passwordInput, confirmPasswordInput, registerButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
    selectRole(container, 'innovator');

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getAllByText(/Kata sandi minimal 6 karakter/i).length).toBeGreaterThan(0);
    });
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('Path 6 (Error): Register dengan password dan konfirmasi tidak cocok', async () => {
    const { container } = render(<Register />);
    const { emailInput, passwordInput, confirmPasswordInput, registerButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
    selectRole(container, 'innovator');

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/Kata sandi dan konfirmasi kata sandi tidak cocok/i)).toBeInTheDocument();
    });
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('Path 7 (Error): Register gagal - kolom konfirmasi password dikosongkan', async () => {
    const { container } = render(<Register />);
    const { emailInput, passwordInput, registerButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    selectRole(container, 'innovator');

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/Konfirmasi kata sandi wajib diisi/i)).toBeInTheDocument();
    });
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('Path 8 (Error): Register gagal - email sudah digunakan (bentuk error Firebase realistis)', async () => {
    const { container } = render(<Register />);
    const { emailInput, passwordInput, confirmPasswordInput, registerButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'used@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    selectRole(container, 'innovator');

    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/email-already-in-use',
      message:
        'Firebase: The email address is already in use by another account. (auth/email-already-in-use).',
    });

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/Email sudah terdaftar/i)).toBeInTheDocument();
    });
  });

  test('Path 9 (Success): Register user baru berhasil', async () => {
    const { container } = render(<Register />);
    const { emailInput, passwordInput, confirmPasswordInput, registerButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    selectRole(container, 'innovator');

    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'new-uid-123', email: 'newuser@example.com' },
    });
    (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(paths.LOGIN_PAGE);
    });

    expect(setDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        id: 'new-uid-123',
        email: 'newuser@example.com',
        role: 'innovator',
      })
    );
    expect(localStorage.getItem('userRole')).toBeNull();
  });

  test('Path 10 (Error): Email kosong sendirian (password terisi)', async () => {
    const { container } = render(<Register />);
    const { passwordInput, confirmPasswordInput, registerButton } = getFormElements();

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    selectRole(container, 'innovator');

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/Email wajib diisi/i)).toBeInTheDocument();
    });
  });

  test('Path 11 (Error): Password kosong sendirian (email terisi)', async () => {
    const { container } = render(<Register />);
    const { emailInput, registerButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    selectRole(container, 'innovator');

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/Kata sandi wajib diisi/i)).toBeInTheDocument();
    });
  });

  test('Path 12 (Error - Google): Role belum dipilih pada jalur Google', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?google=1'));
    (auth as any).currentUser = { uid: 'google-uid-x', email: 'g@example.com' };

    render(<Register />);
    const submitButton = screen.getByRole('button', { name: /Lanjutkan/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Silakan pilih daftar sebagai/i)).toBeInTheDocument();
    });
    expect(setDoc).not.toHaveBeenCalled();
  });

  test('Path 13 (Error - Google): auth.currentUser null saat submit', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?google=1'));
    (auth as any).currentUser = null;

    const { container } = render(<Register />);
    selectRole(container, 'innovator');

    const submitButton = screen.getByRole('button', { name: /Lanjutkan/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Sesi Google tidak ditemukan, silakan login ulang/i)).toBeInTheDocument();
    });
    expect(setDoc).not.toHaveBeenCalled();
  });

  test('Path 14 (Success - Google): Redirect role village ke landing page', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?google=1'));
    (auth as any).currentUser = { uid: 'google-uid-village', email: 'gvillage@example.com' };

    const { container } = render(<Register />);
    (setDoc as jest.Mock).mockResolvedValueOnce(undefined);
    selectRole(container, 'village');

    fireEvent.click(screen.getByRole('button', { name: /Lanjutkan/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(paths.LANDING_PAGE);
    });
    expect(localStorage.getItem('userRole')).toBe('village');
  });

  test('Path 15 (Success - Google): Redirect role ministry ke dashboard ministry', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?google=1'));
    (auth as any).currentUser = { uid: 'google-uid-ministry', email: 'gministry@example.com' };

    const { container } = render(<Register />);
    (setDoc as jest.Mock).mockResolvedValueOnce(undefined);
    selectRole(container, 'ministry');

    fireEvent.click(screen.getByRole('button', { name: /Lanjutkan/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(paths.DASHBOARD_MINISTRY_HOME);
    });
    expect(localStorage.getItem('userRole')).toBe('ministry');
  });

  test('Path 16 (Error - Google): setDoc gagal, selalu tampilkan pesan generik', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?google=1'));
    (auth as any).currentUser = { uid: 'google-uid-fail', email: 'gfail@example.com' };

    const { container } = render(<Register />);
    (setDoc as jest.Mock).mockRejectedValueOnce(new Error('Firestore write failed'));
    selectRole(container, 'innovator');

    fireEvent.click(screen.getByRole('button', { name: /Lanjutkan/i }));

    await waitFor(() => {
      expect(screen.getByText(/Terjadi kesalahan, coba lagi/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(localStorage.getItem('userRole')).toBeNull();
  });

  test('Path 17 (UI - Google): Email otomatis terisi dari sesi Google', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?google=1'));
    (auth as any).currentUser = { uid: 'google-uid-autofill', email: 'autofill@example.com' };

    render(<Register />);

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText(/^Email$/i) as HTMLInputElement;
      expect(emailInput.value).toBe('autofill@example.com');
      expect(emailInput).toHaveAttribute('readonly');
    });
  });

  test('Path 18 (UI): Toggle show/hide untuk field password dan confirmPassword secara independen', async () => {
    render(<Register />);
    const passwordInput = screen.getByPlaceholderText(/^Kata sandi$/i) as HTMLInputElement;
    const confirmInput = screen.getByPlaceholderText(/Tulis ulang kata sandi/i) as HTMLInputElement;

    expect(passwordInput.type).toBe('password');
    expect(confirmInput.type).toBe('password');

    fireEvent.click(screen.getByLabelText(/^Tampilkan kata sandi$/i));
    expect(passwordInput.type).toBe('text');
    expect(confirmInput.type).toBe('password'); // TIDAK BOLEH ikut berubah

    fireEvent.click(screen.getByLabelText(/^Tampilkan konfirmasi kata sandi$/i));
    expect(confirmInput.type).toBe('text');
    expect(passwordInput.type).toBe('text'); // tetap dari toggle sebelumnya
  });

  test('Path 19 (Navigasi): Klik "Login" mengarahkan ke halaman login', async () => {
    render(<Register />);

    fireEvent.click(screen.getByText(/^Login$/i));

    expect(mockPush).toHaveBeenCalledWith(paths.LOGIN_PAGE);
  });

  test('Path 20 (UI): Tombol Registrasi menunjukkan status loading selama proses async', async () => {
    const { container } = render(<Register />);
    const { emailInput, passwordInput, confirmPasswordInput, registerButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'loading@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    selectRole(container, 'innovator');

    let resolveCreateUser: (value: any) => void = () => { };
    (createUserWithEmailAndPassword as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => { resolveCreateUser = resolve; })
    );

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(registerButton).toBeDisabled();
    });

    resolveCreateUser({ user: { uid: 'loading-uid', email: 'loading@example.com' } });
    (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
    expect(registerButton).not.toBeDisabled();
  });

  test('Path 21 (UI): Pesan error hilang otomatis saat user mengetik ulang', async () => {
    const { container } = render(<Register />);
    const { emailInput, passwordInput, confirmPasswordInput, registerButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'no-at-sign' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    selectRole(container, 'innovator');

    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/Gunakan @ untuk format email/i)).toBeInTheDocument();
    });

    fireEvent.change(emailInput, { target: { value: 'no-at-sign-2' } });

    expect(screen.queryByText(/Gunakan @ untuk format email/i)).not.toBeInTheDocument();
  });
});