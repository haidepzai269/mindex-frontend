import Cookies from "js-cookie";
import { API_BASE_URL, handleRefreshToken } from "@/lib/api";

export const DOCUMENT_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;
export const DOCUMENT_UPLOAD_ACCEPT = ".pdf,.docx";

export type UploadDocumentResult = {
  success: boolean;
  data: {
    document_id: string;
    status: string;
    is_duplicate: boolean;
    message?: string;
  };
  message?: string;
};

type UploadDocumentOptions = {
  file: File;
  roomId?: string;
  onProgress?: (progress: number) => void;
};

export function validateDocumentFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
    return "Chỉ hỗ trợ file PDF hoặc DOCX.";
  }
  if (file.size > DOCUMENT_UPLOAD_MAX_BYTES) {
    return "File vượt quá giới hạn 50MB.";
  }
  if (file.size <= 0) {
    return "File rỗng hoặc không hợp lệ.";
  }
  return null;
}

export async function uploadDocument({
  file,
  roomId,
  onProgress,
}: UploadDocumentOptions): Promise<UploadDocumentResult> {
  const validationError = validateDocumentFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  return uploadDocumentOnce({ file, roomId, onProgress, allowRefresh: true });
}

async function uploadDocumentOnce({
  file,
  roomId,
  onProgress,
  allowRefresh,
}: UploadDocumentOptions & { allowRefresh: boolean }): Promise<UploadDocumentResult> {
  const token = Cookies.get("access_token");
  const formData = new FormData();
  formData.append("file", file);
  if (roomId) {
    formData.append("room_id", roomId);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/processing/upload`);
    xhr.withCredentials = true;
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = async () => {
      const payload = parseUploadResponse(xhr.responseText);
      if (xhr.status === 401 && allowRefresh) {
        try {
          await handleRefreshToken();
          resolve(uploadDocumentOnce({ file, roomId, onProgress, allowRefresh: false }));
        } catch (error) {
          reject(error);
        }
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(payload?.message || "Không thể upload tài liệu."));
        return;
      }

      resolve(payload as UploadDocumentResult);
    };

    xhr.onerror = () => reject(new Error("Mất kết nối khi upload tài liệu."));
    xhr.onabort = () => reject(new Error("Upload đã bị hủy."));
    xhr.send(formData);
  });
}

function parseUploadResponse(raw: string): Partial<UploadDocumentResult> & { message?: string } {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
