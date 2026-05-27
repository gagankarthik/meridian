import { ImageResponse } from "next/og";

export const alt = "Meridian — The operating system for ambitious teams";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #ffffff 0%, #eef2fb 55%, #f7f8fa 100%)",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "#16171d",
              color: "#ffffff",
              fontSize: "38px",
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 800,
              letterSpacing: "0.18em",
              color: "#16171d",
            }}
          >
            MERIDIAN
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: "76px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
              color: "#16171d",
              maxWidth: "950px",
            }}
          >
            The operating system for ambitious teams.
          </div>
          <div style={{ fontSize: "30px", color: "#565b66", fontWeight: 500 }}>
            Boards, timelines, and dashboards — plan, execute, and report on one
            map.
          </div>
        </div>

        {/* footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "24px",
              fontWeight: 600,
              color: "#2563eb",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "999px",
                background: "#2563eb",
              }}
            />
            meridian.work
          </div>
          <div style={{ fontSize: "22px", color: "#8b909c" }}>
            Plan · Execute · Report
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
