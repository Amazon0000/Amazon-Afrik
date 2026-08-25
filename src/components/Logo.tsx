export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none text-inherit">
      <img
        src="/brand/zando-cart-icon.png"
        alt="Zando"
        style={{ height: size, width: size }}
        className="shrink-0 object-contain"
      />
      {withText && (
        <span
          style={{ fontSize: size * 0.62 }}
          className="font-display font-extrabold tracking-tight leading-none"
        >
          Zando
        </span>
      )}
    </div>
  );
}
