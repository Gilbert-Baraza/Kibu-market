import { useEffect, useState } from "react";

const DEFAULT_FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 480'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f3efe4'/%3E%3Cstop offset='100%25' stop-color='%23d9e3f0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='640' height='480' fill='url(%23g)'/%3E%3Cpath d='M130 360l108-118 82 84 71-67 119 101H130z' fill='%23ffffff' fill-opacity='.75'/%3E%3Ccircle cx='243' cy='164' r='44' fill='%23ffffff' fill-opacity='.85'/%3E%3Ctext x='50%25' y='430' text-anchor='middle' font-family='Arial, sans-serif' font-size='28' fill='%235b6572'%3EImage unavailable%3C/text%3E%3C/svg%3E";

function SmartImage({
  src,
  alt,
  className,
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  loading = "lazy",
  decoding = "async",
  ...props
}) {
  const normalizedSrc = src?.trim() ? src : fallbackSrc;
  const [imageSrc, setImageSrc] = useState(normalizedSrc);

  useEffect(() => {
    setImageSrc(normalizedSrc);
  }, [normalizedSrc]);

  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={() => {
        if (imageSrc !== fallbackSrc) {
          setImageSrc(fallbackSrc);
        }
      }}
    />
  );
}

export default SmartImage;
