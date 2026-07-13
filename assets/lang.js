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

  function onLanguageChange(callback) {
    const run = () => callback(getLanguage());
    document.addEventListener(
      "click",
      (event) => {
        if (event.target.closest('[role="group"] button')) {
          queueMicrotask(run);
          setTimeout(run, 0);
          setTimeout(run, 50);
        }
      },
      true,
    );
    const observer = new MutationObserver(run);
    const watch = () => {
      document.querySelectorAll('[role="group"]').forEach((group) => {
        observer.observe(group, {
          attributes: true,
          subtree: true,
          attributeFilter: ["aria-pressed"],
        });
      });
    };
    watch();
    new MutationObserver(watch).observe(document.body, { childList: true, subtree: true });
  }

  window.pkGetLanguage = getLanguage;
  window.pkIsGerman = isGerman;
  window.pkOnLanguageChange = onLanguageChange;
})();
