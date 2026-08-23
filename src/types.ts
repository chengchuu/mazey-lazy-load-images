import type { CSSProperties, ReactNode } from "react";

export type ImageEventStage = "source" | "fallback";

export interface GalleryImageConfig {
  id?: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  srcSet?: string;
  sizes?: string;
  placeholderSrc?: string;
  fallbackSrc?: string;
  fetchPriority?: "high" | "low" | "auto";
}

export type GalleryImage = string | GalleryImageConfig;

export interface NormalizedGalleryImage {
  id?: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  srcSet?: string;
  sizes?: string;
  placeholderSrc?: string;
  fallbackSrc?: string;
  fetchPriority?: "high" | "low" | "auto";
}

export interface GalleryItem {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  images: readonly GalleryImage[];
}

export interface GalleryLabels {
  loading: string;
  error: string;
  retry: string;
}

export interface ImageEventContext {
  image: NormalizedGalleryImage;
  itemIndex: number;
  imageIndex: number;
  attempt: number;
  stage: ImageEventStage;
}

export interface LazyImageGalleryProps {
  items: readonly GalleryItem[];
  rootMargin?: string;
  minColumnWidth?: string;
  gap?: string;
  defaultAspectRatio?: number;
  defaultPlaceholderSrc?: string;
  defaultFallbackSrc?: string;
  labels?: Partial<GalleryLabels>;
  className?: string;
  style?: CSSProperties;
  unstyled?: boolean;
  onImageLoad?: (context: ImageEventContext) => void;
  onImageError?: (context: ImageEventContext) => void;
}

export interface LazyImageGalleryController {
  update(props: LazyImageGalleryProps): void;
  destroy(): void;
}
