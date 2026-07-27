(function () {
  const SUPPORTED = new Set(["en", "de"]);

  function normalize(code) {
    const lang = (code || "").split("-")[0].toLowerCase();
    return SUPPORTED.has(lang) ? lang : null;
  }

  function fromHtml() {
    return normalize(document.documentElement.lang);
  }

  function fromSwitcher() {
    const pressed = [
      ...document.querySelectorAll('[role="group"] button[aria-pressed="true"]'),
    ]
      .map((btn) => normalize(btn.textContent?.trim()))
      .filter(Boolean);
    // Prefer majority / first pressed that matches html when switchers disagree
    if (pressed.length === 0) return null;
    const html = fromHtml();
    if (html && pressed.includes(html)) return html;
    return pressed[0];
  }

  function getLanguage() {
    // html[lang] is set by React i18n effect — authoritative after switch
    return fromHtml() || fromSwitcher() || "en";
  }

  function isGerman() {
    return getLanguage() === "de";
  }

  const ACTIVE =
    "bg-[#143a6f] text-[#faf5ea]";
  const INACTIVE_LIGHT =
    "text-[#0a0a0a] hover:bg-[#f2c849]";
  const INACTIVE_DARK =
    "text-[#faf5ea] hover:bg-[#143a6f]";

  function switcherVariant(group) {
    return group.className.includes("border-[#faf5ea]") ? "dark" : "light";
  }

  function syncSwitcherActive(lang) {
    document.querySelectorAll('[role="group"]').forEach((group) => {
      const dark = switcherVariant(group) === "dark";
      // Match homepage LanguageSwitcher: fixed height so h-full buttons are not squashed
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
        const border =
          btn.previousElementSibling
            ? dark
              ? "border-l-[3px] border-[#faf5ea] "
              : "border-l-[3px] border-black "
            : "";
        const state = on
          ? ACTIVE
          : dark
            ? INACTIVE_DARK
            : INACTIVE_LIGHT;
        btn.className =
          `px-3 h-full font-black uppercase tracking-[0.14em] text-[11px] transition-colors duration-100 ${border}${state}`;
      });
    });
  }

  const langListeners = new Set();
  let lastLang = getLanguage();
  let groupObserver = null;
  let htmlObserver = null;

  function notifyLanguageChange() {
    const lang = getLanguage();
    if (lang === lastLang) return;
    lastLang = lang;
    syncSwitcherActive(lang);
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
          const code = normalize(btn.textContent?.trim());
          if (!code) return;
          // Optimistic UI — React may lag / mis-detect active via `in` array bug
          document.documentElement.lang = code;
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
