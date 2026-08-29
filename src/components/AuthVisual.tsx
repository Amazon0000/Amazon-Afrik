import { useState } from 'react';

// Original SVG illustration (shopping bags, boxes, price tag) in the
// brand palette — used as the AuthPage's visual side panel. No external
// stock photography: avoids copyright/hotlink-reliability risk entirely
// while still delivering a real "shopping" visual, not a placeholder.
//
// Real video (Pexels License — free for commercial use, no attribution
// required): https://www.pexels.com/license/.
const AUTH_VISUAL_VIDEO_URL = 'https://videos.pexels.com/video-files/8937981/8937981-hd_1920_1080_30fps.mp4';

export function AuthVisual() {
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = !!AUTH_VISUAL_VIDEO_URL && !videoFailed;

  if (showVideo) {
    return (
      <video
        className="w-full h-full object-cover"
        src={AUTH_VISUAL_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        onError={() => setVideoFailed(true)}
      />
    );
  }

  return (
    <svg viewBox="0 0 600 800" className="w-full h-full" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="authBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3d1f00" />
          <stop offset="100%" stopColor="#2a1400" />
        </linearGradient>
        <linearGradient id="bagGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff9633" />
          <stop offset="100%" stopColor="#ff7a00" />
        </linearGradient>
      </defs>
      <rect width="600" height="800" fill="url(#authBg)" />
      {/* Soft decorative circles */}
      <circle cx="520" cy="120" r="140" fill="#ffffff" opacity="0.04" />
      <circle cx="60" cy="680" r="180" fill="#ff7a00" opacity="0.08" />
      <circle cx="480" cy="700" r="60" fill="#ffffff" opacity="0.05" />

      {/* Large shopping bag (center) */}
      <g transform="translate(180,300)">
        <path d="M20 60 L30 20 Q35 5 55 5 L145 5 Q165 5 170 20 L180 60 Z" fill="#ffffff" opacity="0.95" />
        <rect x="10" y="60" width="180" height="180" rx="10" fill="#ffffff" />
        <rect x="10" y="60" width="180" height="180" rx="10" fill="url(#bagGold)" opacity="0.15" />
        <path d="M65 60 Q65 15 100 15 Q135 15 135 60" fill="none" stroke="#3d1f00" strokeWidth="8" strokeLinecap="round" />
        <circle cx="70" cy="110" r="6" fill="#ff7a00" />
        <circle cx="130" cy="110" r="6" fill="#ff7a00" />
      </g>

      {/* Small box (left) */}
      <g transform="translate(60,440) rotate(-8)">
        <rect x="0" y="0" width="110" height="100" rx="6" fill="url(#bagGold)" />
        <rect x="0" y="0" width="110" height="28" rx="6" fill="#ffffff" opacity="0.25" />
        <line x1="55" y1="0" x2="55" y2="100" stroke="#ffffff" strokeWidth="4" opacity="0.5" />
      </g>

      {/* Price tag (right) */}
      <g transform="translate(420,420) rotate(12)">
        <path d="M0 20 L60 20 L100 60 L60 100 L0 100 Q -10 100 -10 90 L -10 30 Q -10 20 0 20" fill="#ffffff" />
        <circle cx="15" cy="50" r="8" fill="#3d1f00" />
        <rect x="0" y="20" width="100" height="80" rx="8" fill="none" />
      </g>

      {/* Small floating dots / confetti */}
      <circle cx="440" cy="220" r="5" fill="#ff7a00" />
      <circle cx="140" cy="230" r="4" fill="#ffffff" opacity="0.6" />
      <circle cx="500" cy="520" r="6" fill="#ffffff" opacity="0.4" />
      <circle cx="90" cy="600" r="4" fill="#ff7a00" />

      {/* Bottom small cart icon */}
      <g transform="translate(260,560)">
        <path d="M0 0 L10 0 L20 55 L75 55 L85 20 L20 20" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <circle cx="32" cy="70" r="7" fill="#ffffff" opacity="0.9" />
        <circle cx="68" cy="70" r="7" fill="#ffffff" opacity="0.9" />
      </g>
    </svg>
  );
}
