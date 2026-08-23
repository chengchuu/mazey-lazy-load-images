import "bootstrap/dist/css/bootstrap.min.css";
import "./site.css";
import { initializeNavigation } from "./navigation";
import { initializeSitePwa } from "./pwa";
import { SITE_RUNTIME_CONFIG } from "./runtime-config";
import { initializeThemeControls } from "./theme";

initializeThemeControls(SITE_RUNTIME_CONFIG.themeStorageKey);
initializeNavigation();
initializeSitePwa(SITE_RUNTIME_CONFIG.pwa);
