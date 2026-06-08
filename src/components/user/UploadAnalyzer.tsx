"use client";

import React from "react";

// ── Keyframe CSS ──────────────────────────────────────────────
const UA_CSS = `
@keyframes ua-scanH {
  0%   { left: -60%; }
  100% { left: 120%; }
}
@keyframes ua-scanV {
  0%   { top: -30%; }
  100% { top: 120%; }
}
@keyframes ua-shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}
@keyframes ua-dotPulse {
  0%, 100% { opacity: .3; transform: scale(.7); }
  50%       { opacity: 1;  transform: scale(1);  }
}
@keyframes ua-drawIn {
  from { stroke-dashoffset: 50; }
  to   { stroke-dashoffset: 0;  }
}
@keyframes ua-progFill {
  from { width: 0%; }
  to   { width: var(--tw, 60%); }
}
@keyframes ua-tickPop {
  0%   { transform: scale(0);   opacity: 0; }
  65%  { transform: scale(1.3);             }
  100% { transform: scale(1);   opacity: 1; }
}
@keyframes ua-fadeUp {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0);   }
}
`;

// ── Types ──────────────────────────────────────────────────────
export type DocState = "uploading" | "scanning" | "done" | "error";
export type ImgState = "queue" | "uploading" | "scanning" | "done" | "error";

export interface UploadAnalyzerProps {
  docName: string;
  docSize: string;
  docState: DocState;
  uploadProgress: number;
  sseProgress: number;
  sseMessage?: string;
  errorMessage?: string;
  imgStates: ImgState[];
  imgSrcs: Array<string | undefined>;
  summaryText: string;
  summaryPercent: number;
  summaryDone: boolean;
}

// ── Helpers ────────────────────────────────────────────────────
function BracketPath({ d, delay }: { d: string; delay: number }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d={d}
        stroke="#3b82f6"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="50"
        strokeDashoffset="50"
        style={{ animation: `ua-drawIn .45s ease ${delay}s forwards` }}
      />
    </svg>
  );
}

function CornerBrackets({ baseDelay = 0, offset = 5 }: { baseDelay?: number; offset?: number }) {
  const d = "M1 6L1 1L6 1";
  const base: React.CSSProperties = { position: "absolute", pointerEvents: "none", zIndex: 6, width: 10, height: 10 };
  return (
    <>
      <span style={{ ...base, top: offset, left: offset }}>
        <BracketPath d={d} delay={baseDelay} />
      </span>
      <span style={{ ...base, top: offset, right: offset, transform: "scaleX(-1)" }}>
        <BracketPath d={d} delay={baseDelay + 0.08} />
      </span>
      <span style={{ ...base, bottom: offset, left: offset, transform: "scaleY(-1)" }}>
        <BracketPath d={d} delay={baseDelay + 0.16} />
      </span>
      <span style={{ ...base, bottom: offset, right: offset, transform: "scale(-1,-1)" }}>
        <BracketPath d={d} delay={baseDelay + 0.24} />
      </span>
    </>
  );
}

