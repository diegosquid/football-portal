"use client";

import { useState } from "react";
import Image from "next/image";
import { DEFAULT_ARTICLE_IMAGE } from "@/lib/images";

interface ArticleImageProps {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
}

/**
 * Wrapper do next/image com fallback automático.
 * Se a imagem original falhar (404, timeout, etc.), exibe a imagem de fallback.
 */
export function ArticleImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fallbackSrc,
}: ArticleImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc || DEFAULT_ARTICLE_IMAGE);
  const [hasError, setHasError] = useState(false);

  function handleError() {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc || DEFAULT_ARTICLE_IMAGE);
    }
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={handleError}
    />
  );
}
