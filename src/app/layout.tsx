import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  SITE_LOCALE,
  SITE_NAME,
  SITE_ORIGIN,
  TWITTER_HANDLE,
  absoluteUrl,
  defaultOgImage,
} from "@/lib/seo";
import NextTopLoader from "nextjs-toploader";

import "./globals.css";
import "katex/dist/katex.min.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: "%s | Mindex",
  },
  description:
    "Mindex la tro ly tai lieu AI giup sinh vien quan ly, tra cuu va tong hop kien thuc tu tai lieu hoc tap mot cach hieu qua.",
  keywords: [
    "Mindex",
    "AI Assistant",
    "Student Tools",
    "Document Analysis",
    "hoc tap thong minh",
    "tro ly hoc tap",
  ],
  authors: [{ name: "Mindex Team" }],
  creator: "Mindex Team",
  publisher: "Mindex",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: SITE_ORIGIN,
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: SITE_NAME,
    description:
      "Tro ly AI giup toi uu hoa viec hoc tap va quan ly tai lieu cho sinh vien.",
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: "website",
    images: defaultOgImage("Mindex"),
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description:
      "Tro ly AI giup toi uu hoa viec hoc tap va quan ly tai lieu cho sinh vien.",
    creator: TWITTER_HANDLE,
    images: [absoluteUrl("/twitter-image")],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
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
    google: "pWim0WIvbXwCFonVj6J6jcmNpsotnsmUx52jD56aty4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          jetbrainsMono.variable,
        )}
      >
        <NextTopLoader
          color="#7C3AED"
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #7C3AED, 0 0 5px #7C3AED"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
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
