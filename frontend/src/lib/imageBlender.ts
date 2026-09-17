'use client';

import React, { useState, useEffect } from 'react';

/**
 * Returns CSS properties for smart blending of white background product photos into dark slider themes.
 * Uses mix-blend-mode: multiply with a gentle radial vignette mask to seamlessly fade outer photo edges
 * without eroding or hollowing out silver chins, white keys, or product details.
 */
export function getProductBlendStyles(removeWhiteBg?: boolean): React.CSSProperties | undefined {
  if (!removeWhiteBg) return undefined;
  return {
    mixBlendMode: 'multiply',
    WebkitMaskImage:
      'radial-gradient(ellipse 90% 86% at 50% 50%, #000 68%, rgba(0, 0, 0, 0.75) 82%, transparent 100%)',
    maskImage:
      'radial-gradient(ellipse 90% 86% at 50% 50%, #000 68%, rgba(0, 0, 0, 0.75) 82%, transparent 100%)',
  };
}

/**
 * Safe pass-through for white background removal.
 * Preserves high resolution and hardware fidelity (silver chins, white keys, ROG logos)
 * while enabling studio multiply blending.
 */
export async function removeWhiteBackground(imageUrl: string): Promise<string> {
  if (!imageUrl) return '';
  return imageUrl;
}

/**
 * React hook to manage product image source and blend state.
 */
export function useBlendedProductImage(
  src: string,
  removeWhiteBg: boolean = false
): { displaySrc: string; isBlended: boolean } {
  const [displaySrc, setDisplaySrc] = useState<string>(src || '');
  const [isBlended, setIsBlended] = useState<boolean>(Boolean(removeWhiteBg && src));

  useEffect(() => {
    setDisplaySrc(src || '');
    setIsBlended(Boolean(removeWhiteBg && src));
  }, [src, removeWhiteBg]);

  return { displaySrc, isBlended };
}
