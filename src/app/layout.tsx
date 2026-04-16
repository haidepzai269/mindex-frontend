import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Mindex - AI Document Assistant for Students",
    template: "%s | Mindex",
  },
  description:
    "Mindex là trợ lý tài liệu AI thông minh giúp sinh viên quản lý, tra cứu và tổng hợp kiến thức từ tài liệu học tập một cách hiệu quả.",
  keywords: [
    "Mindex",
    "AI Assistant",
    "Student Tools",
    "Document Analysis",
    "Học tập thông minh",
    "Trợ lý ảo sinh viên",
  ],
  authors: [{ name: "Mindex Team" }],
  creator: "Mindex Team",
  publisher: "Mindex",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://mindex.io.vn"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.png?v=1",
    apple: "/logo.png?v=1",
  },
  openGraph: {
    title: "Mindex - AI Document Assistant for Students",
    description:
      "Trợ lý AI giúp tối ưu hóa việc học tập và quản lý tài liệu cho sinh viên.",
    url: "https://mindex.io.vn",
    siteName: "Mindex",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Mindex Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mindex - AI Document Assistant for Students",
    description:
      "Trợ lý AI giúp tối ưu hóa việc học tập và quản lý tài liệu cho sinh viên.",
    creator: "@mindex",
    images: ["/logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mindex",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "pWim0WIvbXwCFonVj6J6jcmNpsotnsmUx52jD56aty4", // Thay mã này bằng mã từ Google Search Console
  },
};

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          jetbrainsMono.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
