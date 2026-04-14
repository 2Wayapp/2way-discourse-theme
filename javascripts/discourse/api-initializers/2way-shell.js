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
    return { crumb: "Forum", title: categoryTitle || documentTitle || "Forum" };
  }

  if (path.startsWith("/t/")) {
    return { crumb: "Forum", title: topicTitle || documentTitle || "Topic" };
  }

  if (path === "/categories") {
    return { crumb: "Forum", title: "Categories" };
  }

  if (path === "/new") {
    return { crumb: "Forum", title: "New" };
  }

  if (path === "/hot") {
    return { crumb: "Forum", title: "Hot" };
  }

  if (path === "/latest" || path === "/") {
    return { crumb: "Forum", title: "Forum" };
  }

  const slug = path.split("/").filter(Boolean).at(-1) || "Forum";
  return { crumb: "Forum", title: documentTitle || titleCase(slug) };
}

function normalizeBaseUrl(url) {
  return (url || "").trim().replace(/\/+$/, "");
}

function joinUrl(base, path) {
  if (!base) {
    return path;
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function getProductNavGroups() {
  const webappBase = normalizeBaseUrl(settings.webapp_url);
  const formsUrl = (settings.forms_url || "").trim();
  const formsLabel = (settings.forms_label || "Forms").trim() || "Forms";

  if (!webappBase && !formsUrl) {
    return [];
  }

  const icon = (name) => joinUrl(webappBase, `/icons/nav/${name}`);

  return [
    {
      label: "CORE",
      items: [
        { label: "Activity Feed", href: joinUrl(webappBase, "/"), iconSrc: icon("feeds.png") },
        {
          label: "Emergency Contacts",
          href: joinUrl(webappBase, "/emergency"),
          iconSrc: icon("emergency.png"),
        },
      ],
    },
    {
      label: "CONTENT",
      items: [
        { label: "News", href: joinUrl(webappBase, "/newsletters"), iconSrc: icon("newsletter.svg") },
        { label: "Journals", href: joinUrl(webappBase, "/journals"), iconSrc: icon("journal.png") },
        { label: "Events", href: joinUrl(webappBase, "/events"), iconSrc: icon("event.png") },
        { label: "Reports", href: joinUrl(webappBase, "/reports"), iconSrc: icon("report.png") },
        { label: "Surveys", href: joinUrl(webappBase, "/surveys"), iconSrc: icon("survey.png") },
        {
          label: formsLabel,
          href: formsUrl || joinUrl(webappBase, "/forms"),
          iconSrc: (settings.forms_icon_url || "").trim() || icon("default.svg"),
        },
      ],
    },
    {
      label: "DIRECTORY",
      items: [
        { label: "Members", href: joinUrl(webappBase, "/board-staff"), iconSrc: icon("members.png") },
        { label: "Contacts", href: joinUrl(webappBase, "/contacts"), iconSrc: icon("contact.png") },
        {
          label: "Destination",
          href: joinUrl(webappBase, "/destinations"),
          iconSrc: icon("destination.png"),
        },
      ],
    },
    {
      label: "RESOURCES",
      items: [
        { label: "Documents", href: joinUrl(webappBase, "/documents"), iconSrc: icon("document.png") },
        { label: "Deals & Discounts", href: joinUrl(webappBase, "/deals"), iconSrc: icon("deals.svg") },
      ],
    },
    {
      label: "FORUM",
      items: [{ label: "Forum", href: "/latest", iconSrc: icon("chat.svg"), activeMatch: "community" }],
    },
  ].map((group) => ({
    ...group,
    items: group.items.filter((item) => item.href && !item.href.endsWith("/icons/nav/")),
  }));
}

function isProductItemActive(item, path) {
  if (item.activeMatch === "community") {
    return !path.startsWith("/admin");
  }

  try {
    const itemUrl = new URL(item.href, window.location.origin);
    return itemUrl.origin === window.location.origin && path === itemUrl.pathname;
  } catch {
    return false;
  }
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

function ensureProductNav() {
  const body = document.body;
  const sections = document.querySelectorAll(
    ".sidebar-wrapper .sidebar-sections, .sidebar-container .sidebar-sections, .hamburger-panel .sidebar-sections, .sidebar-hamburger-dropdown .sidebar-sections"
  );
  const enabled =
    !!settings.match_webapp_sidebar &&
    !body?.classList.contains("admin-interface") &&
    (body?.classList.contains("has-sidebar-page") || sections.length > 0);

  document
    .querySelectorAll(".two-way-product-nav")
    .forEach((node) => node.remove());

  body?.classList.remove("two-way-product-nav-enabled");

  if (!enabled) {
    return;
  }

  const groups = getProductNavGroups();

  if (!groups.length) {
    return;
  }

  const currentPath = window.location.pathname;

  sections.forEach((section) => {
    const productNav = document.createElement("nav");
    productNav.className = "two-way-product-nav";
    productNav.setAttribute("aria-label", "2Way navigation");

    groups.forEach((group) => {
      if (!group.items.length) {
        return;
      }

      const groupNode = document.createElement("section");
      groupNode.className = "two-way-product-nav__group";

      const label = document.createElement("p");
      label.className = "two-way-product-nav__label";
      label.textContent = group.label;
      groupNode.appendChild(label);

      const list = document.createElement("div");
      list.className = "two-way-product-nav__items";

      group.items.forEach((item) => {
        const link = document.createElement("a");
        link.className = "two-way-product-nav__link";
        link.href = item.href;

        if (isProductItemActive(item, currentPath)) {
          link.classList.add("is-active");
        }

        const iconWrap = document.createElement("span");
        iconWrap.className = "two-way-product-nav__icon";

        const icon = document.createElement("img");
        icon.className = "two-way-product-nav__icon-image";
        icon.alt = "";
        icon.src = item.iconSrc;
        icon.loading = "lazy";

        iconWrap.appendChild(icon);
        link.appendChild(iconWrap);

        const text = document.createElement("span");
        text.className = "two-way-product-nav__text";
        text.textContent = item.label;
        link.appendChild(text);

        list.appendChild(link);
      });

      groupNode.appendChild(list);
      productNav.appendChild(groupNode);
    });

    const anchor = section.querySelector(".two-way-sidebar-brand");

    if (anchor?.nextSibling) {
      section.insertBefore(productNav, anchor.nextSibling);
    } else if (section.firstChild) {
      section.insertBefore(productNav, section.firstChild);
    } else {
      section.appendChild(productNav);
    }
  });

  body?.classList.add("two-way-product-nav-enabled");
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
    ensureProductNav();
    ensureHeaderContext();
  });
}

export default apiInitializer("1.8.0", (api) => {
  const maybeRefreshAfterSidebarToggle = (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (
      !target.closest(
        "[aria-label='Navigation menu'], .btn-sidebar-toggle, .header-sidebar-toggle, .sidebar-hamburger-dropdown"
      )
    ) {
      return;
    }

    window.setTimeout(() => refreshShell(), 40);
    window.setTimeout(() => refreshShell(), 180);
  };

  api.onPageChange(() => {
    refreshShell();
  });

  refreshShell();
  window.addEventListener("resize", refreshShell);
  document.addEventListener("click", maybeRefreshAfterSidebarToggle, true);
});
