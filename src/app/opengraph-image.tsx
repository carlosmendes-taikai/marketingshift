import { ImageResponse } from "next/og";

export const alt = "unfold: a text box morphing into a lead card as you type";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** A static shot of the shell mid-morph: the input above, the lead card growing below it. */
export default function OpengraphImage() {
  const ink = "#1e1a14";
  const muted = "#6b6252";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f5efe3", gap: 36 }}>
        <div
          style={{
            width: 760,
            display: "flex",
            flexDirection: "column",
            background: "#fffcf6",
            border: "2px solid #e6dcc9",
            borderRadius: 48,
            boxShadow: "0 30px 70px -20px rgba(60,45,20,0.18)",
            padding: "34px 40px",
            gap: 26,
          }}
        >
          <div style={{ fontSize: 38, color: ink, letterSpacing: -0.5, display: "flex" }}>
            met ana from sonae, interested in ai workshop<span style={{ color: "#2f6b4f" }}>|</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "#efe7d7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: 999, border: `4px solid ${ink}` }} />
            </div>
            <div style={{ fontSize: 26, color: muted, display: "flex" }}>Lead</div>
            <div style={{ marginLeft: "auto", fontSize: 22, color: muted, border: "2px solid #e6dcc9", borderRadius: 999, padding: "6px 16px", display: "flex" }}>Follow up Wednesday</div>
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: ink, display: "flex" }}>Ana</div>
          <div style={{ display: "flex", gap: 14 }}>
            {["Sonae", "AI workshop"].map((c) => (
              <div key={c} style={{ fontSize: 24, color: "#504838", background: "#efe7d7", borderRadius: 999, padding: "8px 20px", display: "flex" }}>
                {c}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 30, color: muted, display: "flex" }}>unfold: type it, get the right card</div>
      </div>
    ),
    size,
  );
}
