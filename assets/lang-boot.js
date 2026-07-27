/** Sync language into all storage keys before React/i18n boots. */
(function () {
  var KEYS = ["pk-lang", "i18nextLng", "pk-module-lang", "pk-imprint-lang"];
  var SUPPORTED = { en: 1, de: 1 };

  function normalize(code) {
    var lang = String(code || "")
      .split("-")[0]
      .toLowerCase();
    return SUPPORTED[lang] ? lang : null;
  }

  function fromQuery() {
    try {
      var q = new URLSearchParams(location.search);
      return normalize(q.get("lng") || q.get("lang"));
    } catch (e) {
      return null;
    }
  }

  function fromStorage() {
    for (var i = 0; i < KEYS.length; i++) {
      try {
        var v = normalize(localStorage.getItem(KEYS[i]));
        if (v) return v;
      } catch (e) {}
    }
    return null;
  }

  function persist(lang) {
    if (!normalize(lang)) return;
    try {
      for (var i = 0; i < KEYS.length; i++) localStorage.setItem(KEYS[i], lang);
    } catch (e) {}
    document.documentElement.lang = lang;
  }

  var lang = fromQuery() || fromStorage() || normalize(document.documentElement.lang);
  if (lang) persist(lang);

  window.pkLangKeys = KEYS;
  window.pkNormalizeLang = normalize;
  window.pkPersistLanguage = persist;
  window.pkPreferredLanguage = function () {
    return fromQuery() || fromStorage() || normalize(document.documentElement.lang) || "en";
  };
})();
