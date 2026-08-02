import { useState } from 'react';

export function Logo({ size = 36, withText = true }: { size?: number; withText?: boolean }) {
  const [useSvg, setUseSvg] = useState(false);
  const src = useSvg
    ? '/zando-mark.svg'
    : '/images/Gemini_Generated_Image_v4c5hrv4c5hrv4c5.png';

  return (
    <div className="flex items-center gap-2 select-none">
      <img
        src={src}
        alt="Zando"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-lg object-cover"
        onError={() => setUseSvg(true)}
      />
      {withText && (
        <span
          className="font-display font-bold tracking-tight text-[#0f172a]"
          style={{ fontSize: size * 0.55 }}
        >
          Zando
        </span>
      )}
    </div>
  );
}
