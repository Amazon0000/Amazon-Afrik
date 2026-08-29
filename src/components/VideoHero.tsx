import { useState } from 'react';

// Hero vidéo réutilisable. IMPORTANT (honnêteté technique) : je ne peux pas
// générer de fichier vidéo — `videoSrc` doit pointer vers une vraie vidéo
// hébergée (ex: Supabase Storage, Cloudinary, Mux, un MP4 sur votre CDN).
// Tant qu'aucune URL n'est fournie, le composant affiche proprement
// `posterSrc` (image statique) plutôt que de casser silencieusement ou
// d'afficher un lecteur vidéo cassé.
export function VideoHero({
  videoSrc,
  posterSrc,
  overlayClassName = 'bg-gradient-to-r from-black/60 via-black/30 to-transparent',
  children,
  heightClassName = 'h-[420px] sm:h-[520px] lg:h-[620px]',
}: {
  videoSrc?: string;
  posterSrc: string;
  overlayClassName?: string;
  children: React.ReactNode;
  heightClassName?: string;
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = !!videoSrc && !videoFailed;

  return (
    <section className={`relative w-full overflow-hidden ${heightClassName}`}>
      {showVideo ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
        />
      ) : (
        <img src={posterSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className={`absolute inset-0 ${overlayClassName}`} />
      <div className="relative h-full max-w-[1500px] mx-auto px-6 sm:px-10 flex items-center">
        {children}
      </div>
    </section>
  );
}
