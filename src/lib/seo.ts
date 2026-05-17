import type { Metadata } from "next";

export const SITE_NAME = "Mindex";
export const SITE_URL = "https://mindex.io.vn";
export const SITE_ORIGIN = new URL(SITE_URL);
export const SITE_LOCALE = "vi_VN";
export const TWITTER_HANDLE = "@mindex";
export const DEFAULT_OG_IMAGE = "/opengraph-image";
export const DEFAULT_TWITTER_IMAGE = "/twitter-image";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export function absoluteUrl(path: string = "/") {
  return new URL(path, SITE_ORIGIN).toString();
}

export function defaultOgImage(alt: string) {
  return [
    {
      url: absoluteUrl(DEFAULT_OG_IMAGE),
      width: 1200,
      height: 630,
      alt,
    },
  ];
}

export function noIndexMetadata(
  overrides: Partial<Metadata> = {},
): Metadata {
  return {
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    ...overrides,
  };
}

export function trimText(value: string | null | undefined, maxLength: number) {
  if (!value) return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}
