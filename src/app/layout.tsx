import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader, Plus_Jakarta_Sans } from "next/font/google";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { ClientLayout } from "@/components/client-layout";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const display = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} | ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "ANATOMIQ is a public AI-powered learning and exam generation platform for all University of Uyo students. Study any course, generate topic-grounded exams, and track your progress.",
  icons: {
    icon: "/anatomiQ.png",
    shortcut: "/anatomiQ.png",
    apple: "/anatomiQ.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
