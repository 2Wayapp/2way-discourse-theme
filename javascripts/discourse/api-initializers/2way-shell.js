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

function enabledModulesFor(currentUser) {
  const fieldName = (settings.module_access_field || "").trim();

  if (!fieldName) {
    return null;
  }

  const rawValue =
    currentUser?.custom_fields?.[fieldName] ??
    currentUser?.customFields?.[fieldName] ??
    null;

  if (!rawValue) {
    return null;
  }

  if (Array.isArray(rawValue)) {
    return new Set(rawValue.map((value) => String(value).trim()).filter(Boolean));
  }

  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();

    if (!trimmed) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return new Set(parsed.map((value) => String(value).trim()).filter(Boolean));
      }
    } catch {
      // fall back to comma-delimited parsing
    }

    return new Set(
      trimmed
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    );
  }

  return null;
}

function getProductNavGroups(currentUser) {
  const webappBase = normalizeBaseUrl(settings.webapp_url);
  const formsUrl = (settings.forms_url || "").trim();
  const formsLabel = (settings.forms_label || "Forms").trim() || "Forms";
  const enabledModules = enabledModulesFor(currentUser);

  if (!webappBase && !formsUrl) {
    return [];
  }

  const icon = (name) => joinUrl(webappBase, `/icons/nav/${name}`);

  return [
    {
      label: "CORE",
      items: [
        { label: "Activity Feed", href: joinUrl(webappBase, "/"), iconSrc: icon("feeds.png"), module: "feeds" },
        {
          label: "Emergency Contacts",
          href: joinUrl(webappBase, "/emergency"),
          iconSrc: icon("emergency.png"),
          module: "emergency",
        },
      ],
    },
    {
      label: "CONTENT",
      items: [
        { label: "News", href: joinUrl(webappBase, "/newsletters"), iconSrc: icon("newsletter.svg"), module: "newsletter" },
        { label: "Journals", href: joinUrl(webappBase, "/journals"), iconSrc: icon("journal.png"), module: "journal" },
        { label: "Events", href: joinUrl(webappBase, "/events"), iconSrc: icon("event.png"), module: "event" },
        { label: "Reports", href: joinUrl(webappBase, "/reports"), iconSrc: icon("report.png"), module: "report" },
        { label: "Surveys", href: joinUrl(webappBase, "/surveys"), iconSrc: icon("survey.png"), module: "survey" },
        {
          label: formsLabel,
          href: formsUrl || joinUrl(webappBase, "/forms"),
          iconSrc: (settings.forms_icon_url || "").trim() || icon("default.svg"),
          module: "form",
        },
      ],
    },
    {
      label: "DIRECTORY",
      items: [
        { label: "Members", href: joinUrl(webappBase, "/board-staff"), iconSrc: icon("members.png"), module: "members" },
        { label: "Contacts", href: joinUrl(webappBase, "/contacts"), iconSrc: icon("contact.png"), module: "contact" },
        {
          label: "Destination",
          href: joinUrl(webappBase, "/destinations"),
          iconSrc: icon("destination.png"),
          module: "destination",
        },
      ],
    },
    {
      label: "RESOURCES",
      items: [
        { label: "Documents", href: joinUrl(webappBase, "/documents"), iconSrc: icon("document.png"), module: "document" },
        { label: "Deals & Discounts", href: joinUrl(webappBase, "/deals"), iconSrc: icon("deals.svg"), module: "deals" },
      ],
    },
    {
      label: "FORUM",
      items: [{ label: "Forum", href: "/latest", iconSrc: icon("chat.svg"), activeMatch: "community", module: "forum" }],
    },
  ].map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        item.href &&
        !item.href.endsWith("/icons/nav/") &&
        (!enabledModules || item.module === "forum" || enabledModules.has(item.module))
    ),
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

  const currentUser = getCurrentUserRecord(api);
  const groups = getProductNavGroups(currentUser);

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

function getCurrentUserRecord(api) {
  if (typeof api.getCurrentUser === "function") {
    return api.getCurrentUser();
  }

  return window.Discourse?.__container__?.lookup?.("service:current-user") || null;
}

function avatarUrlFor(currentUser, size = 72) {
  const template =
    currentUser?.avatar_template ||
    currentUser?.avatarTemplate ||
    currentUser?.user_avatar_template;

  if (!template || typeof template !== "string") {
    return "";
  }

  return template.replace("{size}", String(size));
}

