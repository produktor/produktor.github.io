(function () {
  function fromSwitcher() {
    const btn = document.querySelector('[role="group"] button[aria-pressed="true"]');
    const code = btn?.textContent?.trim().toLowerCase();
    if (code === "de" || code === "en") return code;
    return null;
  }

  function getLanguage() {
    const switched = fromSwitcher();
    if (switched) return switched;
    const htmlLang = (document.documentElement.lang || "").split("-")[0].toLowerCase();
    if (htmlLang === "de" || htmlLang === "en") return htmlLang;
    return "en";
  }

  function isGerman() {
    return getLanguage() === "de";
  }

  const langListeners = new Set();
  let lastLang = getLanguage();
  let groupObserver = null;

  function notifyLanguageChange() {
    const lang = getLanguage();
    if (lang === lastLang) return;
    lastLang = lang;
    langListeners.forEach((callback) => callback(lang));
  }

  function onLanguageChange(callback) {
    langListeners.add(callback);
    callback(getLanguage());
  }

  function watchLanguageSwitcher() {
    const group = document.querySelector('[role="group"]');
    if (!group || group.dataset.pkLangWatch === "1") return;

    group.dataset.pkLangWatch = "1";
    groupObserver = new MutationObserver(() => notifyLanguageChange());
    groupObserver.observe(group, {
      attributes: true,
      subtree: true,
      attributeFilter: ["aria-pressed"],
    });

    group.addEventListener(
      "click",
      (event) => {
        if (event.target.closest("button")) {
          queueMicrotask(notifyLanguageChange);
        }
      },
      true,
    );
  }

  function boot() {
    watchLanguageSwitcher();
    if (document.querySelector('[role="group"]')) return;

    const bootObserver = new MutationObserver(() => {
      watchLanguageSwitcher();
      if (document.querySelector('[role="group"]')) bootObserver.disconnect();
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
