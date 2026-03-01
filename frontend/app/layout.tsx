import type { Metadata } from "next";
import { bricolage, jetBrainsMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intelligence Interface | Disaster Pulse",
  description: "Disaster Evolution & Response Pipeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${bricolage.variable} ${jetBrainsMono.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
