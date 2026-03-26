"use client";

import {
  Button,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import notification from "@public/icons/bell.svg";
import profileIcon from "@public/icons/profile.svg";
import { paths } from "Consts/path";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  // DocumentData, 
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import React, { useEffect, useState } from "react";
// import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-toastify";
import { auth, firestore } from "../../../firebase/clientApp";
import { useUser } from "../../../contexts/UserContext";
import { useAuthToken } from "../../../hooks/useAuthToken";

type UserMenuProps = {
  user?: User | null;
};

const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const router = useRouter();

  // const [userLogin] = useAuthState(auth); 
  const { role: contextRole } = useUser();
  const { token, role: tokenRole, setTokenAndRole } = useAuthToken();

  // const [userData, setUserData] = useState<DocumentData | undefined>(); 
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Ambil role dari token atau context
  useEffect(() => {
    const role = tokenRole || contextRole;
    setUserRole(role);
  }, [tokenRole, contextRole]);

  // Ambil role dari Firestore + cek profile berdasarkan role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const db = getFirestore();

        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("id", "==", user.uid));

        onSnapshot(userQuery, (snapshot) => {
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            setUserRole(userData.role);

            if (userData.role === "village") {
              const villagesRef = collection(db, "villages");
              const villageQuery = query(
                villagesRef,
                where("id", "==", user.uid)
              );

              onSnapshot(villageQuery, (villageSnapshot) => {
                setProfileExists(!villageSnapshot.empty);

                if (!villageSnapshot.empty) {
                  const data = villageSnapshot.docs[0].data();
                  setStatus(data?.status);
                }
              });

            } else if (userData.role === "innovator") {
              const innovatorsRef = collection(db, "innovators");
              const innovatorQuery = query(
                innovatorsRef,
                where("id", "==", user.uid)
              );

              onSnapshot(innovatorQuery, (innovatorSnapshot) => {
                setProfileExists(!innovatorSnapshot.empty);

                if (!innovatorSnapshot.empty) {
                  const data = innovatorSnapshot.docs[0].data();
                  setStatus(data?.status);
                }
              });

            } else {
              setProfileExists(false);
            }
          } else {
            setUserRole(null);
            setProfileExists(false);
          }
        });
      } else {
        setUserRole(null);
        setProfileExists(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /*
  useEffect(() => {
    const fetchUser = async () => {
      if (userLogin?.uid) {
        const userRef = doc(firestore, "users", userLogin.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
          setProfileExists(true);
        }
      }
    };
    fetchUser();
  }, [userLogin]);
  */

  /*
  useEffect(() => {
    const fetchVillage = async () => {
      if (user) {
        const villageRef = doc(firestore, "villages", user.uid);
        const villageSnap = await getDoc(villageRef);
        if (villageSnap.exists()) {
          const villageData = villageSnap.data();
          setStatus(villageData?.status);
        }
      }
    };
    fetchVillage();
  }, [user]);
  */

  /*
  useEffect(() => {
    const fetchInnovator = async () => {
      if (user) {
        const innovatorRef = doc(firestore, "innovators", user.uid);
        const innovatorSnap = await getDoc(innovatorRef);
        if (innovatorSnap.exists()) {
          const innovatorData = innovatorSnap.data();
          setStatus(innovatorData?.status);
        }
      }
    };
    fetchInnovator();
  }, [user]);
  */

  const handleProfileClick = () => {
    if (!user) return;

    if (userRole === "village") {
      if (status === "Terverifikasi") {
        const path = paths.VILLAGE_PROFILE_PAGE.replace(":id", user.uid);
        router.push(path);
      } else {
        router.push(paths.VILLAGE_FORM);
      }
    } else if (userRole === "innovator") {
      if (status === "Terverifikasi") {
        const path = paths.INNOVATOR_PROFILE_PAGE.replace(":id", user.uid);
        router.push(path);
      } else {
        router.push(paths.INNOVATOR_FORM);
      }
    }
  };

  const handleLogout = async () => {
    try {
      setTokenAndRole(null, null);
      window.dispatchEvent(new Event("auth:tokenChanged"));
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      toast.success("Berhasil Logout", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  return (
    <Flex justify="center" align="center" height="56px">
      <Menu>
        <Button
          padding={1}
          as={IconButton}
          aria-label="Notification"
          icon={
            <Image
              src={notification}
              alt="Bell"
              width={24}
              height={24}
              style={{ width: "24px", height: "24px" }}
            />
          }
          height="40px"
        />

        <MenuButton
          as={IconButton}
          aria-label="Profile"
          icon={
            <Image
              src={profileIcon}
              alt="Profile"
              width={24}
              height={24}
              style={{ width: "24px", height: "24px" }}
            />
          }
          height="40px"
        />

        <MenuList>
          {user || token ? (
            <>
              <MenuItem onClick={handleProfileClick}>
                {profileExists ? "Profile" : "Isi Profile"}
              </MenuItem>

              <MenuItem
                onClick={() => {
                  const currentRole = (userRole || tokenRole || contextRole)?.toLowerCase();
                  if (currentRole === "innovator") {
                    router.push(paths.REPORT_INNOVATOR);
                  } else if (currentRole === "village") {
                    router.push(paths.REPORT_VILLAGE);
                  } else if (currentRole === "admin") {
                    router.push(paths.REPORT_ADMIN);
                  }
                }}
              >
                Report
              </MenuItem>

              {(userRole?.toLowerCase() === "admin" ||
                tokenRole?.toLowerCase() === "admin" ||
                contextRole?.toLowerCase() === "admin") && (
                  <MenuItem
                    onClick={() => router.push(paths.CHATBOT_INGEST)}
                  >
                    Chatbot Data
                  </MenuItem>
                )}

              <MenuItem onClick={handleLogout}>Logout</MenuItem>

              <MenuItem
                onClick={() => router.push(paths.BANTUAN_FAQ_PAGE)}
              >
                Bantuan dan FAQ
              </MenuItem>
            </>
          ) : (
            <MenuItem onClick={() => router.push(paths.LOGIN_PAGE)}>
              Login
            </MenuItem>
          )}
        </MenuList>
      </Menu>
    </Flex>
  );
};

export default UserMenu;