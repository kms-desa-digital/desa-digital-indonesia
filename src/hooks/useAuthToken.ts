import { useEffect, useState } from 'react';

/**
 * Custom hook untuk track JWT token di localStorage secara reaktif
 * Mendeteksi perubahan token dan trigger re-render
 */
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load token dan role dari localStorage saat mount
    const loadToken = () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem("token");
        const storedRole = localStorage.getItem("userRole");
        setToken(storedToken);
        setRole(storedRole);
        setIsLoaded(true);
      }
    };

    loadToken();

    // Listen untuk perubahan pada tab/window lain (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "userRole") {
        loadToken();
      }
    };

    // Custom event untuk same-page changes
    const handleCustomStorageChange = () => {
      loadToken();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth:tokenChanged", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth:tokenChanged", handleCustomStorageChange);
    };
  }, []);

  /**
   * Update token dan role, dengan custom event untuk trigger reactive updates
   */
  const setTokenAndRole = (newToken: string | null, newRole: string | null) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      localStorage.setItem("userRole", newRole || "");
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
    }
    
    // Dispatch custom event agar same-page listeners tahu ada perubahan
    window.dispatchEvent(new Event("auth:tokenChanged"));
    
    setToken(newToken);
    setRole(newRole);
  };

  return {
    token,
    role,
    isAuthenticated: !!token,
    isLoaded,
    setTokenAndRole,
  };
}
