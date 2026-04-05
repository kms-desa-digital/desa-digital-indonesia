import { IconButton, Tooltip } from "@chakra-ui/react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, firestore } from "../../../firebase/clientApp";
import { FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";

const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      sessionStorage.setItem("postLogoutRedirect", "landing");
      await signOut(auth);
      router.push("/");
      toast.success("Berhasil Logout", {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Tooltip label="Logout" aria-label="Logout Tooltip">
      <IconButton
        icon={<FiLogOut style={{ strokeWidth: 3 }} />}
        aria-label="Logout"
        variant="ghost"
        color="white"
        onClick={handleLogout}
        _hover={{ bg: "#265B43" }}
      />
    </Tooltip>
  );
};

export default LogoutButton;    