import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import Navbar from "~/components/navbar";

export const metadata: Metadata = {
  title: "Auto Trivia",
  description: "Generated by create-t3-app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <div className="flex min-h-screen flex-col space-y-6 overflow-hidden">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
