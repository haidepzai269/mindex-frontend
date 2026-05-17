import { API_BASE_URL } from "@/lib/seo";

export interface SharedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SharedLinkData {
  link_id: string;
  document_id: string;
  session_id: string;
  document: {
    id: string;
    title: string;
    status: string;
  };
  creator: {
    display_name: string;
  };
  settings: {
    show_history: boolean;
    allow_fork: boolean;
  };
  summary: string | null;
  messages: SharedMessage[];
  created_at: string;
  expired_at: string | null;
}

export type SharedLinkFetchResult =
  | { status: "ok"; data: SharedLinkData }
  | { status: "not_found" }
  | { status: "expired" }
  | { status: "error" };

export async function fetchSharedLinkData(
  linkId: string,
): Promise<SharedLinkFetchResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/public/shared/${linkId}`, {
      cache: "no-store",
    });

    if (response.status === 404) return { status: "not_found" };
    if (response.status === 410) return { status: "expired" };
    if (!response.ok) return { status: "error" };

    const payload = await response.json();

    if (!payload?.success || !payload.data) {
      return { status: "error" };
    }

    return {
      status: "ok",
      data: payload.data as SharedLinkData,
    };
  } catch {
    return { status: "error" };
  }
}
