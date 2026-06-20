"use client";

import { useCallback, useRef } from "react";
import { API_BASE_URL, handleRefreshToken } from "@/lib/api";

export type ExtractAnalysisType = "keywords" | "formulas" | "timeline" | "mindmap" | "compare";

interface ExtractStreamEvent {
  message?: string;
  step?: string;
  text?: string;
  data?: unknown;
}

interface RunExtractStreamOptions {
  type: ExtractAnalysisType;
  payload: Record<string, unknown>;
  onStatus?: (event: ExtractStreamEvent) => void;
  onInsight?: (event: ExtractStreamEvent) => void;
  onError?: (message: string) => void;
}

interface RunExtractStreamResult {
  streamed: boolean;
  data?: unknown;
}

function parseSSEEvent(part: string) {
  const lines = part.split("\n");
  let eventType = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      eventType = line.slice(7).trim();
    } else if (line.startsWith("data: ")) {
      dataLines.push(line.slice(6));
    }
  }

  return {
    eventType,
    data: dataLines.join("\n").trim(),
  };
}

export function useExtractAnalysisStream() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const openStream = useCallback(
    async (type: ExtractAnalysisType, payload: Record<string, unknown>, retryCount = 0): Promise<Response | null> => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const response = await fetch(`${API_BASE_URL}/extract/${type}/stream`, {
        method: "POST",
        signal: abortController.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.status === 401 && retryCount < 1) {
        await handleRefreshToken();
        return openStream(type, payload, retryCount + 1);
      }

      if (!response.ok || !response.body) {
        return null;
      }

      return response;
    },
    []
  );

  const runExtractStream = useCallback(
    async ({
      type,
      payload,
      onStatus,
      onInsight,
      onError,
    }: RunExtractStreamOptions): Promise<RunExtractStreamResult> => {
      let response: Response | null = null;

      try {
        response = await openStream(type, payload);
      } catch {
        return { streamed: false };
      }

      if (!response?.body) {
        return { streamed: false };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let resultData: unknown;
      let streamHadError = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const { eventType, data } = parseSSEEvent(part);
            if (!data) continue;

            let parsed: ExtractStreamEvent = {};
            try {
              parsed = JSON.parse(data);
            } catch {
              parsed = { text: data };
            }

            if (eventType === "status") {
              onStatus?.(parsed);
            } else if (eventType === "insight") {
              onInsight?.(parsed);
            } else if (eventType === "result") {
              resultData = parsed;
            } else if (eventType === "error") {
              streamHadError = true;
              onError?.(parsed.message || "Lỗi khi stream phân tích AI.");
            } else if (eventType === "done") {
              if (streamHadError) return { streamed: false };
              return { streamed: true, data: resultData };
            }
          }
        }
      } catch {
        return { streamed: false };
      }

      if (streamHadError) return { streamed: false };
      return resultData ? { streamed: true, data: resultData } : { streamed: false };
    },
    [openStream]
  );

  const abortExtractStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { runExtractStream, abortExtractStream };
}
