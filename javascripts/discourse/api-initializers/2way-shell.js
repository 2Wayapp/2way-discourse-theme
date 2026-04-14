import { apiInitializer } from "discourse/lib/api";

function cleanDocumentTitle() {
  return document.title
    .replace(/\s*-\s*2Way Community.*$/, "")
    .replace(/\s*-\s*2Way.*$/, "")
    .trim();
}

function titleCase(value) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getHeaderContext() {
  const path = window.location.pathname;
  const documentTitle = cleanDocumentTitle();
  const topicTitle =
    document.querySelector(".fancy-title .topic-title")?.textContent?.trim() ||
    document.querySelector("#topic-title h1")?.textContent?.trim();
  const categoryTitle =
    document.querySelector(".category-title-header .category-title-contents h1")
      ?.textContent?.trim() ||
    document.querySelector(".category-title-contents h1")?.textContent?.trim();

  if (path.startsWith("/admin")) {
    return {
      crumb: "Admin",
      title:
        document.querySelector(".admin-interface h1")?.textContent?.trim() ||
        documentTitle ||
        "Admin",
    };
  }

  if (path.startsWith("/review")) {
    return { crumb: "Review", title: "Review" };
  }

  if (path.startsWith("/u/")) {
    return { crumb: "Account", title: documentTitle || "Account" };
  }

  if (path.startsWith("/c/")) {
    return { crumb: "Community", title: categoryTitle || documentTitle || "Community" };
  }

  if (path.startsWith("/t/")) {
    return { crumb: "Community", title: topicTitle || documentTitle || "Topic" };
  }

  if (path === "/categories") {
    return { crumb: "Community", title: "Categories" };
  }

  if (path === "/new") {
    return { crumb: "Community", title: "New" };
  }

  if (path === "/hot") {
    return { crumb: "Community", title: "Hot" };
  }

  if (path === "/latest" || path === "/") {
    return { crumb: "Community", title: "Community" };
  }

  const slug = path.split("/").filter(Boolean).at(-1) || "Community";
  return { crumb: "Community", title: documentTitle || titleCase(slug) };
}

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

  const runtimeTheme = window.TwoWayTheme || {};
  const sidebarLogo = runtimeTheme.sidebarLogoUrl || settings.sidebar_logo_url || fallbackLogo;

  sidebarSections.forEach((section) => {
    if (section.querySelector(".two-way-sidebar-brand")) {
      return;
    }

    const anchor = document.createElement("a");
    anchor.className = "two-way-sidebar-brand";
    anchor.href = "/";
    anchor.setAttribute("aria-label", "2Way home");

    if (!runtimeTheme.sidebarLogoUrl && !settings.sidebar_logo_url) {
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

function ensureHeaderContext() {
  const desktop = window.matchMedia("(min-width: 1000px)").matches;
  const body = document.body;
  const headerContents = document.querySelector(".d-header .contents");

  if (!desktop || !body?.classList.contains("has-sidebar-page") || !headerContents) {
    document
      .querySelectorAll(".two-way-header-context")
      .forEach((node) => node.remove());
    return;
  }

  const context = getHeaderContext();
  const panel = headerContents.querySelector(".panel");
  let contextNode = headerContents.querySelector(".two-way-header-context");

  if (!contextNode) {
    contextNode = document.createElement("div");
    contextNode.className = "two-way-header-context";
    contextNode.innerHTML = `
      <div class="two-way-header-context__crumbs">
        <span class="two-way-header-context__crumb-home">Home</span>
        <span class="two-way-header-context__crumb-separator">›</span>
        <span class="two-way-header-context__crumb-current"></span>
      </div>
      <div class="two-way-header-context__title"></div>
    `;
  }

  contextNode.querySelector(".two-way-header-context__crumb-current").textContent =
    context.crumb;
  contextNode.querySelector(".two-way-header-context__title").textContent =
    context.title;

  if (panel) {
    headerContents.insertBefore(contextNode, panel);
  } else {
    headerContents.prepend(contextNode);
  }
}

function refreshShell() {
  requestAnimationFrame(() => {
    ensureSidebarBrand();
    ensureHeaderContext();
  });
}

export default apiInitializer("1.8.0", (api) => {
  api.onPageChange(() => {
    refreshShell();
  });

  refreshShell();
  window.addEventListener("resize", refreshShell);
});
