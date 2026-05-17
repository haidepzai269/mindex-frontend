import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(135deg, #09090b 0%, #18181b 55%, #27272a 100%)",
          color: "#fafafa",
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
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "32px",
            padding: "44px",
            backgroundColor: "rgba(255,255,255,0.03)",
            backgroundImage:
              "radial-gradient(circle at top right, rgba(124,58,237,0.24), transparent 35%)",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
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
                  height: "68px",
                  width: "68px",
                  borderRadius: "20px",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, rgba(124,58,237,0.9), rgba(16,185,129,0.8))",
                  fontSize: "30px",
                  fontWeight: 700,
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
                <div
                  style={{
                    fontSize: "40px",
                    fontWeight: 800,
                    letterSpacing: 0,
                  }}
                >
                  Mindex
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    color: "rgba(250,250,250,0.68)",
                  }}
                >
                  AI Study OS cho sinh vien
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.16)",
                padding: "10px 18px",
                fontSize: "20px",
                color: "rgba(250,250,250,0.74)",
              }}
            >
              mindex.io.vn
            </div>
          </div>

          <div
            style={{
              display: "flex",
              maxWidth: "880px",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#a78bfa",
              }}
            >
              Document intelligence cho hoc tap thuc chien
            </div>
            <div
              style={{
                fontSize: "62px",
                lineHeight: 1.08,
                fontWeight: 900,
                letterSpacing: 0,
              }}
            >
              Chat RAG, tom tat, quiz, flashcard, mindmap va thu vien cong
              dong trong mot he thong.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "18px",
            }}
          >
            {["RAG co trich dan", "Study Hub", "Community library"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    padding: "12px 20px",
                    fontSize: "22px",
                    color: "rgba(250,250,250,0.82)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  {label}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
