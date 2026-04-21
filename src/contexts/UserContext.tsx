import {
  doc,
  getDoc,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { onIdTokenChanged } from "firebase/auth";
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

  // Dispatch event saat sesi Firebase berubah agar useAuthToken hook sinkron
  // Token TIDAK disimpan ke localStorage — tetap di memory (useAuthToken via onIdTokenChanged)
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        // Cukup dispatch event — useAuthToken akan ambil token fresh dari Firebase
        window.dispatchEvent(new Event("auth:tokenChanged"));
        
        // Log token for debugging/testing
        const token = await user.getIdToken();
        console.log("Firebase ID Token:", token);
      } else {
        localStorage.removeItem("userRole");
        window.dispatchEvent(new Event("auth:tokenChanged"));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!authUser && !loadingAuth) {
          setUid(null);
          setRole(null);
          setInnovatorVerified(false);
          setVillageVerified(false);
          setInnovationVerified(false);
        } else if (authUser) {
          setUid(authUser.uid);

          const userSnap = await getDoc(doc(firestore, "users", authUser.uid));
          const userData = userSnap.exists() ? userSnap.data() : {};
          setRole((userData as any).role || null);

          const innovSnap = await getDoc(doc(firestore, "innovators", authUser.uid));
          setInnovatorVerified(innovSnap.exists() && (innovSnap.data() as any).status === "Terverifikasi");

          const villageSnap = await getDoc(doc(firestore, "villages", authUser.uid));
          setVillageVerified(villageSnap.exists() && (villageSnap.data() as any).status === "Terverifikasi");
          setInnovationVerified(false);
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
