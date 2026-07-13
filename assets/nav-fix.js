(function () {
  const NAV_ITEMS = [
    { href: "#products", labelEn: "Stack", labelDe: "Stack" },
    { href: "#how-it-works", labelEn: "Install", labelDe: "Installation" },
    { href: "#compare", labelEn: "Compare", labelDe: "Vergleich" },
    { href: "#pricing", labelEn: "Pricing", labelDe: "Preise" },
    { href: "#team", labelEn: "Team", labelDe: "Team" },
    { href: "#faq", labelEn: "FAQ", labelDe: "FAQ" },
  ];

  const LINK_CLASS =
    "px-3 py-2 text-sm font-bold text-[#0a0a0a] hover:bg-[#f2c849] transition-colors";

  function isGerman() {
    const lang = document.documentElement.lang || "";
    if (lang.startsWith("de")) return true;
    return /Installationsmethode|Vergleich|Preise|Demo buchen/i.test(
      document.querySelector("header")?.textContent || "",
    );
  }

  function waitFor(selector, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const found = document.querySelector(selector);
      if (found) {
        resolve(found);
        return;
      }
      const started = Date.now();
      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        } else if (Date.now() - started > timeoutMs) {
          observer.disconnect();
          reject(new Error(`timeout: ${selector}`));
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  function findMainNav(header) {
    return (
      header.querySelector("nav.hidden.md\\:flex") ||
      header.querySelector("nav") ||
      null
    );
  }

  function navIsCorrect(mainNav, de) {
    const links = [...mainNav.querySelectorAll(":scope > a")];
    if (links.length !== NAV_ITEMS.length) return false;
    return NAV_ITEMS.every((item, index) => {
      const link = links[index];
      return (
        link?.getAttribute("href") === item.href &&
        link.textContent === (de ? item.labelDe : item.labelEn)
      );
    });
  }

  function fixHeaderNav() {
    const header = document.querySelector("header");
    if (!header) return;

    const mainNav = findMainNav(header);
    if (!mainNav) return;

    // Remove duplicate <nav> blocks injected by the old Team-link bug.
    header.querySelectorAll("nav").forEach((nav) => {
      if (nav !== mainNav) nav.remove();
    });

    const de = isGerman();
    if (navIsCorrect(mainNav, de)) return;
    const sample = mainNav.querySelector("a") || header.querySelector("a[href^='#']");
    const className = sample?.className || LINK_CLASS;

    mainNav.replaceChildren(
      ...NAV_ITEMS.map((item) => {
        const link = document.createElement("a");
        link.href = item.href;
        link.className = className;
        link.textContent = de ? item.labelDe : item.labelEn;
        return link;
      }),
    );
  }

  async function mount() {
    try {
      await waitFor("header nav");
      fixHeaderNav();
      new MutationObserver(fixHeaderNav).observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    } catch (err) {
      console.warn("[produktor nav-fix]", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