function AnimDots() {
  return (
    <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[0, 0.18, 0.36].map((delay, i) => (
        <span
          key={i}
          style={{
            width: 4, height: 4, borderRadius: "50%",
            background: "#3b82f6", display: "inline-block",
            animation: `ua-dotPulse 1.1s ease ${delay}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function Tick() {
  return (
    <span style={{
      position: "absolute", top: 6, right: 6,
      width: 18, height: 18, borderRadius: "50%",
      background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 7, animation: "ua-tickPop .35s cubic-bezier(.34,1.56,.64,1) forwards",
    }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function StatusBadge({ label, variant }: { label: string; variant: "scan" | "done" | "error" | "queue" }) {
  const styles: Record<string, React.CSSProperties> = {
    scan:  { background: "#0a1628", color: "#60a5fa", border: "1px solid #1a3050" },
    done:  { background: "#0a1f14", color: "#34d399", border: "1px solid #0f3020" },
    error: { background: "#1f0a0a", color: "#f87171", border: "1px solid #3a1010" },
    queue: { background: "#0a0d14", color: "#1e2a3a", border: "1px solid #1a2030" },
  };
  return (
    <span style={{
      fontSize: 9, padding: "2px 7px", borderRadius: 20,
      fontFamily: "monospace", letterSpacing: ".03em", whiteSpace: "nowrap",
      ...styles[variant],
    }}>
      {label}
    </span>
  );
}

// ── DocumentCard ───────────────────────────────────────────────
function DocumentCard({ name, size, state, uploadProgress, sseProgress, sseMessage, errorMessage }: {
  name: string;
  size: string;
  state: DocState;
  uploadProgress: number;
  sseProgress: number;
  sseMessage?: string;
  errorMessage?: string;
}) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "pdf";
  const isActive = state === "uploading" || state === "scanning";
  const isDone = state === "done";
  const isError = state === "error";

  const progress = state === "uploading" ? Math.max(5, uploadProgress) : Math.max(10, sseProgress);

  const subText =
    state === "uploading" ? `${size} · Đang tải lên...`
    : state === "scanning" ? `${size} · ${sseMessage || "Đang OCR & phân tích..."}`
    : state === "done"     ? `${size} · Sẵn sàng`
    : errorMessage         ? errorMessage
    : "Lỗi xử lý tài liệu";

  return (
    <div style={{ background: "#13171f", border: "1px solid #1a2030", borderRadius: 14, overflow: "hidden", position: "relative" }}>
      {isActive && (
        <>
          <div style={{
            position: "absolute", inset: "0 auto 0 0", width: "50%",
            background: "linear-gradient(90deg, transparent, rgba(59,130,246,.05), rgba(96,165,250,.09), rgba(59,130,246,.05), transparent)",
            animation: "ua-scanH 2s ease-in-out infinite", pointerEvents: "none", zIndex: 1,
          }} />
          <div style={{
            position: "absolute", inset: 0, width: "40%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,.02), transparent)",
            animation: "ua-shimmer 2.4s ease infinite", pointerEvents: "none", zIndex: 1,
          }} />
        </>
      )}

      {isActive && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, height: 1.5,
          background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
          animation: "ua-progFill 3s ease-out forwards",
          "--tw": `${progress}%`,
          zIndex: 3,
        } as React.CSSProperties} />
      )}
      {isDone && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1.5, background: "linear-gradient(90deg, #10b981, #34d399)", zIndex: 3 }} />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, position: "relative", zIndex: 2 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0, position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: ext === "pdf" ? "#1a1020" : "#101a28",
          color: ext === "pdf" ? "#f87171" : "#60a5fa",
        }}>
          {isActive && <CornerBrackets offset={-9} />}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </div>
          <div style={{ fontSize: 11, marginTop: 3, color: isDone ? "#34d399" : isError ? "#f87171" : "#475569" }}>
            {subText}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {isActive && <><AnimDots /><StatusBadge label={state === "uploading" ? "UPLOAD" : "OCR"} variant="scan" /></>}
          {isDone && (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#34d399" strokeWidth="1.2" />
                <path d="M5 8l2 2 4-4" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <StatusBadge label="DONE" variant="done" />
            </>
          )}
          {isError && <StatusBadge label="ERROR" variant="error" />}
        </div>
      </div>
    </div>
  );
}

// ── ImageCard ──────────────────────────────────────────────────
const IMG_GRADIENTS = [
  "linear-gradient(135deg, #1a2236, #0f1520)",
  "linear-gradient(135deg, #1e1a24, #13101a)",
  "linear-gradient(135deg, #1a201a, #0f1510)",
  "linear-gradient(135deg, #201a1a, #150f0f)",
  "linear-gradient(135deg, #1a1a20, #101015)",
];

function ImageCard({ src, bgIndex, state, scanDelay }: {
  src?: string;
  bgIndex: number;
  state: ImgState;
  scanDelay: number;
}) {
  const isActive = state === "uploading" || state === "scanning";
  const isDone = state === "done";
  const isError = state === "error";
  const isQueue = state === "queue";
  const delayS = scanDelay / 1000;

  const dimBg = isDone ? "rgba(10,13,20,.15)" : isError ? "rgba(30,5,5,.5)" : isQueue ? "rgba(10,13,20,.72)" : "rgba(10,13,20,.45)";

  return (
    <div style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: "#13171f" }}>
      {src
        ? <img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ position: "absolute", inset: 0, background: IMG_GRADIENTS[bgIndex % 5] }} />
      }

      <div style={{ position: "absolute", inset: 0, background: dimBg, zIndex: 2, transition: "background .4s ease" }} />

      {isActive && (
        <>
          <div style={{
            position: "absolute", left: 0, right: 0, height: "35%",
            background: "linear-gradient(180deg, transparent, rgba(59,130,246,.07), rgba(96,165,250,.13), rgba(59,130,246,.07), transparent)",
            animation: `ua-scanV 1.7s ease-in-out ${delayS}s infinite`,
            pointerEvents: "none", zIndex: 4,
          }} />
          <div style={{
            position: "absolute", left: 0, right: 0, height: 1.5,
            background: "linear-gradient(90deg, transparent, rgba(96,165,250,.55), transparent)",
            animation: `ua-scanV 1.7s ease-in-out ${delayS}s infinite`,
            pointerEvents: "none", zIndex: 5,
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,.03) 50%, transparent 65%)",
            animation: `ua-shimmer 2s ease ${delayS}s infinite`,
            pointerEvents: "none", zIndex: 3,
          }} />
          <CornerBrackets baseDelay={delayS} offset={5} />
        </>
      )}

      {isActive && (
        <div style={{
          position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)",
          zIndex: 7, display: "flex", alignItems: "center", gap: 3,
          background: "rgba(5,8,15,.72)", border: "1px solid rgba(59,130,246,.2)",
          borderRadius: 20, padding: "2px 7px", whiteSpace: "nowrap",
          animation: "ua-fadeUp .3s ease forwards",
        }}>
          <AnimDots />
          <span style={{ fontSize: 9, color: "#60a5fa", fontFamily: "monospace", letterSpacing: ".03em" }}>
            {state === "uploading" ? "UPLOAD" : "OCR"}
          </span>
        </div>
      )}

      {isQueue && (
        <div style={{
          position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)",
          zIndex: 7, background: "rgba(5,8,15,.5)", border: "1px solid rgba(30,42,60,.6)",
          borderRadius: 20, padding: "2px 7px",
        }}>
          <span style={{ fontSize: 9, color: "#1e2a3a", fontFamily: "monospace" }}>QUEUE</span>
        </div>
      )}

      {isError && (
        <div style={{
          position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)",
          zIndex: 7, background: "rgba(30,5,5,.8)", border: "1px solid rgba(248,113,113,.25)",
          borderRadius: 20, padding: "2px 7px",
        }}>
          <span style={{ fontSize: 9, color: "#f87171", fontFamily: "monospace" }}>LỖI</span>
        </div>
      )}

      {isDone && <Tick />}

      {isActive && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#0a0d14", zIndex: 7 }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
            animation: `ua-progFill 3s ease-out ${delayS}s forwards`,
            "--tw": "90%",
          } as React.CSSProperties} />
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export function UploadAnalyzer({
  docName, docSize, docState,
  uploadProgress, sseProgress, sseMessage, errorMessage,
  imgStates, imgSrcs,
  summaryText, summaryPercent, summaryDone,
}: UploadAnalyzerProps) {
  const imageCount = imgStates.filter((s) => s !== "queue").length;

  return (
    <>
      <style>{UA_CSS}</style>
      <div style={{
        background: "#0f1117", borderRadius: 20, padding: 32,
        display: "flex", flexDirection: "column", gap: 24,
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        color: "#e2e8f0", width: "100%",
      }}>
        {/* Document */}
        <div>
          <div style={{ fontSize: 10, color: "#374151", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
            Tài liệu
          </div>
          <DocumentCard
            name={docName} size={docSize} state={docState}
            uploadProgress={uploadProgress} sseProgress={sseProgress}
            sseMessage={sseMessage} errorMessage={errorMessage}
          />
        </div>

        {/* Images */}
        {imageCount > 0 && (
          <div>
            <div style={{ fontSize: 10, color: "#374151", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
              Ảnh đính kèm · {imageCount}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {imgStates.map((state, i) => (
                <ImageCard key={i} src={imgSrcs[i]} bgIndex={i} state={state} scanDelay={i * 100} />
              ))}
            </div>
          </div>
        )}

        {/* Summary bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "#0a0d14", borderRadius: 12 }}>
          <span style={{ fontSize: 12, color: summaryDone ? "#34d399" : "#6b7280", whiteSpace: "nowrap" }}>
            {summaryText}
          </span>
          <div style={{ flex: 1, height: 2, background: "#13171f", borderRadius: 1, overflow: "hidden" }}>
            {summaryDone ? (
              <div style={{ height: "100%", background: "linear-gradient(90deg, #10b981, #34d399)", width: "100%" }} />
            ) : (
              <div style={{
                height: "100%", background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                animation: "ua-progFill 3.5s ease-out forwards",
                "--tw": `${summaryPercent}%`,
              } as React.CSSProperties} />
            )}
          </div>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: summaryDone ? "#34d399" : "#3b82f6", whiteSpace: "nowrap" }}>
            {summaryDone ? "100%" : `${summaryPercent}%`}
          </span>
        </div>
      </div>
    </>
  );
}
