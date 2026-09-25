/** The unfold mark: a small text box opening out into a full card. Same drawing as public/logo.svg. */
export function LogoMark(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden {...props}>
      <rect width="64" height="64" rx="14" fill="#2f6b4f" />
      <rect x="21" y="13" width="22" height="6" rx="3" fill="#f5efe3" />
      <path d="M24 22h16l8 7H16z" fill="#d4c7ae" />
      <rect x="16" y="29" width="32" height="22" rx="3" fill="#f5efe3" />
      <rect x="21" y="35" width="16" height="3" rx="1.5" fill="#2f6b4f" opacity="0.55" />
      <rect x="21" y="41" width="10" height="3" rx="1.5" fill="#2f6b4f" opacity="0.35" />
    </svg>
  );
}
