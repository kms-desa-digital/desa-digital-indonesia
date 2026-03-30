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
  title: "Desa Digital Indonesia",
  description: "KMS Desa Digital",
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
