import { ImageResponse } from "next/og";

import { fetchSharedLinkData } from "@/lib/shared-link";
import { trimText } from "@/lib/seo";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function SharedOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sharedResult = await fetchSharedLinkData(id);

  const title =
    sharedResult.status === "ok"
      ? sharedResult.data.document.title
      : sharedResult.status === "expired"
        ? "Link chia se da het han"
        : "Khong the tai link chia se";

  const subtitle =
    sharedResult.status === "ok"
      ? trimText(
          sharedResult.data.summary ||
            `Duoc chia se boi ${sharedResult.data.creator.display_name || "nguoi dung Mindex"}`,
          180,
        )
      : "Mindex share preview";

  const statusLabel =
    sharedResult.status === "ok"
      ? "Shared session"
      : sharedResult.status === "expired"
        ? "Expired link"
        : "Unavailable";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(135deg, #050816 0%, #111827 48%, #1f2937 100%)",
          color: "#f8fafc",
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: "32px",
            border: "1px solid rgba(255,255,255,0.14)",
            padding: "44px",
            backgroundColor: "rgba(255,255,255,0.04)",
            backgroundImage:
              "radial-gradient(circle at top right, rgba(124,58,237,0.26), transparent 36%)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  height: "60px",
                  width: "60px",
                  borderRadius: "18px",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, rgba(124,58,237,0.92), rgba(59,130,246,0.78))",
                  fontSize: "28px",
                  fontWeight: 800,
                }}
              >
                M
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ fontSize: "34px", fontWeight: 800 }}>Mindex</div>
                <div
                  style={{
                    fontSize: "22px",
                    color: "rgba(248,250,252,0.68)",
                  }}
                >
                  {statusLabel}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.16)",
                padding: "10px 18px",
                fontSize: "20px",
                color: "rgba(248,250,252,0.76)",
              }}
            >
              /shared/{id}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              maxWidth: "960px",
            }}
          >
            <div
              style={{
                fontSize: "56px",
                lineHeight: 1.1,
                fontWeight: 900,
                letterSpacing: 0,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: "28px",
                lineHeight: 1.45,
                color: "rgba(248,250,252,0.78)",
              }}
            >
              {subtitle}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
            }}
          >
            {["Share preview", "Noindex", "Mindex"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  padding: "12px 18px",
                  fontSize: "22px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
