import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/Providers";

const nbInternational = localFont({
  src: "../components/assets/fonts/NB International Regular.otf",
  variable: "--font-nb-international",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrafficWatch - Violation Reporting System",
  description:
    "Report and manage traffic violations with role-based access control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nbInternational.variable} font-sans antialiased bg-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
