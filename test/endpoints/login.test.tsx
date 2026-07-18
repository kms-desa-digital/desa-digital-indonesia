import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from '@/app/auth/login/page';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { paths } from 'Consts/path';

describe('Modul Autentikasi Login (UI & Logic)', () => {
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
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
  });

  const getFormElements = () => ({
    emailInput: screen.getByPlaceholderText(/^Email$/i),
    passwordInput: screen.getByPlaceholderText(/^Kata sandi$/i),
    loginButton: screen.getByRole('button', { name: /^Masuk$/i }),
  });

  test('Path 1 (Error): Login gagal - format email salah', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Gunakan @ untuk format email/i)).toBeInTheDocument();
    });

    expect(getDocs).not.toHaveBeenCalled();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('Path 2 (Error): Login gagal - password kurang 6 karakter', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Kata sandi minimal 6 karakter/i)).toBeInTheDocument();
    });

    expect(getDocs).not.toHaveBeenCalled();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('Path 3 (Error): Login gagal - data belum terdaftar di Firebase/Email tidak ada', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'notfound@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: true });

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Email belum terdaftar/i)).toBeInTheDocument();
    });

    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('Path 4 (Error): Login gagal - form email kosong', async () => {
    render(<Login />);
    const { passwordInput, loginButton } = getFormElements();

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Email wajib diisi/i)).toBeInTheDocument();
    });

    expect(getDocs).not.toHaveBeenCalled();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('Path 5 (Error): Login gagal - kredensial/password salah', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: false });
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/wrong-password',
    });

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Kata sandi salah/i)).toBeInTheDocument();
    });

    expect(localStorage.getItem('userRole')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test('Path 6 (Error): Login gagal - data pengguna tidak ditemukan di database', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: false });
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'uid-123' },
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Data pengguna tidak ditemukan/i)).toBeInTheDocument();
    });

    expect(localStorage.getItem('userRole')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  test('Path 7 (Success): Login berhasil - role Admin', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: false });
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'uid-123' },
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'admin' }),
    });

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(paths.ADMIN_PAGE);
    });

    expect(localStorage.getItem('userRole')).toBe('admin');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth:tokenChanged' })
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  test('Path 8 (Success): Login berhasil - role Ministry', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'ministry@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: false });
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'uid-123' },
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'ministry' }),
    });

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(paths.DASHBOARD_MINISTRY_HOME);
    });

    expect(localStorage.getItem('userRole')).toBe('ministry');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth:tokenChanged' })
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  test('Path 9 (Success): Login berhasil - role Village / Innovator', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'village@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: false });
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'uid-123' },
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'village' }),
    });

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(paths.LANDING_PAGE);
    });

    expect(localStorage.getItem('userRole')).toBe('village');
  });

  test('Path 10 (Error): Login gagal - email dan password kosong bersamaan', async () => {
    render(<Login />);
    const { loginButton } = getFormElements();

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Email dan kata sandi wajib diisi/i)).toBeInTheDocument();
    });

    expect(getDocs).not.toHaveBeenCalled();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('Path 11 (Error): Login gagal - password kosong (email terisi valid)', async () => {
    render(<Login />);
    const { emailInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Kata sandi wajib diisi/i)).toBeInTheDocument();
    });

    expect(getDocs).not.toHaveBeenCalled();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('Path 12 (Success): Role tersimpan huruf kapital (ADMIN) tetap dikenali dan dinormalisasi', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: false });
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'uid-123' },
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'ADMIN' }), // huruf kapital penuh
    });

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(paths.ADMIN_PAGE);
    });
    expect(localStorage.getItem('userRole')).toBe('admin');
  });

  test('Path 13 (Success dengan fallback): Role kosong/tidak ada di dokumen user, fallback ke landing page', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'norole@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: false });
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'uid-123' },
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({}), // tidak ada field 'role' sama sekali
    });

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(paths.LANDING_PAGE);
    });
  });

  test('Path 14 (Error): Kode error Firebase tidak dikenal, tampilkan pesan fallback generik', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: false });
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/kode-error-tidak-dikenal-xyz',
    });

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Terjadi kesalahan, coba lagi/i)).toBeInTheDocument();
    });
  });

  const getGoogleButton = () =>
    screen.getByRole('button', { name: /Masuk dengan Google/i });

  test('Path 15 (Google - Redirect): User baru via Google, diarahkan ke halaman registrasi', async () => {
    render(<Login />);

    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'google-uid-baru' },
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });

    fireEvent.click(getGoogleButton());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`${paths.REGISTER_PAGE}?google=1`);
    });

    // User baru belum boleh punya localStorage/role tersimpan.
    expect(localStorage.getItem('userRole')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test('Path 16 (Google - Redirect): User Google sudah ada tapi belum punya role, diarahkan ke halaman registrasi', async () => {
    render(<Login />);

    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'google-uid-tanpa-role' },
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({}),
    });

    fireEvent.click(getGoogleButton());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`${paths.REGISTER_PAGE}?google=1`);
    });

    expect(localStorage.getItem('userRole')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test('Path 17 (Google - Success): User Google dengan role admin, berhasil login dan redirect', async () => {
    render(<Login />);

    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'google-uid-admin' },
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'admin' }),
    });

    fireEvent.click(getGoogleButton());

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(paths.ADMIN_PAGE);
    });

    expect(localStorage.getItem('userRole')).toBe('admin');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth:tokenChanged' })
    );
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('Path 18 (Google - Success): User Google dengan role village, redirect ke landing page', async () => {
    render(<Login />);

    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'google-uid-village' },
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'village' }),
    });

    fireEvent.click(getGoogleButton());

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(paths.LANDING_PAGE);
    });

    expect(localStorage.getItem('userRole')).toBe('village');
  });

  test('Path 19 (Google - Error): Popup gagal/dibatalkan, tampilkan pesan fallback', async () => {
    render(<Login />);

    (signInWithPopup as jest.Mock).mockRejectedValueOnce({
      code: 'auth/popup-closed-oleh-user-xyz',
    });

    fireEvent.click(getGoogleButton());

    await waitFor(() => {
      expect(screen.getByText(/Gagal login dengan Google/i)).toBeInTheDocument();
    });

    expect(localStorage.getItem('userRole')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('Path 20 (UI): Klik ikon mata mengubah tipe input password menjadi text dan sebaliknya', async () => {
    render(<Login />);
    const passwordInput = screen.getByPlaceholderText(/^Kata sandi$/i) as HTMLInputElement;

    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getByLabelText(/Tampilkan kata sandi/i);
    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe('text');

    const hideButton = screen.getByLabelText(/Sembunyikan kata sandi/i);
    fireEvent.click(hideButton);

    expect(passwordInput.type).toBe('password');
  });

  test('Path 21 (Navigasi): Klik "Klik disini" mengarahkan ke halaman reset password', async () => {
    render(<Login />);

    fireEvent.click(screen.getByText(/Klik disini/i));

    expect(mockPush).toHaveBeenCalledWith(paths.EMAIL_RESET_PASSWORD_PAGE);
  });

  test('Path 22 (Navigasi): Klik "Registrasi" mengarahkan ke halaman registrasi', async () => {
    render(<Login />);

    fireEvent.click(screen.getByText(/^Registrasi$/i));

    expect(mockPush).toHaveBeenCalledWith(paths.REGISTER_PAGE);
  });

  test('Path 23 (UI): Tombol Masuk menunjukkan status loading selama proses async, lalu kembali normal', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    let resolveGetDocs: (value: any) => void = () => { };
    (getDocs as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => { resolveGetDocs = resolve; })
    );

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(loginButton).toBeDisabled();
    });

    resolveGetDocs({ empty: false });
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'uid-123' },
    });
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'village' }),
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });

    expect(loginButton).not.toBeDisabled();
  });

  test('Path 24 (UI): Pesan error hilang otomatis saat user mengetik ulang', async () => {
    render(<Login />);
    const { emailInput, passwordInput, loginButton } = getFormElements();

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Gunakan @ untuk format email/i)).toBeInTheDocument();
    });

    fireEvent.change(emailInput, { target: { value: 'invalid-email2' } });

    expect(screen.queryByText(/Gunakan @ untuk format email/i)).not.toBeInTheDocument();
  });
});
