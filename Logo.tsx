export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  void withText;
  return (
    <div className="flex items-center select-none text-inherit">
      <svg
        viewBox="0 0 105 30"
        style={{ height: size, width: size * 3.5 }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Shopping cart mark — uses currentColor so it always contrasts with
            whatever background it sits on (navy header, white footer, etc.) */}
        <path
          d="M1 3 H4 L6.3 14.6 a1.6 1.6 0 0 0 1.6 1.28 h8.6 a1.6 1.6 0 0 0 1.58 -1.3 L19.8 7.2 H5.4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8.2" cy="19.8" r="1.4" fill="currentColor" />
        <circle cx="17" cy="19.8" r="1.4" fill="currentColor" />

        {/* Zando wordmark */}
        <text
          x="25"
          y="21"
          fill="currentColor"
          fontSize="18"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          fontWeight="800"
          letterSpacing="-0.04em"
        >
          Zando
        </text>
        {/* Small tag */}
        <text
          x="76"
          y="11"
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
          d="M 25,24 L 98,24"
          stroke="#0e9f6e"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
