(function () {
  // Order must match DOM section order on the landing page.
  // Team is injected after #contact (before footer); FAQ precedes contact.
  const NAV_ITEMS = [
    { href: "#products", labelEn: "Stack", labelDe: "Stack" },
    { href: "#how-it-works", labelEn: "Install", labelDe: "Installation" },
    { href: "#compare", labelEn: "Compare", labelDe: "Vergleich" },
    { href: "#pricing", labelEn: "Pricing", labelDe: "Preise" },
    { href: "#faq", labelEn: "FAQ", labelDe: "FAQ" },
    { href: "#team", labelEn: "Team", labelDe: "Team" },
  ];

  const LINK_BASE =
    "px-3 py-2 text-sm font-bold transition-colors duration-100";
  const LINK_IDLE = "text-[#0a0a0a] hover:bg-[#f2c849]";
  const LINK_ACTIVE = "bg-[#143a6f] text-[#faf5ea]";

  let activeHref = "";
  let sectionObserver = null;
  let hashScrollToken = 0;

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
      header.querySelector('nav[data-pk-nav="1"]') ||
      header.querySelector("nav.hidden.md\\:flex") ||
      header.querySelector("nav") ||
      null
    );
  }

  function linkClass(href) {
    const on = href && href === activeHref;
    return `${LINK_BASE} ${on ? LINK_ACTIVE : LINK_IDLE}`;
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

  function applyActiveStyles(mainNav) {
    if (!mainNav) return;
    mainNav.querySelectorAll(":scope > a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      link.className = linkClass(href);
      link.setAttribute("aria-current", href === activeHref ? "true" : "false");
    });
  }

  function setActiveHref(href) {
    if (href === activeHref) return;
    activeHref = href || "";
    const header = document.querySelector("header");
    const mainNav = header && findMainNav(header);
    applyActiveStyles(mainNav);
  }

  function hideSignIn() {
    const header = document.querySelector("header");
    if (!header) return;
    let hasSignIn = false;
    header.querySelectorAll("button[type='button']").forEach((button) => {
      const label = button.textContent?.trim();
      if (label === "Sign in" || label === "Anmelden") {
        // Hide — do not removeChild (React owns these nodes).
        button.hidden = true;
        button.setAttribute("aria-hidden", "true");
        button.style.display = "none";
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
        el.hidden = true;
        el.setAttribute("aria-hidden", "true");
        el.style.display = "none";
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

    // Hide extra navs — never remove (React owns the tree).
    header.querySelectorAll("nav").forEach((nav) => {
      if (nav !== mainNav && nav.dataset.pkNav !== "1") {
        nav.hidden = true;
        nav.setAttribute("aria-hidden", "true");
        nav.style.display = "none";
      }
    });

    const de = isGerman();
    const links = [...mainNav.querySelectorAll(":scope > a")];

    // Prefer in-place updates so React keeps the same <a> nodes.
    if (links.length === NAV_ITEMS.length) {
      NAV_ITEMS.forEach((item, index) => {
        const link = links[index];
        if (!link) return;
        if (link.getAttribute("href") !== item.href) link.setAttribute("href", item.href);
        const label = de ? item.labelDe : item.labelEn;
        if (link.textContent !== label) link.textContent = label;
        link.className = linkClass(item.href);
        link.setAttribute(
          "aria-current",
          item.href === activeHref ? "true" : "false",
        );
      });
      return navIsCorrect(mainNav, de);
    }

    // Structure mismatch: hide React nav, mount our own sibling (outside React ownership).
    let pkNav = header.querySelector('nav[data-pk-nav="1"]');
    if (!pkNav) {
      pkNav = document.createElement("nav");
      pkNav.dataset.pkNav = "1";
      pkNav.className = mainNav.className || "hidden md:flex items-center gap-1";
      mainNav.insertAdjacentElement("afterend", pkNav);
    }
    mainNav.hidden = true;
    mainNav.setAttribute("aria-hidden", "true");
    mainNav.style.display = "none";
    pkNav.hidden = false;
    pkNav.removeAttribute("aria-hidden");
    pkNav.style.display = "";
    pkNav.replaceChildren(
      ...NAV_ITEMS.map((item) => {
        const link = document.createElement("a");
        link.href = item.href;
        link.className = linkClass(item.href);
        link.textContent = de ? item.labelDe : item.labelEn;
        link.setAttribute(
          "aria-current",
          item.href === activeHref ? "true" : "false",
        );
        return link;
      }),
    );
    return navIsCorrect(pkNav, de);
  }

  function sectionIdFromHref(href) {
    return (href || "").replace(/^#/, "");
  }

  function watchSections() {
    const targets = NAV_ITEMS.map((item) =>
      document.getElementById(sectionIdFromHref(item.href)),
    ).filter(Boolean);

    if (!targets.length) return false;

    if (sectionObserver) {
      sectionObserver.disconnect();
      sectionObserver = null;
    }

    const ratios = new Map();
    sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        // Prefer later section in DOM when ratios tie (content order).
        let bestId = "";
        let bestRatio = 0;
        let bestIndex = -1;
        targets.forEach((el, index) => {
          const ratio = ratios.get(el.id) || 0;
          if (ratio > bestRatio || (ratio === bestRatio && ratio > 0 && index > bestIndex)) {
            bestRatio = ratio;
            bestId = el.id;
            bestIndex = index;
          }
        });
        if (bestId) setActiveHref(`#${bestId}`);
      },
      {
        root: null,
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    targets.forEach((el) => sectionObserver.observe(el));
    return targets.length === NAV_ITEMS.length;
  }

  function bootSectionWatch() {
    if (watchSections()) return;
    const bootObserver = new MutationObserver(() => {
      if (watchSections()) bootObserver.disconnect();
    });
    bootObserver.observe(document.body, { childList: true, subtree: true });
  }

  function consumeScrollIntent() {
    try {
      const id = sessionStorage.getItem("pkScrollTo");
      if (id) {
        sessionStorage.removeItem("pkScrollTo");
        if (!location.hash || location.hash === "#") {
          history.replaceState(null, "", `#${id}`);
        }
      }
    } catch (e) {}
  }

  function scrollToHash() {
    consumeScrollIntent();
    const hash = location.hash || "";
    if (!hash || hash === "#") return;
    const id = decodeURIComponent(hash.slice(1));
    if (!id || !/^[A-Za-z][\w:-]*$/.test(id)) return;

    const token = ++hashScrollToken;
    setActiveHref(`#${id}`);

    waitFor(`#${CSS.escape(id)}`, 20000)
      .then((el) => {
        if (token !== hashScrollToken) return;
        const go = () => {
          if (token !== hashScrollToken) return;
          el.scrollIntoView({ behavior: "auto", block: "start" });
          setActiveHref(`#${id}`);
        };
        requestAnimationFrame(() => {
          go();
          setTimeout(go, 50);
          setTimeout(go, 250);
          setTimeout(go, 800);
        });
      })
      .catch(() => {});
  }

  async function mount() {
    try {
      await waitFor("header nav");
      const sync = () => {
        fixHeaderNav();
        hideSignIn();
        hideBookDemo();
      };
      window.pkWatchPatch(sync, {
        root: document.querySelector("header") || document.body,
        done: isDone,
      });
      bootSectionWatch();
      if (window.pkOnLanguageChange) {
        window.pkOnLanguageChange(() => {
          fixHeaderNav();
        });
      }
      window.addEventListener(
        "hashchange",
        () => {
          scrollToHash();
        },
        { passive: true },
      );
      // After React paint + late patches (team)
      scrollToHash();
      setTimeout(scrollToHash, 100);
      setTimeout(scrollToHash, 600);
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
