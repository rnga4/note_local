import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Pwa } from "@/components/Pwa";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notes",
  description: "note.local",
  applicationName: "note.local",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Notes" },
  icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#ffe600" };

const themeInit = `try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen antialiased">
        <Pwa />
        {children}
      </body>
    </html>
  );
}
