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
    return window.pkIsGerman ? window.pkIsGerman() : false;
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

  function hideSignIn() {
    const header = document.querySelector("header");
    if (!header) return;
    let hasSignIn = false;
    header.querySelectorAll("button[type='button']").forEach((button) => {
      const label = button.textContent?.trim();
      if (label === "Sign in" || label === "Anmelden") {
        button.remove();
        hasSignIn = true;
      }
    });
    if (!hasSignIn || header.dataset.pkSignInHidden !== "1") {
      header.dataset.pkSignInHidden = "1";
    }
  }

  function hideBookDemo() {
    const header = document.querySelector("header");
    if (!header) return;
    if (header.dataset.pkBookDemoHidden === "1") return;

    let removed = false;
    header.querySelectorAll("a, button").forEach((el) => {
      const label = el.textContent?.trim();
      if (label === "Book a demo" || label === "Demo buchen") {
        el.remove();
        removed = true;
      }
    });

    if (removed) header.dataset.pkBookDemoHidden = "1";
  }

  function isDone() {
    const header = document.querySelector("header");
    const mainNav = header && findMainNav(header);
    return Boolean(
      mainNav &&
        navIsCorrect(mainNav, isGerman()) &&
        header?.dataset.pkSignInHidden === "1" &&
        header?.dataset.pkBookDemoHidden === "1",
    );
  }

  function fixHeaderNav() {
    const header = document.querySelector("header");
    if (!header) return false;

    const mainNav = findMainNav(header);
    if (!mainNav) return false;

    header.querySelectorAll("nav").forEach((nav) => {
      if (nav !== mainNav) nav.remove();
    });

    const de = isGerman();
    if (navIsCorrect(mainNav, de)) return true;

    const sample = mainNav.querySelector("a") || header.querySelector("a[href^='#']");
    const className = sample?.className || LINK_CLASS;

    mainNav.replaceChildren(
      ...NAV_ITEMS.map((item) => {
        const link = document.createElement("a");
        link.href = item.href;
        link.className = className;
        link.textContent = de ? item.labelDe : item.labelEn;
        if (item.external) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        return link;
      }),
    );
    return navIsCorrect(mainNav, de);
  }

  async function mount() {
    try {
      await waitFor("header nav");
      const sync = () => {
        fixHeaderNav();
        hideSignIn();
        hideBookDemo();
      };
      window.pkWatchPatch(sync, { root: document.querySelector("header") || document.body, done: isDone });
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
