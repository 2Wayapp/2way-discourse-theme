import { apiInitializer } from "discourse/lib/api";

function ensureSidebarBrand() {
  const desktop = window.matchMedia("(min-width: 1000px)").matches;
  const body = document.body;

  if (!desktop || !body?.classList.contains("has-sidebar-page")) {
    document
      .querySelectorAll(".two-way-sidebar-brand")
      .forEach((node) => node.remove());
    return;
  }

  const sidebarSections = document.querySelectorAll(
    ".sidebar-wrapper .sidebar-sections, .sidebar-container .sidebar-sections"
  );

  const fallbackLogo =
    document.querySelector("#site-logo")?.currentSrc ||
    document.querySelector("#site-logo")?.getAttribute("src") ||
    "";

  const sidebarLogo = settings.sidebar_logo_url || fallbackLogo;

  sidebarSections.forEach((section) => {
    if (section.querySelector(".two-way-sidebar-brand")) {
      return;
    }

    const anchor = document.createElement("a");
    anchor.className = "two-way-sidebar-brand";
    anchor.href = "/";
    anchor.setAttribute("aria-label", "2Way home");

    if (!settings.sidebar_logo_url) {
      anchor.classList.add("two-way-sidebar-brand--filter");
    }

    const img = document.createElement("img");
    img.className = "two-way-sidebar-brand__image";
    img.alt = "2Way";
    img.src = sidebarLogo;

    anchor.appendChild(img);
    section.prepend(anchor);
  });
}

export default apiInitializer("1.8.0", (api) => {
  api.onPageChange(() => {
    requestAnimationFrame(() => ensureSidebarBrand());
  });

  requestAnimationFrame(() => ensureSidebarBrand());
  window.addEventListener("resize", ensureSidebarBrand);
});
