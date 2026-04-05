"use client";

import { Center, Spinner } from "@chakra-ui/react";
import { paths } from "Consts/path";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useUser } from "src/contexts/UserContext";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { role, loading } = useUser();
  const normalizedRole = (role || "").toLowerCase();
  const isAuthorized = normalizedRole === "admin";
  const postLogoutRedirectKey = "postLogoutRedirect";

  useEffect(() => {
    if (!loading && !isAuthorized) {
      localStorage.removeItem("token");
      localStorage.setItem("userRole", normalizedRole);
      window.dispatchEvent(new Event("auth:tokenChanged"));

      const postLogoutRedirect = sessionStorage.getItem(postLogoutRedirectKey);
      if (postLogoutRedirect === "landing") {
        sessionStorage.removeItem(postLogoutRedirectKey);
        router.replace(paths.LANDING_PAGE);
        return;
      }

      router.replace(paths.LOGIN_PAGE);
    }
  }, [isAuthorized, loading, normalizedRole, postLogoutRedirectKey, router]);

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  if (!isAuthorized) {
    return (
      <Center minH="100vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  return <>{children}</>;
}