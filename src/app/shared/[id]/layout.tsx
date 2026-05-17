import type { Metadata } from "next";
import type { ReactNode } from "react";

import { fetchSharedLinkData } from "@/lib/shared-link";
import { absoluteUrl, trimText } from "@/lib/seo";

type SharedLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: SharedLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const sharedResult = await fetchSharedLinkData(id);

  const robots = {
    index: false as const,
    follow: false as const,
    googleBot: {
      index: false as const,
      follow: false as const,
      "max-snippet": -1 as const,
      "max-image-preview": "large" as const,
      "max-video-preview": -1 as const,
    },
  };

  if (sharedResult.status === "expired") {
    const title = "Link chia se da het han";
    const description =
      "Link chia se nay da het han hoac tai lieu goc khong con kha dung tren Mindex.";

    return {
      title,
      description,
      robots,
      openGraph: {
        title,
        description,
        type: "website",
        url: absoluteUrl(`/shared/${id}`),
        images: [
          {
            url: absoluteUrl(`/shared/${id}/opengraph-image`),
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [absoluteUrl(`/shared/${id}/opengraph-image`)],
      },
    };
  }

  if (sharedResult.status === "not_found") {
    const title = "Khong tim thay link chia se";
    const description = "Link chia se nay khong ton tai hoac da bi xoa.";

    return {
      title,
      description,
      robots,
      openGraph: {
        title,
        description,
        type: "website",
        url: absoluteUrl(`/shared/${id}`),
        images: [
          {
            url: absoluteUrl(`/shared/${id}/opengraph-image`),
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [absoluteUrl(`/shared/${id}/opengraph-image`)],
      },
    };
  }

  if (sharedResult.status !== "ok") {
    const title = "Khong the tai noi dung chia se";
    const description =
      "Mindex tam thoi khong the tai noi dung cua link chia se nay.";

    return {
      title,
      description,
      robots,
      openGraph: {
        title,
        description,
        type: "website",
        url: absoluteUrl(`/shared/${id}`),
        images: [
          {
            url: absoluteUrl(`/shared/${id}/opengraph-image`),
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [absoluteUrl(`/shared/${id}/opengraph-image`)],
      },
    };
  }

  const title = `${sharedResult.data.document.title} | Chia se`;
  const description = trimText(
    sharedResult.data.summary ||
      `Xem tai lieu va hoi thoai duoc ${sharedResult.data.creator.display_name || "nguoi dung Mindex"} chia se tren Mindex.`,
    160,
  );

  return {
    title,
    description,
    robots,
    openGraph: {
      title,
      description,
      type: "article",
      url: absoluteUrl(`/shared/${id}`),
      images: [
        {
          url: absoluteUrl(`/shared/${id}/opengraph-image`),
          width: 1200,
          height: 630,
          alt: sharedResult.data.document.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(`/shared/${id}/opengraph-image`)],
    },
  };
}

export default function SharedLayout({ children }: SharedLayoutProps) {
  return children;
}
