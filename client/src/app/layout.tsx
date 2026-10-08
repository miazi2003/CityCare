import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/features/auth/auth-provider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "City Care",
  description: "Municipal Complaint & Service Management Platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geist.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
