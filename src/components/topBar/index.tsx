import { ArrowBackIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, IconButton, Text } from "@chakra-ui/react";
import { HelpCircle } from "lucide-react";
import { paths } from "Consts/path";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { usePathname, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { useUser } from "src/contexts/UserContext";
import { useAuthToken } from "Hooks/useAuthToken";
import { auth, firestore } from "../../firebase/clientApp";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import UserMenu from "./RightContent/UserMenu";
import { FaCheck } from "react-icons/fa";
import { useTranslations } from "next-intl";

type TopBarProps = {
  title: string | undefined;
  onBack?: () => void;
  onFilterClick?: () => void;
  rightElement?: React.ReactNode;
};

function TopBar(props: TopBarProps) {
  const t = useTranslations("Common");
  const { title, onBack, onFilterClick, rightElement } = props;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [user] = useAuthState(auth);
  const { isAuthenticated } = useAuthToken();
  const [village, setVillage] = useState(false);
  const { isVillageVerified } = useUser();
  const [claimStatus, setClaimStatus] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allowedPaths = [
    paths.LANDING_PAGE,
    paths.ADMIN_PAGE,
    paths.VILLAGE_PAGE,
    paths.INNOVATOR_PAGE,
    paths.DASHBOARD_MINISTRY_HOME,
    "/admin",
    "/village",
    "/innovator",
    "/dashboard"
  ];

  const isUserMenuVisible = allowedPaths.includes(pathname);
  const isClaimButtonVisible =
    pathname.includes("/innovation/detail/") && id;

  useEffect(() => {
    const fecthVillage = async () => {
      if (user) {
        const Ref = doc(firestore, "villages", user.uid);
        const docSnap = await getDoc(Ref);
        if (docSnap.exists()) {
          setVillage(true);
        }
      }
    };
    fecthVillage();
  }, [user]);

  useEffect(() => {
    if (user && id) {
      const q = query(
        collection(firestore, "claimInnovations"),
        where("desaId", "==", user.uid),
        where("inovasiId", "==", id)
      );
      getDocs(q).then((querySnapshot) => {
        if (querySnapshot.empty) {
          setClaimStatus("");
        } else {
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            setClaimStatus(data.status);
          });
        }
      });
    }
  }, [user, id]);

  const { label, bg, color, leftIcon, isDisabled, hover } = (() => {
    switch (claimStatus) {
      case "Terverifikasi":
        return {
          label: t("claimStatus.verified"),
          bg: "#71A686",
          color: "white",
          leftIcon: <FaCheck />,
          isDisabled: true,
          hover: {
            bg: "#5C8B6F",
          },
        };
      case "Menunggu":
        return {
          label: t("claimStatus.pending"),
          bg: "#71A686",
          color: "white",
          leftIcon: undefined,
          isDisabled: true,
          hover: {
            bg: "#5C8B6F",
          },
        };
      case "Ditolak":
        return {
          label: t("claimStatus.rejected"),
          bg: "red.500",
          color: "white",
          leftIcon: undefined,
          isDisabled: false,
          hover: {
            bg: "red.400",
          },
        };
      case "":
      default:
        return {
          label: t("claimStatus.default"),
          bg: "white",
          color: "#347357",
          hover: {
            bg: "gray.200",
          },
          leftIcon: undefined,
          isDisabled: false,
        };
    }
  })();

  const handleClick = () => {
    if (isDisabled) return;
    if (!isVillageVerified) {
      toast.warning(
        t("toastVillageNotVerified"),
        {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } else {
      router.push(`/village/klaimInovasi?inovasiId=${id}`);
    }
  };

  return (
    <Box
      padding="0 12px"
      backgroundColor="#347357"
      position="fixed"
      top="0"
      maxW="360px"
      width="100%"
      height="56px"
      zIndex="999"
    >
      <Flex
        h="100%"
        justify="space-between"
        align="center"
      >
        {!!onBack && (
          <ArrowBackIcon
            color="white"
            fontSize="14pt"
            cursor="pointer"
            onClick={onBack}
            mt="2px"
          />
        )}
        <Text
          fontSize="15px"
          fontWeight="700"
          color="white"
          ml={onBack ? "8px" : "0"}
          flex={1}
          mr={1}
          noOfLines={1}
        >
          {title}
        </Text>

        <Flex align="center" gap={0}>
          {rightElement}

          {!isClaimButtonVisible &&
            isUserMenuVisible &&
            mounted &&
            (user || isAuthenticated ? (
              <UserMenu user={user} />
            ) : (
              <Flex align="center" gap={2}>
                <IconButton
                  aria-label="FAQ"
                  icon={<HelpCircle size={18} />}
                  variant="ghost"
                  color="white"
                  minW="auto"
                  _hover={{ bg: "transparent", opacity: 0.8 }}
                  onClick={() => router.push(paths.BANTUAN_FAQ_PAGE)}
                />

                <Box height="16px" width="1px" bg="white" opacity={0.3} />

                <Button
                  as={Link}
                  href={paths.LOGIN_PAGE}
                  bg="white"
                  color="#347357"
                  borderRadius="full"
                  px={3}
                  height="34px"
                  fontSize="12px"
                  fontWeight="600"
                  _hover={{ bg: "gray.100" }}
                >
                  {t("login")}
                </Button>
              </Flex>
            ))}
        </Flex>
      </Flex>
    </Box>
  );
}

export default TopBar;
