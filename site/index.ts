import { SITE_RUNTIME_CONFIG } from "./runtime-config";

document
  .querySelector<HTMLButtonElement>("[data-copy-install]")
  ?.addEventListener("click", async () => {
    const status = document.querySelector<HTMLElement>("[data-copy-status]");
    try {
      await navigator.clipboard.writeText(SITE_RUNTIME_CONFIG.installCommand);
      if (status) status.textContent = "Install command copied.";
    } catch {
      if (status)
        status.textContent =
          "Copy is unavailable. Select the command manually.";
    }
  });
