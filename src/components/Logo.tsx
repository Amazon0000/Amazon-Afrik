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
        <text
          x="2"
          y="20"
          fill="currentColor"
          fontSize="20"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          fontWeight="800"
          letterSpacing="-0.04em"
        >
          Zando
        </text>
      </svg>
    </div>
  );
}
