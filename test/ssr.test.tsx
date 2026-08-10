/** @jest-environment node */

import { renderToString } from "react-dom/server";

import { LazyImageGallery } from "../src";

test("imports and renders without browser globals", () => {
  expect(typeof globalThis.window).toBe("undefined");
  expect(typeof globalThis.document).toBe("undefined");

  const html = renderToString(
    <LazyImageGallery
      items={[
        {
          title: "Server-rendered collection",
          description: "Markup renders before observation begins.",
          images: [
            {
              src: "https://example.com/server.jpg",
              alt: "Server-rendered example",
              width: 800,
              height: 600,
            },
          ],
        },
      ]}
    />,
  );

  expect(html).toContain("Server-rendered collection");
  expect(html).toContain("Server-rendered example");
  expect(html).not.toContain('src="https://example.com/server.jpg"');
  expect(html).toContain("mazey-lazy-load-images-default-styles-v2");
});
