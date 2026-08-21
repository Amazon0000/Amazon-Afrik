export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  void withText;
  return (
    <div className="flex items-center select-none text-inherit">
      <svg
        viewBox="0 0 100 28"
        style={{ height: size, width: size * 3.4 }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Zando bold lowercase text */}
        <text
          x="2"
          y="18"
          fill="currentColor"
          fontSize="19"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          fontWeight="800"
          letterSpacing="-0.06em"
        >
          zando
        </text>
        {/* Small tag */}
        <text
          x="53"
          y="10"
          fill="#0e9f6e"
          fontSize="6.5"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          fontWeight="bold"
          letterSpacing="0.05em"
        >
          AFRIK
        </text>
        {/* Green underline (replaces Amazon-style orange smile) */}
        <path
          d="M 6,21 L 56,21"
          stroke="#0e9f6e"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
