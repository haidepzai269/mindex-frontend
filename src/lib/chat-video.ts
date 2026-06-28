import { API_BASE_URL, fetchApi, handleRefreshToken } from "@/lib/api";

export const CHAT_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const CHAT_VIDEO_MAX_FILES = 3;
export const CHAT_VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime";

const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export type UploadChatVideoOptions = {
  file: File;
  sessionId: string;
  onProgress?: (progress: number) => void;
};

export type UploadChatVideoResult = {
  attachment_id: string;
  session_id: string;
  status: string;
  cached?: boolean;
  has_audio?: boolean;
  frame_count?: number;
  original_name: string;
  mime_type?: string;
  size_bytes?: number;
  duration_seconds: number;
  storage_url?: string;
};

export type VideoStatusResult = {
  attachment_id: string;
  status: "processing" | "done" | "error";
  has_audio?: boolean;
  frame_count?: number;
  context_preview?: string;
  error_message?: string;
};

export type VideoQuotaResult = {
  tier: string;
  limit: number;
  used: number;
  remaining: number;
  reset_at: string;
};

export async function fetchVideoQuota(): Promise<VideoQuotaResult> {
  const res = await fetchApi<{ success: boolean } & VideoQuotaResult>(
    "/chat/attachments/video/quota",
  );
  return res;
}

export async function ensureSessionForVideoUpload(): Promise<string> {
  const res = await fetchApi<{ success: boolean; data: { session_id: string } }>(
    "/chat/ai/sessions",
    { method: "POST" },
  );
  if (!res.success || !res.data?.session_id) {
    throw new Error("Khong the tao phien chat moi.");
  }
  return res.data.session_id;
}

export function validateChatVideo(file: File): string | null {
  if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
    return "Chi ho tro dinh dang MP4, WebM, MOV.";
  }
  if (file.size <= 0) {
    return "Video rong hoac khong hop le.";
  }
  if (file.size > CHAT_VIDEO_MAX_BYTES) {
    return "Video toi da 50MB.";
  }
  return null;
}

export async function uploadChatVideo(options: UploadChatVideoOptions): Promise<UploadChatVideoResult> {
  const validationError = validateChatVideo(options.file);
  if (validationError) {
    throw new Error(validationError);
  }
  return uploadChatVideoOnce({ ...options, allowRefresh: true });
}

async function uploadChatVideoOnce({
  file,
  sessionId,
  onProgress,
  allowRefresh,
}: UploadChatVideoOptions & { allowRefresh: boolean }): Promise<UploadChatVideoResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/chat/attachments/video`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = async () => {
      const payload = parseVideoResponse(xhr.responseText);
      if (xhr.status === 401 && allowRefresh) {
        try {
          await handleRefreshToken();
          resolve(uploadChatVideoOnce({ file, sessionId, onProgress, allowRefresh: false }));
        } catch (error) {
          reject(error);
        }
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300 || !payload?.success) {
        reject(new Error((payload?.message as string) || "Khong the upload video."));
        return;
      }

      resolve(payload as UploadChatVideoResult);
    };

    xhr.onerror = () => reject(new Error("Mat ket noi khi upload video."));
    xhr.onabort = () => reject(new Error("Upload video da bi huy."));
    xhr.send(formData);
  });
}

export async function pollVideoStatus(
  attachmentId: string,
  onStatus?: (status: VideoStatusResult) => void,
  signal?: AbortSignal,
): Promise<VideoStatusResult> {
  const pollInterval = 3000;
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new Error("Polling cancelled");
    }

    const response = await fetch(
      `${API_BASE_URL}/chat/attachments/video/${attachmentId}/status`,
      { credentials: "include", headers: { "X-Requested-With": "XMLHttpRequest" } },
    );

    if (response.status === 401) {
      await handleRefreshToken();
      continue;
    }

    if (!response.ok) {
      throw new Error("Khong the kiem tra trang thai video.");
    }

    const data: VideoStatusResult & { success?: boolean } = await response.json();

    if (data.status === "done" || data.status === "error") {
      onStatus?.(data);
      return data;
    }

    onStatus?.(data);
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Video processing timeout.");
}

function parseVideoResponse(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
