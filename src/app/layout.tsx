import type { Metadata } from "next";
import { Lora, Public_Sans } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Aegos Intel",
  description: "Company Intelligence Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${lora.variable} ${publicSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
