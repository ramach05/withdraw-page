import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Withdraw",
  description: "Страница вывода средств",
};

/** Корневой layout. */
const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="ru" className={inter.variable}>
    <body className={inter.className}>{children}</body>
  </html>
);

export default React.memo(RootLayout);
