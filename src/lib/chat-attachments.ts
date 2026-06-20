import { API_BASE_URL, handleRefreshToken } from "@/lib/api";
import type { ChatAttachment } from "@/store/useChatStore";

export const CHAT_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const CHAT_IMAGE_MAX_FILES = 3;
export const CHAT_IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export type UploadChatImageOptions = {
  file: File;
  targetId: string;
  sessionId?: string | null;
  isCollection?: boolean;
  onProgress?: (progress: number) => void;
};

export type UploadChatImageResult = ChatAttachment & {
  attachment_id: string;
  session_id: string;
};

export function validateChatImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Chi ho tro PNG, JPEG hoac WebP.";
  }
  if (file.size <= 0) {
    return "Anh rong hoac khong hop le.";
  }
  if (file.size > CHAT_IMAGE_MAX_BYTES) {
    return "Anh phai nho hon 8MB.";
  }
  return null;
}

export async function uploadChatImage(options: UploadChatImageOptions): Promise<UploadChatImageResult> {
  const validationError = validateChatImage(options.file);
  if (validationError) {
    throw new Error(validationError);
  }

  return uploadChatImageOnce({ ...options, allowRefresh: true });
}

async function uploadChatImageOnce({
  file,
  targetId,
  sessionId,
  isCollection,
  onProgress,
  allowRefresh,
}: UploadChatImageOptions & { allowRefresh: boolean }): Promise<UploadChatImageResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(isCollection ? "collection_id" : "document_id", targetId);
  if (sessionId) {
    formData.append("session_id", sessionId);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/chat/attachments/image`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = async () => {
      const payload = parseChatImageResponse(xhr.responseText);
      if (xhr.status === 401 && allowRefresh) {
        try {
          await handleRefreshToken();
          resolve(uploadChatImageOnce({ file, targetId, sessionId, isCollection, onProgress, allowRefresh: false }));
        } catch (error) {
          reject(error);
        }
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300 || !payload?.data) {
        reject(new Error(payload?.message || "Khong the upload anh."));
        return;
      }

      resolve(payload.data);
    };

    xhr.onerror = () => reject(new Error("Mat ket noi khi upload anh."));
    xhr.onabort = () => reject(new Error("Upload anh da bi huy."));
    xhr.send(formData);
  });
}

function parseChatImageResponse(raw: string): { data?: UploadChatImageResult; message?: string } {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
