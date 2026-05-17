import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  SITE_LOCALE,
  SITE_NAME,
  TWITTER_HANDLE,
  absoluteUrl,
  defaultOgImage,
} from "@/lib/seo";

const communityTitle = "Thu vien cong dong cho sinh vien";
const communityDescription =
  "Kham pha tai lieu hoc tap cong khai, ghi chu duoc chia se va kho tri thuc cong dong tren Mindex.";

export const metadata: Metadata = {
  title: communityTitle,
  description: communityDescription,
  alternates: {
    canonical: "/community",
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
    title: `${communityTitle} | ${SITE_NAME}`,
    description: communityDescription,
    url: absoluteUrl("/community"),
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: "website",
    images: defaultOgImage("Thu vien cong dong Mindex"),
  },
  twitter: {
    card: "summary_large_image",
    title: `${communityTitle} | ${SITE_NAME}`,
    description: communityDescription,
    creator: TWITTER_HANDLE,
    images: [absoluteUrl("/twitter-image")],
  },
};

export default function CommunityLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
