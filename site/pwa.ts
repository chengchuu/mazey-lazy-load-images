import { isStandalonePWA, watchServiceWorkerUpdates } from "mazey";

export interface SitePwaConfig {
  appName: string;
  enabled: boolean;
  scope: string;
  serviceWorkerUrl: string;
}

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function announce(message: string): void {
  document
    .querySelectorAll<HTMLElement>("[data-pwa-status]")
    .forEach((node) => {
      node.textContent = message;
    });
}

function initializeInstall(config: SitePwaConfig): void {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-pwa-install]"),
  );
  let prompt: InstallPrompt | null = null;
  const hide = () =>
    buttons.forEach((button) => {
      button.hidden = true;
      const container = button.closest<HTMLElement>(
        "[data-pwa-install-container]",
      );
      if (container) container.hidden = true;
    });
  if (isStandalonePWA()) hide();
  window.addEventListener("beforeinstallprompt", (event) => {
    if (isStandalonePWA()) return;
    event.preventDefault();
    prompt = event as InstallPrompt;
    buttons.forEach((button) => {
      button.hidden = false;
      const container = button.closest<HTMLElement>(
        "[data-pwa-install-container]",
      );
      if (container) container.hidden = false;
    });
  });
  buttons.forEach((button) =>
    button.addEventListener("click", async () => {
      if (!prompt) return;
      const current = prompt;
      prompt = null;
      try {
        await current.prompt();
        const choice = await current.userChoice;
        announce(
          choice.outcome === "accepted"
            ? `${config.appName} installation was accepted.`
            : "Installation was dismissed. Use the browser install menu to try later.",
        );
      } catch {
        announce(
          "The browser could not open the install prompt. Use its install menu instead.",
        );
      }
      hide();
    }),
  );
  window.addEventListener("appinstalled", () => {
    hide();
    announce(`${config.appName} was installed.`);
  });
}

function canRegister(config: SitePwaConfig): boolean {
  try {
    return (
      config.enabled &&
      "serviceWorker" in navigator &&
      location.protocol === "https:" &&
      location.pathname.startsWith(config.scope)
    );
  } catch {
    return false;
  }
}

async function register(config: SitePwaConfig): Promise<void> {
  if (!canRegister(config)) return;
  try {
    const registration = await navigator.serviceWorker.register(
      config.serviceWorkerUrl,
      { scope: config.scope },
    );
    const notice = document.querySelector<HTMLElement>("[data-pwa-update]");
    const button = document.querySelector<HTMLButtonElement>(
      "[data-pwa-update-now]",
    );
    let requested = false;
    const watcher = watchServiceWorkerUpdates(
      registration,
      navigator.serviceWorker,
      {
        onUpdateAvailable() {
          if (notice) notice.hidden = false;
          announce(
            `A new version of the ${config.appName} website is available.`,
          );
        },
        onControllerChange() {
          if (notice) notice.hidden = true;
          if (requested) location.reload();
        },
      },
    );
    button?.addEventListener("click", () => {
      requested = watcher.activateWaiting();
      if (requested) {
        button.disabled = true;
        announce("Updating the website now.");
      }
    });
  } catch (error) {
    console.error(
      `Failed to register the ${config.appName} service worker.`,
      error,
    );
  }
}

export function initializeSitePwa(config: SitePwaConfig): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  initializeInstall(config);
  if (document.readyState === "complete") void register(config);
  else
    window.addEventListener("load", () => void register(config), {
      once: true,
    });
}
