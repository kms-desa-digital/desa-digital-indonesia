"use client";

import { Center, Spinner } from "@chakra-ui/react";
import { paths } from "Consts/path";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useUser } from "src/contexts/UserContext";

import Forbidden from "src/components/Forbidden";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { role, loading, uid } = useUser();
  const normalizedRole = (role || "").toLowerCase();
  const isAuthorized = normalizedRole === "admin";

  const postLogoutRedirectKey = "postLogoutRedirect";

  useEffect(() => {
    const shouldRedirect = sessionStorage.getItem(postLogoutRedirectKey);
    if (shouldRedirect) {
      sessionStorage.removeItem(postLogoutRedirectKey);
      router.replace(paths.LANDING_PAGE);
    }
  }, [router]);

  useEffect(() => {
    // Only redirect to login if NOT logged in at all (no role and no uid)
    if (!loading && !role && !uid) {
      router.replace(paths.LOGIN_PAGE);
    }
  }, [role, uid, loading, router]);

  if (loading) {
    return (
      <Center minH="100vh" bg="#f3f9f6">
        <Spinner size="lg" color="green.500" />
      </Center>
    );
  }

  // If logged in but not admin, show Forbidden
  if (!isAuthorized) {
    return <Forbidden />;
  }

  return <>{children}</>;
}