// Background photos: pre-compressed WebP with a JPEG fallback, in four widths (public/images/).
// Regenerate them with tools/optimize_images.py when a photo changes.

const WIDTHS = [640, 1280, 1920, 2560] as const;

export const PHOTOS = {
  'paving-sunset': {
    alt: 'Freshly laid asphalt at sunset, with a paving crew and paver in the background',
    width: 1280, height: 698,
  },
  'paving-rollers': {
    alt: 'Rollers compacting a new asphalt layer while workers check the surface',
    width: 1280, height: 718,
  },
} as const;

export type PhotoName = keyof typeof PHOTOS;

const srcSet = (name: PhotoName, ext: 'webp' | 'jpg') =>
  WIDTHS.map((w) => `/images/${name}-${w}.${ext} ${w}w`).join(', ');

interface Props {
  name: PhotoName;
  /** CSS sizes hint, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes: string;
  /** Above-the-fold image: load immediately with high priority. Otherwise lazy-loaded. */
  priority?: boolean;
  /** Empty alt for purely decorative use (text on top already says it). */
  decorative?: boolean;
  className?: string;
}

export function ResponsivePicture({ name, sizes, priority = false, decorative = false, className = '' }: Props) {
  const photo = PHOTOS[name];
  return (
    <picture>
      <source type="image/webp" srcSet={srcSet(name, 'webp')} sizes={sizes} />
      <img src={`/images/${name}-1280.jpg`} srcSet={srcSet(name, 'jpg')} sizes={sizes}
        alt={decorative ? '' : photo.alt} width={photo.width} height={photo.height}
        loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async"
        className={className} />
    </picture>
  );
}
