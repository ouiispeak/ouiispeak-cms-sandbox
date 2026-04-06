import type { Metadata } from "next";
import "./globals.css";
import CmsShell from "@/components/CmsShell";

export const metadata: Metadata = {
  title: "CMS Barebones",
  description: "Factory-reset CMS shell"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CmsShell>{children}</CmsShell>
      </body>
    </html>
  );
}
