import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  ImgHTMLAttributes,
  ReactElement,
  SyntheticEvent,
} from "react";

import { DEFAULT_STYLES } from "./styles";
import type {
  GalleryImage,
  GalleryLabels,
  ImageEventContext,
  ImageEventStage,
  LazyImageGalleryProps,
  NormalizedGalleryImage,
} from "./types";

const DEFAULT_LABELS: GalleryLabels = {
  loading: "Loading image",
  error: "Image failed to load",
  retry: "Retry",
};

type ObserveImage = (element: Element, reveal: () => void) => () => void;

type ImageStatus = "idle" | "loading" | "loaded" | "error";

interface LazyGalleryImageProps {
  image: GalleryImage;
  itemIndex: number;
  imageIndex: number;
  observeImage: ObserveImage;
  defaultAspectRatio: number;
  defaultPlaceholderSrc?: string;
  defaultFallbackSrc?: string;
  labels: GalleryLabels;
  onImageLoad?: (context: ImageEventContext) => void;
  onImageError?: (context: ImageEventContext) => void;
}

function normalizeImage(image: GalleryImage): NormalizedGalleryImage {
  if (typeof image === "string") {
    return {
      src: image,
      alt: "",
    };
  }

  return {
    ...image,
    alt: image.alt ?? "",
  };
}

function createImageContext(
  image: NormalizedGalleryImage,
  itemIndex: number,
  imageIndex: number,
  attempt: number,
  stage: ImageEventStage,
): ImageEventContext {
  return {
    image,
    itemIndex,
    imageIndex,
    attempt,
    stage,
  };
}

function getPositiveFiniteNumber(
  value: number | undefined,
): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function getSourceIdentity(image: NormalizedGalleryImage): string {
  return [image.src, image.srcSet, image.sizes].join("\u0000");
}

function getAspectRatio(
  image: NormalizedGalleryImage,
  defaultAspectRatio: number,
): number {
  const width = getPositiveFiniteNumber(image.width);
  const height = getPositiveFiniteNumber(image.height);
  if (width !== undefined && height !== undefined) {
    return width / height;
  }

  return getPositiveFiniteNumber(defaultAspectRatio) ?? 4 / 3;
}

function LazyGalleryImage({
  image: imageInput,
  itemIndex,
  imageIndex,
  observeImage,
  defaultAspectRatio,
  defaultPlaceholderSrc,
  defaultFallbackSrc,
  labels,
  onImageLoad,
  onImageError,
}: LazyGalleryImageProps): ReactElement {
  const image = useMemo(() => normalizeImage(imageInput), [imageInput]);
  const tileRef = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState<ImageStatus>("idle");
  const [attempt, setAttempt] = useState(1);
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false);
  const [placeholderFailed, setPlaceholderFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const [loadedAspectRatio, setLoadedAspectRatio] = useState<number>();

  const placeholderSrc = image.placeholderSrc ?? defaultPlaceholderSrc;
  const fallbackSrc = image.fallbackSrc ?? defaultFallbackSrc;
  const sourceIdentity = getSourceIdentity(image);
  const hasSource =
    typeof image.src === "string" && image.src.trim().length > 0;
  const width = getPositiveFiniteNumber(image.width);
  const height = getPositiveFiniteNumber(image.height);

  useEffect(() => {
    setRevealed(false);
    setStatus("idle");
    setAttempt(1);
    setLoadedAspectRatio(undefined);
  }, [sourceIdentity]);

  useEffect(() => {
    setPlaceholderLoaded(false);
    setPlaceholderFailed(false);
  }, [placeholderSrc]);

  useEffect(() => {
    setFallbackFailed(false);
  }, [fallbackSrc]);

  useEffect(() => {
    const tile = tileRef.current;
    if (!tile || revealed) {
      return undefined;
    }

    return observeImage(tile, () => {
      setRevealed(true);
      setStatus("loading");
    });
  }, [observeImage, revealed, sourceIdentity]);

  useEffect(() => {
    if (!revealed || hasSource || status !== "loading") {
      return;
    }

    setStatus("error");
    onImageError?.(
      createImageContext(image, itemIndex, imageIndex, attempt, "source"),
    );
  }, [
    attempt,
    hasSource,
    image,
    imageIndex,
    itemIndex,
    onImageError,
    revealed,
    status,
  ]);

  const handleSourceLoad = (event: SyntheticEvent<HTMLImageElement>): void => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      setLoadedAspectRatio(naturalWidth / naturalHeight);
    }
    setStatus("loaded");
    onImageLoad?.(
      createImageContext(image, itemIndex, imageIndex, attempt, "source"),
    );
  };

  const handleSourceError = (): void => {
    setStatus("error");
    onImageError?.(
      createImageContext(image, itemIndex, imageIndex, attempt, "source"),
    );
  };

  const handleFallbackLoad = (): void => {
    onImageLoad?.(
      createImageContext(image, itemIndex, imageIndex, attempt, "fallback"),
    );
  };

  const handleFallbackError = (): void => {
    setFallbackFailed(true);
    onImageError?.(
      createImageContext(image, itemIndex, imageIndex, attempt, "fallback"),
    );
  };

  const handleRetry = (): void => {
    setAttempt((currentAttempt) => currentAttempt + 1);
    setFallbackFailed(false);
    setStatus("loading");
  };

  const sourceProps: ImgHTMLAttributes<HTMLImageElement> =
    revealed && hasSource
      ? {
          src: image.src,
          srcSet: image.srcSet,
          sizes: image.sizes,
        }
      : {};
  const aspectRatio =
    loadedAspectRatio ?? getAspectRatio(image, defaultAspectRatio);

  return (
    <figure
      ref={tileRef}
      className="mlli-tile"
      style={{ aspectRatio }}
      aria-busy={status === "idle" || status === "loading"}
      data-status={status}
    >
      {(status === "idle" || status === "loading") && (
        <span className="mlli-skeleton" aria-hidden="true" />
      )}
      {revealed && placeholderSrc && !placeholderFailed && (
        <img
          className="mlli-placeholder"
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          data-visible={placeholderLoaded && status !== "loaded"}
          onLoad={() => setPlaceholderLoaded(true)}
          onError={() => setPlaceholderFailed(true)}
        />
      )}
      <img
        key={`${sourceIdentity}-${attempt}`}
        className="mlli-image"
        {...sourceProps}
        alt={image.alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        fetchPriority={image.fetchPriority}
        data-loaded={status === "loaded"}
        onLoad={handleSourceLoad}
        onError={handleSourceError}
      />
      {status === "error" && fallbackSrc && !fallbackFailed && (
        <img
          className="mlli-fallback"
          src={fallbackSrc}
          alt=""
          aria-hidden="true"
          onLoad={handleFallbackLoad}
          onError={handleFallbackError}
        />
      )}
      {status === "error" && (
        <span className="mlli-error" role="status" aria-live="polite">
          <span>{labels.error}</span>
          <button className="mlli-retry" type="button" onClick={handleRetry}>
            {labels.retry}
          </button>
        </span>
      )}
      {(status === "idle" || status === "loading") && (
        <span className="mlli-visually-hidden">{labels.loading}</span>
      )}
    </figure>
  );
}