function initialsFor(currentUser) {
  const value =
    currentUser?.name?.trim() ||
    currentUser?.username?.trim() ||
    "2W";

  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function secondaryProfileText(currentUser) {
  const title = currentUser?.title?.trim();

  if (title) {
    return title;
  }

  if (currentUser?.admin) {
    return "Administrator";
  }

  if (currentUser?.moderator) {
    return "Moderator";
  }

  return currentUser?.username || "Member";
}

function handleSidebarLogout(event) {
  event.preventDefault();

  const csrfToken =
    document.querySelector("meta[name='csrf-token']")?.getAttribute("content") || "";

  fetch("/session/logout", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "X-CSRF-Token": csrfToken,
      "X-Requested-With": "XMLHttpRequest",
    },
  }).finally(() => {
    window.location.assign("/");
  });
}

function closeSidebarMenus() {
  document
    .querySelectorAll(".two-way-sidebar-footer__menu-toggle[aria-expanded='true']")
    .forEach((node) => node.setAttribute("aria-expanded", "false"));

  document
    .querySelectorAll(".two-way-sidebar-footer__menu")
    .forEach((node) => {
      node.hidden = true;
    });
}

function ensureSidebarFooter(api) {
  const body = document.body;
  const sections = document.querySelectorAll(
    ".sidebar-wrapper .sidebar-sections, .sidebar-container .sidebar-sections, .hamburger-panel .sidebar-sections, .sidebar-hamburger-dropdown .sidebar-sections"
  );
  const enabled =
    !!settings.match_webapp_sidebar &&
    !body?.classList.contains("admin-interface") &&
    (body?.classList.contains("has-sidebar-page") || sections.length > 0);

  document
    .querySelectorAll(".two-way-sidebar-footer")
    .forEach((node) => node.remove());

  if (!enabled) {
    return;
  }

  const currentUser = getCurrentUserRecord(api);
  const username = currentUser?.username;

  if (!currentUser || !username) {
    return;
  }

  const profileUrl = `/u/${username}/summary`;
  const avatarUrl = avatarUrlFor(currentUser);
  const displayName = currentUser.name?.trim() || username;
  const secondaryText = secondaryProfileText(currentUser);
  const initials = initialsFor(currentUser);

  sections.forEach((section) => {
    const footer = document.createElement("div");
    footer.className = "two-way-sidebar-footer";
    footer.innerHTML = `
      <div class="two-way-sidebar-footer__inner">
        <a class="two-way-sidebar-footer__profile" href="${profileUrl}" aria-label="View profile">
          <span class="two-way-sidebar-footer__avatar">
            ${
              avatarUrl
                ? `<img class="two-way-sidebar-footer__avatar-image" alt="${displayName}" src="${avatarUrl}">`
                : `<span class="two-way-sidebar-footer__avatar-fallback">${initials}</span>`
            }
          </span>
          <span class="two-way-sidebar-footer__meta">
            <span class="two-way-sidebar-footer__name">${displayName}</span>
            <span class="two-way-sidebar-footer__secondary">${secondaryText}</span>
          </span>
        </a>
        <div class="two-way-sidebar-footer__actions">
          <button class="two-way-sidebar-footer__menu-toggle" type="button" aria-label="More options" aria-expanded="false">
            <span class="material-icons-round">more_vert</span>
          </button>
          <div class="two-way-sidebar-footer__menu" hidden>
            <a class="two-way-sidebar-footer__menu-item" href="${profileUrl}">
              <span class="material-icons-round">person</span>
              <span>Profile</span>
            </a>
            <button class="two-way-sidebar-footer__menu-item two-way-sidebar-footer__logout" type="button">
              <span class="material-icons-round">logout</span>
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const toggle = footer.querySelector(".two-way-sidebar-footer__menu-toggle");
    const menu = footer.querySelector(".two-way-sidebar-footer__menu");
    const logoutButton = footer.querySelector(".two-way-sidebar-footer__logout");

    toggle?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      if (menu) {
        menu.hidden = expanded;
      }
    });

    logoutButton?.addEventListener("click", handleSidebarLogout);

    section.appendChild(footer);
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

function refreshShell(api) {
  requestAnimationFrame(() => {
    ensureSidebarBrand();
    ensureProductNav();
    ensureHeaderContext();
    ensureSidebarFooter(api);
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

    window.setTimeout(() => refreshShell(api), 40);
    window.setTimeout(() => refreshShell(api), 180);
  };

  api.onPageChange(() => {
    refreshShell(api);
  });

  refreshShell(api);
  window.addEventListener("resize", () => refreshShell(api));
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest(".two-way-sidebar-footer__actions")) {
      closeSidebarMenus();
    }
  });
  document.addEventListener("click", maybeRefreshAfterSidebarToggle, true);
});
