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
import { getVillageById } from "Services/villageServices";
import { getInnovatorById } from "Services/innovatorServices";

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

  // Cek profile berdasarkan role dari MongoDB
  useEffect(() => {
    const fetchProfileStatus = async () => {
      const user = auth.currentUser;
      const role = tokenRole || contextRole;
      if (user && role) {
        if (role === "village") {
          try {
            const res: any = await getVillageById(user.uid);
            const data = res.village || res.data || res;
            if (data && (data._id || data.id)) {
              setProfileExists(true);
              setStatus(data.status);
            } else {
              setProfileExists(false);
            }
          } catch (err) {
            setProfileExists(false);
          }
        } else if (role === "innovator") {
          try {
            const res: any = await getInnovatorById(user.uid);
            const data = res.innovator || res.data || res;
            if (data && (data._id || data.id)) {
              setProfileExists(true);
              setStatus(data.status);
            } else {
              setProfileExists(false);
            }
          } catch (err) {
            setProfileExists(false);
          }
        }
      }
    };

    fetchProfileStatus();
  }, [tokenRole, contextRole]);

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

  const handleProfileClick = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const role = userRole || tokenRole || contextRole;

    if (role === "village") {
      try {
        const res: any = await getVillageById(user.uid);
        const data = res.village || res.data;
        if (data && data.status) {
          router.push(paths.VILLAGE_PROFILE_PAGE.replace(":id", user.uid));
        } else {
          router.push(paths.VILLAGE_FORM);
        }
      } catch (err) {
        router.push(paths.VILLAGE_FORM);
      }
    } else if (role === "innovator") {
      try {
        const res: any = await getInnovatorById(user.uid);
        const data = res.innovator || res.data;
        if (data && data.status) {
          router.push(paths.INNOVATOR_PROFILE_PAGE.replace(":id", user.uid));
        } else {
          router.push(paths.INNOVATOR_FORM);
        }
      } catch (err) {
        router.push(paths.INNOVATOR_FORM);
      }
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.setItem("postLogoutRedirect", "landing");
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
      <Menu placement="bottom-end">
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

        <MenuList maxW="calc(100vw - 24px)" minW="190px">
          {user || token ? (
            <>
              {(userRole?.toLowerCase() === "village" ||
                userRole?.toLowerCase() === "innovator" ||
                tokenRole?.toLowerCase() === "village" ||
                tokenRole?.toLowerCase() === "innovator" ||
                contextRole?.toLowerCase() === "village" ||
                contextRole?.toLowerCase() === "innovator") && (
                  <MenuItem onClick={handleProfileClick}>
                    {profileExists ? "Profile" : "Isi Profile"}
                  </MenuItem>
                )}

              {/** Report disembunyikan sementara untuk semua role */}

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