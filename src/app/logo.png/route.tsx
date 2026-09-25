import { ImageResponse } from "next/og";

/** The unfold logo as a 512px PNG, for places that don't take SVG (e.g. TAIKAI project logos). */
export function GET() {
  return new ImageResponse(
    (
      <svg width="512" height="512" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="14" fill="#2f6b4f" />
        <path d="M20 15h18l11 11v19a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V19a4 4 0 0 1 4-4z" fill="#f5efe3" />
        <path d="M38 15v8a3 3 0 0 0 3 3h8z" fill="#d4c7ae" />
        <rect x="21" y="32" width="18" height="3" rx="1.5" fill="#2f6b4f" opacity="0.55" />
        <rect x="21" y="39" width="12" height="3" rx="1.5" fill="#2f6b4f" opacity="0.35" />
      </svg>
    ),
    { width: 512, height: 512 },
  );
}
