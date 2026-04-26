import { useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from 'src/firebase/clientApp';

/**
 * Custom hook untuk mendapatkan Firebase ID Token secara reaktif dan aman.
 *
 * Strategi keamanan:
 * - Token TIDAK disimpan di localStorage (rentan XSS)
 * - Token disimpan di React state (memory only) — tidak bisa dicuri via script
 * - Firebase mengelola sesi login di IndexedDB secara internal
 * - onIdTokenChanged otomatis memperbaharui token tiap ~1 jam
 * - Role tetap disimpan di localStorage karena bukan data sensitif
 */
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Baca role dari localStorage (bukan data sensitif, aman)
    const storedRole = typeof window !== 'undefined'
      ? localStorage.getItem('userRole')
      : null;
    setRole(storedRole);

    // Listen perubahan Firebase ID Token (login, logout, token refresh ~tiap 1 jam)
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        // Ambil token fresh dari Firebase (disimpan aman di memori Firebase SDK)
        const freshToken = await user.getIdToken();
        setToken(freshToken);

        // Update role dari localStorage jika ada
        const currentRole = localStorage.getItem('userRole');
        setRole(currentRole);
      } else {
        // User logout — hapus token dari state
        setToken(null);
        setRole(null);
      }
      setIsLoaded(true);
    });

    // Listen custom event untuk sinkronisasi role antar komponen
    const handleRoleChange = () => {
      const updatedRole = localStorage.getItem('userRole');
      setRole(updatedRole);
    };

    window.addEventListener('auth:tokenChanged', handleRoleChange);

    return () => {
      unsubscribe();
      window.removeEventListener('auth:tokenChanged', handleRoleChange);
    };
  }, []);

  /**
   * Dipakai saat logout — bersihkan role dari localStorage
   * Token tidak perlu dihapus manual karena dikelola Firebase SDK
   */
  const setTokenAndRole = (newToken: string | null, newRole: string | null) => {
    if (newRole) {
      localStorage.setItem('userRole', newRole);
    } else {
      localStorage.removeItem('userRole');
    }

    // Token dikelola Firebase — hanya update state lokal jika ada nilai eksplisit
    if (newToken !== undefined) {
      setToken(newToken);
    }
    setRole(newRole);

    window.dispatchEvent(new Event('auth:tokenChanged'));
  };

  return {
    token,
    role,
    isAuthenticated: !!token,
    isLoaded,
    setTokenAndRole,
  };
}
