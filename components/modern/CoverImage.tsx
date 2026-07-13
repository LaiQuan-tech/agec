import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * A framed, cropped cover image (faculty portraits, side photos, journal
 * cover, news card thumbnails). Renders a positioned wrapper of the caller's
 * dimensions with a `next/image` fill layer (objectFit: cover) inside it.
 * Full-bleed hero/quote-band backgrounds are laid out inline in their own
 * components instead, since they sit behind overlays + content.
 *
 * No "use client" directive — usable from Server and Client components alike.
 */
export function CoverImage({
  src,
  alt,
  sizes,
  priority,
  rounded = 0,
  style,
  className,
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  rounded?: number | string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: rounded,
        background: "#e7e1cd",
        ...style,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "100vw"}
        priority={priority}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
