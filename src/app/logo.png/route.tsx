import { ImageResponse } from "next/og";

/** The unfold logo as a 512px PNG, for places that don't take SVG (e.g. project listings). */
export function GET() {
  return new ImageResponse(
    (
      <svg width="512" height="512" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="14" fill="#2f6b4f" />
        <rect x="21" y="13" width="22" height="6" rx="3" fill="#f5efe3" />
        <path d="M24 22h16l8 7H16z" fill="#d4c7ae" />
        <rect x="16" y="29" width="32" height="22" rx="3" fill="#f5efe3" />
        <rect x="21" y="35" width="16" height="3" rx="1.5" fill="#2f6b4f" opacity="0.55" />
        <rect x="21" y="41" width="10" height="3" rx="1.5" fill="#2f6b4f" opacity="0.35" />
      </svg>
    ),
    { width: 512, height: 512 },
  );
}
