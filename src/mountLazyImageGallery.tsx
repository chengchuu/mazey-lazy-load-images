import { createElement } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import { LazyImageGallery } from "./LazyImageGallery";
import type {
  LazyImageGalleryController,
  LazyImageGalleryProps,
} from "./types";

function resolveTarget(target: string | Element): Element {
  if (typeof document === "undefined") {
    throw new Error("mountLazyImageGallery() requires a browser document.");
  }

  if (typeof target !== "string") {
    if (target?.nodeType === 1) {
      return target;
    }
    throw new TypeError(
      "mountLazyImageGallery() target must be an Element or CSS selector.",
    );
  }

  if (target.trim() === "") {
    throw new TypeError(
      "mountLazyImageGallery() target selector must not be empty.",
    );
  }

  let element: Element | null;
  try {
    element = document.querySelector(target);
  } catch (error) {
    throw new TypeError(
      `mountLazyImageGallery() received an invalid selector: ${target}`,
      { cause: error },
    );
  }

  if (!element) {
    throw new Error(
      `mountLazyImageGallery() could not find a target for selector: ${target}`,
    );
  }

  return element;
}

function renderGallery(root: Root, props: LazyImageGalleryProps): void {
  root.render(createElement(LazyImageGallery, props));
}

export function mountLazyImageGallery(
  target: string | Element,
  props: LazyImageGalleryProps,
): LazyImageGalleryController {
  const root = createRoot(resolveTarget(target));
  let destroyed = false;
  renderGallery(root, props);

  return {
    update(nextProps) {
      if (destroyed) {
        throw new Error(
          "mountLazyImageGallery() cannot update a destroyed gallery.",
        );
      }
      renderGallery(root, nextProps);
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      root.unmount();
    },
  };
}
