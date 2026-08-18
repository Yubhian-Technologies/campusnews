/**
 * "CAMPUS VISHNU" wordmark, recreated as an inline SVG so it inherits the
 * surrounding text color (works on light and dark). "CAMPUS" sits between two
 * fanned flourishes above a heavy "VISHNU". Swap for the official artwork by
 * dropping a file in /public and rendering it via next/image.
 */
export function CampusVishnuLogo({ className }: { className?: string }) {
  const font = {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  } as const;

  return (
    <svg
      viewBox="0 0 250 76"
      role="img"
      aria-label="Campus Vishnu"
      className={className}
    >
      {/* fanned flourishes flanking CAMPUS */}
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none">
        {/* left fan */}
        <path d="M78 20 Q 48 11, 20 11" />
        <path d="M78 24 Q 46 24, 16 25" />
        <path d="M78 28 Q 48 37, 22 39" />
        {/* right fan */}
        <path d="M172 20 Q 202 11, 230 11" />
        <path d="M172 24 Q 204 24, 234 25" />
        <path d="M172 28 Q 202 37, 228 39" />
      </g>

      <text
        x="125"
        y="30"
        textAnchor="middle"
        fill="currentColor"
        style={{ ...font, fontWeight: 700, fontSize: "19px", letterSpacing: "6px" }}
      >
        CAMPUS
      </text>
      <text
        x="127"
        y="69"
        textAnchor="middle"
        fill="currentColor"
        style={{ ...font, fontWeight: 800, fontSize: "42px", letterSpacing: "4px" }}
      >
        VISHNU
      </text>
    </svg>
  );
}