export function LazyImageGallery({
  items,
  rootMargin = "300px 0px",
  minColumnWidth = "240px",
  gap = "16px",
  defaultAspectRatio = 4 / 3,
  defaultPlaceholderSrc,
  defaultFallbackSrc,
  labels: labelsInput,
  className,
  style,
  unstyled = false,
  onImageLoad,
  onImageError,
}: LazyImageGalleryProps): ReactElement {
  const galleryId = useId();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const eagerLoadingRef = useRef(false);
  const pendingImagesRef = useRef(new Map<Element, () => void>());
  const labels = useMemo(
    () => ({
      loading: labelsInput?.loading ?? DEFAULT_LABELS.loading,
      error: labelsInput?.error ?? DEFAULT_LABELS.error,
      retry: labelsInput?.retry ?? DEFAULT_LABELS.retry,
    }),
    [labelsInput],
  );

  const observeImage = useCallback<ObserveImage>((element, reveal) => {
    if (eagerLoadingRef.current) {
      reveal();
      return () => undefined;
    }

    pendingImagesRef.current.set(element, reveal);
    observerRef.current?.observe(element);

    return () => {
      pendingImagesRef.current.delete(element);
      observerRef.current?.unobserve(element);
    };
  }, []);

  useEffect(() => {
    const pendingImages = pendingImagesRef.current;
    if (typeof IntersectionObserver === "undefined") {
      eagerLoadingRef.current = true;
      const revealCallbacks = [...pendingImages.values()];
      pendingImages.clear();
      revealCallbacks.forEach((reveal) => reveal());
      return undefined;
    }

    eagerLoadingRef.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const reveal = pendingImages.get(entry.target);
          if (reveal) {
            pendingImages.delete(entry.target);
            observer.unobserve(entry.target);
            reveal();
          }
        });
      },
      { rootMargin },
    );
    observerRef.current = observer;
    pendingImages.forEach((_reveal, element) => observer.observe(element));

    return () => {
      observer.disconnect();
      if (observerRef.current === observer) {
        observerRef.current = null;
      }
    };
  }, [rootMargin]);

  const rootStyle = {
    "--mlli-column-width": minColumnWidth,
    "--mlli-gap": gap,
    ...style,
  } as CSSProperties;
  const rootClassName = ["mlli-root", className].filter(Boolean).join(" ");

  return (
    <>
      {!unstyled && (
        <style href="mazey-lazy-load-images-default-styles-v2" precedence="low">
          {DEFAULT_STYLES}
        </style>
      )}
      <div className={rootClassName} style={rootStyle}>
        {items.map((item, itemIndex) => {
          const itemKey = item.id ?? `item-${itemIndex}`;
          const headingId = `${galleryId}-item-${itemIndex}-heading`;

          return (
            <section
              key={itemKey}
              className="mlli-section"
              aria-labelledby={headingId}
            >
              <h2 id={headingId} className="mlli-heading">
                {item.title}
              </h2>
              {item.description != null && (
                <div className="mlli-description">{item.description}</div>
              )}
              <div className="mlli-grid">
                {item.images.map((image, imageIndex) => {
                  const normalizedImage = normalizeImage(image);
                  const imageKey =
                    normalizedImage.id ??
                    `${normalizedImage.src}-${imageIndex}`;
                  const sourceIdentity = getSourceIdentity(normalizedImage);

                  return (
                    <LazyGalleryImage
                      key={`${imageKey}-${sourceIdentity}`}
                      image={image}
                      itemIndex={itemIndex}
                      imageIndex={imageIndex}
                      observeImage={observeImage}
                      defaultAspectRatio={defaultAspectRatio}
                      defaultPlaceholderSrc={defaultPlaceholderSrc}
                      defaultFallbackSrc={defaultFallbackSrc}
                      labels={labels}
                      onImageLoad={onImageLoad}
                      onImageError={onImageError}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
