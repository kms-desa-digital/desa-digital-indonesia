import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../../firebase/clientApp";
import { FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";
import { paths } from "Consts/path";
import { useTranslations } from "next-intl";

const MinistryMenu = () => {
  const router = useRouter();
  const t = useTranslations("UserMenu");

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
    <Menu placement="bottom-end">
      <Tooltip label="Menu" aria-label="Menu Tooltip">
        <MenuButton
          as={IconButton}
          icon={<FiLogOut style={{ strokeWidth: 3 }} />}
          aria-label="Menu"
          variant="ghost"
          color="white"
          _hover={{ bg: "#265B43" }}
          _active={{ bg: "#265B43" }}
          height="40px"
        />
      </Tooltip>
      <MenuList maxW="calc(100vw - 24px)" minW="190px" color="black">
        <MenuItem onClick={handleLogout}>
          {t("logout") || "Logout"}
        </MenuItem>
        <MenuItem onClick={() => router.push(paths.BANTUAN_FAQ_PAGE)}>
          {t("helpFaq") || "Bantuan & FAQ"}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default MinistryMenu;
