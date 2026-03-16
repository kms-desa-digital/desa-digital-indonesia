import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "src/firebase/clientApp";

type UserContextType = {
  uid: string | null;
  role: string | null;
  isInnovatorVerified: boolean;
  isVillageVerified: boolean;
  isInnovationVerified: boolean;
  loading: boolean;
  error: Error | null;
};

const UserContext = createContext<UserContextType>({
  uid: null,
  role: null,
  isInnovatorVerified: false,
  isVillageVerified: false,
  isInnovationVerified: false,
  loading: true,
  error: null,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authUser, loadingAuth, authError] = useAuthState(auth);
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isInnovatorVerified, setInnovatorVerified] = useState(false);
  const [isVillageVerified, setVillageVerified] = useState(false);
  const [isInnovationVerified, setInnovationVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      setError(null);

      // 1. Prioritas: Cek JWT Token (MongoDB)
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUid(data.user.uid);
            setRole(data.user.role);
            setInnovatorVerified(data.user.isInnovatorVerified);
            setVillageVerified(data.user.isVillageVerified);
            setInnovationVerified(data.user.isInnovationVerified);
            setLoading(false);
            return; // Berhasil load via JWT
          } else if (res.status === 401) {
             localStorage.removeItem("token");
          }
        } catch (err) {
          console.error("JWT verification failed:", err);
        }
      }

      // 2. Fallback: Firebase Auth (Lama)
      try {
        if (!authUser && !loadingAuth) {
          setUid(null);
          setRole(null);
          setInnovatorVerified(false);
          setVillageVerified(false);
        } else if (authUser) {
          setUid(authUser.uid);
          // Fetch role dari koleksi "users"
          const userSnap = await getDoc(doc(firestore, "users", authUser.uid));
          const userData = userSnap.exists() ? userSnap.data() : {};
          setRole((userData as any).role || null);

          // Cek status inovator
          const innovSnap = await getDoc(doc(firestore, "innovators", authUser.uid));
          setInnovatorVerified(innovSnap.exists() && (innovSnap.data() as any).status === "Terverifikasi");

          // Cek status desa
          const villageSnap = await getDoc(doc(firestore, "villages", authUser.uid));
          setVillageVerified(villageSnap.exists() && (villageSnap.data() as any).status === "Terverifikasi");
        }
      } catch (err: any) {
        console.error("Error loading firebase user context:", err);
        setError(err);
      } finally {
        if (!loadingAuth) setLoading(false);
      }
    };

    loadUserData();
  }, [authUser, loadingAuth]);

  return (
    <UserContext.Provider
      value={{
        uid,
        role,
        isInnovatorVerified,
        isVillageVerified,
        isInnovationVerified,
        loading,
        error: error || (authError as Error) || null,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
