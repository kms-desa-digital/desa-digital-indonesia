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
  firebaseUid: string | null;
  role: string | null;
  isInnovatorVerified: boolean;
  isVillageVerified: boolean;
  isInnovationVerified: boolean;
  loading: boolean;
  error: Error | null;
};

const UserContext = createContext<UserContextType>({
  uid: null,
  firebaseUid: null,
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
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
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
          setFirebaseUid(null);
          setRole(null);
          setInnovatorVerified(false);
          setVillageVerified(false);
          setInnovationVerified(false);
        } else if (authUser) {
          const token = await authUser.getIdToken();
          
          // Fetch user profile from MongoDB via API
          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const userData = data.user;
            
            setUid(userData.uid);
            setFirebaseUid(userData.firebaseUid);
            setRole(userData.role);
            setInnovatorVerified(userData.isInnovatorVerified);
            setVillageVerified(userData.isVillageVerified);
            setInnovationVerified(userData.isInnovationVerified);
          } else {
            // Fallback to minimal data from auth object if API fails
            console.warn("Failed to fetch user data from API, falling back to auth object");
            setUid(authUser.uid);
            setFirebaseUid(authUser.uid);
            
            // Still try to check Firestore as last resort (legacy compatibility)
            const userSnap = await getDoc(doc(firestore, "users", authUser.uid));
            const userData = userSnap.exists() ? userSnap.data() : {};
            setRole((userData as any).role || null);

            const innovSnap = await getDoc(doc(firestore, "innovators", authUser.uid));
            setInnovatorVerified(innovSnap.exists() && (innovSnap.data() as any).status === "Terverifikasi");

            const villageSnap = await getDoc(doc(firestore, "villages", authUser.uid));
            setVillageVerified(villageSnap.exists() && (villageSnap.data() as any).status === "Terverifikasi");
          }
        }
      } catch (err: any) {
        console.error("Error loading user context:", err);
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
        firebaseUid,
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
