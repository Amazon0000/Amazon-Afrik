export function Logo({ size = 32, withText = true, variant = 'dark' }: { size?: number; withText?: boolean; variant?: 'dark' | 'light' }) {
  // variant="dark": black cart icon — use on light backgrounds.
  // variant="light": white cart icon — use on dark backgrounds (header, dark footers),
  // so the icon is never invisible (never black-on-black / dark-on-dark).
  const src = variant === 'light' ? '/brand/zando-cart-icon-white.png' : '/brand/zando-cart-icon.png';
  return (
    <div className="flex items-center gap-2 select-none text-inherit">
      <img
        src={src}
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
