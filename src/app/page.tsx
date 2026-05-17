import type { Metadata } from "next";

import HomePageClient from "./HomePageClient";
import {
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  TWITTER_HANDLE,
  absoluteUrl,
  defaultOgImage,
} from "@/lib/seo";

const homeTitle = `${SITE_NAME} - AI Study OS cho sinh vien`;
const homeDescription =
  "Mindex giup sinh vien bien tai lieu hoc tap thanh he sinh thai tri thuc voi RAG chat co trich dan, tom tat, quiz, flashcard, mindmap, audio overview va thu vien cong dong.";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: "website",
    images: defaultOgImage("Mindex - AI Study OS cho sinh vien"),
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    creator: TWITTER_HANDLE,
    images: [absoluteUrl("/twitter-image")],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "vi-VN",
      description: homeDescription,
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      inLanguage: "vi-VN",
      url: SITE_URL,
      description: homeDescription,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "VND",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageClient />
    </>
  );
}
