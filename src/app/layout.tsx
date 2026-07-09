import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "Components/navbar";
import ChatBox from "Components/chat/ChatBot";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "KMS Desa Digital Indonesia - Solusi Inovasi Desa",
    template: "%s | Desa Digital Indonesia"
  },
  description: "Knowledge Management System (KMS) Desa Digital Indonesia. Platform berbagi inovasi, potensi, dan teknologi untuk memajukan desa-desa di seluruh Nusantara.",
  keywords: ["KMS Desa Digital", "Desa Digital Indonesia", "Inovasi Desa", "Smart Village", "Sistem Informasi Desa"],
  authors: [{ name: "KMS Desa Digital Team" }],
  openGraph: {
    title: "KMS Desa Digital Indonesia",
    description: "Platform berbagi inovasi dan teknologi untuk memajukan desa di Nusantara.",
    url: "https://desa-digital-indonesia.vercel.app",
    siteName: "Desa Digital Indonesia",
    locale: "id_ID",
    type: "website",
  },
  icons: {
    icon: "/icons/smart-agri.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.variable} suppressHydrationWarning={true}>
        <Providers>
          <main suppressHydrationWarning={true}>
            {children}
          </main>
          <Navbar />
          <ChatBox />
        </Providers>
      </body>
    </html>
  );
}
