import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CyberSense - Social Engineering Training Platform",
  description:
    "Strengthen your defenses against phishing, vishing, and pretexting attacks through interactive simulations and gamified learning.",
  keywords: [
    "cybersecurity",
    "social engineering",
    "phishing",
    "training",
    "security awareness",
  ],
  openGraph: {
    title: "CyberSense - Social Engineering Training Platform",
    description:
      "Strengthen your defenses against cyber threats through interactive simulations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
