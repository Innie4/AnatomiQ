import type { Metadata } from "next";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { ClientLayout } from "@/components/client-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} | ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "AcademIQ is a public AI-powered learning and exam generation platform for all University of Uyo students. Study any course, generate topic-grounded exams, and track your progress.",
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
      className="h-full antialiased"
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
