export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  void withText; // Not strictly needed, we pack the perfect logo in one vector
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
        {/* Prime-style small tag */}
        <text
          x="53"
          y="10"
          fill="#ff9900"
          fontSize="6.5"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          fontWeight="bold"
          letterSpacing="0.05em"
        >
          AFRIK
        </text>
        {/* Amazon-style smile curving under the letters */}
        <path
          d="M 6,21 C 22,26.5 43,26.5 56,21.2"
          stroke="#ff9900"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Arrowhead */}
        <path
          d="M 52.5,22.2 C 54,21.7 55.5,21.2 56,21.2 C 55,19.7 54,18.2 54,18.2"
          stroke="#ff9900"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
