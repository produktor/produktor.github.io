(function () {
  const SUPPORTED = new Set(["en", "de"]);
  const KEYS = window.pkLangKeys || [
    "pk-lang",
    "i18nextLng",
    "pk-module-lang",
    "pk-imprint-lang",
  ];

  // Capture boot helpers before we overwrite the same window names.
  const bootPersist =
    typeof window.pkPersistLanguage === "function" ? window.pkPersistLanguage : null;
  const bootPreferred =
    typeof window.pkPreferredLanguage === "function" ? window.pkPreferredLanguage : null;
  const bootNormalize =
    typeof window.pkNormalizeLang === "function" ? window.pkNormalizeLang : null;

  function normalize(code) {
    if (bootNormalize) return bootNormalize(code);
    const lang = (code || "").split("-")[0].toLowerCase();
    return SUPPORTED.has(lang) ? lang : null;
  }

  function fromQuery() {
    try {
      const q = new URLSearchParams(location.search);
      return normalize(q.get("lng") || q.get("lang"));
    } catch (e) {
      return null;
    }
  }

  function fromStorage() {
    for (const key of KEYS) {
      try {
        const v = normalize(localStorage.getItem(key));
        if (v) return v;
      } catch (e) {}
    }
    return null;
  }

  function fromHtml() {
    return normalize(document.documentElement.lang);
  }

  function fromSwitcher() {
    const pressed = [
      ...document.querySelectorAll('[role="group"] button[aria-pressed="true"]'),
    ]
      .map((btn) => normalize(btn.textContent?.trim()) || normalize(btn.dataset.lang))
      .filter(Boolean);
    if (pressed.length === 0) return null;
    const html = fromHtml();
    if (html && pressed.includes(html)) return html;
    return pressed[0];
  }

  function persistLanguage(code) {
    const lang = normalize(code);
    if (!lang) return null;
    if (bootPersist) {
      bootPersist(lang);
    } else {
      try {
        KEYS.forEach((key) => localStorage.setItem(key, lang));
      } catch (e) {}
      document.documentElement.lang = lang;
    }
    return lang;
  }

  function preferredLanguage() {
    if (bootPreferred) return bootPreferred();
    return fromQuery() || fromStorage() || fromHtml() || "en";
  }

  function getLanguage() {
    // After boot / switch: html[lang] + storage stay in sync.
    return fromHtml() || fromStorage() || fromSwitcher() || "en";
  }

  function isGerman() {
    return getLanguage() === "de";
  }

  const ACTIVE = "bg-[#143a6f] text-[#faf5ea]";
  const INACTIVE_LIGHT = "text-[#0a0a0a] hover:bg-[#f2c849]";
  const INACTIVE_DARK = "text-[#faf5ea] hover:bg-[#143a6f]";

  function switcherVariant(group) {
    return group.className.includes("border-[#faf5ea]") ? "dark" : "light";
  }

  function syncSwitcherActive(lang) {
    document.querySelectorAll('[role="group"]').forEach((group) => {
      // Never rewrite React-owned switchers inside #root — causes removeChild crashes.
      if (group.closest("#root")) return;

      const dark = switcherVariant(group) === "dark";
      if (!dark) {
        group.classList.add("inline-flex", "items-stretch", "h-9", "border-[3px]", "border-black");
        if (!group.className.includes("bg-[")) group.classList.add("bg-[#faf5ea]");
      }
      group.querySelectorAll("button").forEach((btn) => {
        const code = normalize(btn.textContent?.trim()) || normalize(btn.dataset.lang);
        if (!code) return;
        const on = code === lang;
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        if (!btn.dataset.lang) btn.dataset.lang = code;
        const border = btn.previousElementSibling
          ? dark
            ? "border-l-[3px] border-[#faf5ea] "
            : "border-l-[3px] border-black "
          : "";
        const state = on ? ACTIVE : dark ? INACTIVE_DARK : INACTIVE_LIGHT;
        btn.className = `px-3 h-full font-black uppercase tracking-[0.14em] text-[11px] transition-colors duration-100 ${border}${state}`;
      });
    });
  }

  const langListeners = new Set();
  let lastLang = null;
  let groupObserver = null;
  let htmlObserver = null;

  function notifyLanguageChange() {
    const lang = getLanguage();
    if (lang === lastLang) return;
    lastLang = lang;
    persistLanguage(lang);
    syncSwitcherActive(lang);
    if (window.pkSyncBrandTaglines) window.pkSyncBrandTaglines(lang);
    langListeners.forEach((callback) => callback(lang));
  }

  function onLanguageChange(callback) {
    langListeners.add(callback);
    callback(getLanguage());
  }

  function watchLanguageSwitcher() {
    const groups = document.querySelectorAll('[role="group"]');
    if (!groups.length) return false;

    groups.forEach((group) => {
      if (group.dataset.pkLangWatch === "1") return;
      group.dataset.pkLangWatch = "1";
      group.addEventListener(
        "click",
        (event) => {
          const btn = event.target.closest("button");
          if (!btn) return;
          const code =
            normalize(btn.dataset.lang) || normalize(btn.textContent?.trim());
          if (!code) return;
          persistLanguage(code);
          lastLang = null;
          queueMicrotask(notifyLanguageChange);
          setTimeout(notifyLanguageChange, 50);
          setTimeout(notifyLanguageChange, 200);
        },
        true,
      );
    });

    if (!groupObserver) {
      groupObserver = new MutationObserver(() => notifyLanguageChange());
      groups.forEach((group) => {
        groupObserver.observe(group, {
          attributes: true,
          subtree: true,
          attributeFilter: ["aria-pressed", "class"],
        });
      });
    }

    syncSwitcherActive(getLanguage());
    return true;
  }

  function watchHtmlLang() {
    if (htmlObserver) return;
    htmlObserver = new MutationObserver(() => notifyLanguageChange());
    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });
  }

  function boot() {
    const initial = preferredLanguage();
    persistLanguage(initial);
    lastLang = initial;
    syncSwitcherActive(initial);

    watchHtmlLang();
    if (watchLanguageSwitcher()) return;

    const bootObserver = new MutationObserver(() => {
      if (watchLanguageSwitcher()) bootObserver.disconnect();
    });
    bootObserver.observe(document.body, { childList: true, subtree: true });
  }

  window.pkGetLanguage = getLanguage;
  window.pkIsGerman = isGerman;
  window.pkOnLanguageChange = onLanguageChange;
  window.pkPersistLanguage = persistLanguage;
  window.pkPreferredLanguage = preferredLanguage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
