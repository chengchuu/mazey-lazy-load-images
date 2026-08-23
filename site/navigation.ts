import Collapse from "bootstrap/js/dist/collapse";

export function initializeNavigation(): void {
  document
    .querySelectorAll<HTMLElement>("[data-site-navbar]")
    .forEach((navbar) => {
      const toggle =
        navbar.querySelector<HTMLButtonElement>("[data-nav-toggle]");
      const menu = navbar.querySelector<HTMLElement>("[data-mobile-nav]");
      if (!toggle || !menu || navbar.dataset.navigationReady) return;
      navbar.dataset.navigationReady = "true";
      menu.classList.add("collapse");
      const collapse = Collapse.getOrCreateInstance(menu, { toggle: false });
      toggle.addEventListener("click", () => collapse.toggle());
      menu.addEventListener("show.bs.collapse", () =>
        toggle.setAttribute("aria-expanded", "true"),
      );
      menu.addEventListener("hide.bs.collapse", () =>
        toggle.setAttribute("aria-expanded", "false"),
      );
      menu.addEventListener("click", (event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("a") &&
          menu.classList.contains("show")
        )
          collapse.hide();
      });
    });
}
