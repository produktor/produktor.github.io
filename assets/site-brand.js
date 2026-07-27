(function () {
  const TAGLINE = {
    en: "On-Premise Suite",
    de: "On-Premise-Suite",
  };

  function langKey(lang) {
    if (lang === "de" || lang === "en") return lang;
    if (window.pkPreferredLanguage) return window.pkPreferredLanguage();
    const doc = (document.documentElement.lang || "").slice(0, 2).toLowerCase();
    if (doc === "de" || doc === "en") return doc;
    try {
      for (const key of ["pk-lang", "i18nextLng", "pk-module-lang", "pk-imprint-lang"]) {
        const stored = localStorage.getItem(key);
        if (stored === "de" || stored === "en") return stored;
      }
    } catch (e) {}
    return "en";
  }

  function logoSvg(size) {
    const s = Number(size) || 32;
    return (
      `<svg width="${s}" height="${s}" viewBox="0 0 40 48" fill="none" aria-hidden="true">` +
      `<path d="M3 4 H37 V24 C37 32.5 31.5 39 20 46 C8.5 39 3 32.5 3 24 Z" fill="#143a6f" stroke="#0a0a0a" stroke-width="3" stroke-linejoin="miter"/>` +
      `<path d="M11 22 L17 28 L29 16" stroke="#f2c849" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter" fill="none"/>` +
      `</svg>`
    );
  }

  function taglineFor(lang) {
    return TAGLINE[langKey(lang)] || TAGLINE.en;
  }

  /** Same brand mark as homepage header (shield + produktor.io + suite tagline). */
  function brandLinkHtml(options) {
    const opts = options || {};
    const size = opts.size ?? 32;
    const lang = langKey(opts.lang);
    const tagline = taglineFor(lang);
    const brandClass = opts.brandClass || "font-black uppercase tracking-tight text-base sm:text-lg";
    const tagClass =
      opts.tagClass || "text-[10px] uppercase tracking-[0.22em] text-[#0a0a0a]/70 mt-1";
    return (
      `<a href="/" class="flex items-center gap-3 group no-underline text-inherit">` +
      logoSvg(size) +
      `<span class="leading-none">` +
      `<span class="block ${brandClass}">produktor.io</span>` +
      `<span class="block ${tagClass}" data-pk-brand-tagline>${tagline}</span>` +
      `</span></a>`
    );
  }

  function syncBrandTaglines(lang) {
    const text = taglineFor(lang);
    document.querySelectorAll("[data-pk-brand-tagline]").forEach((el) => {
      el.textContent = text;
    });
  }

  window.pkBrandLogoSvg = logoSvg;
  window.pkBrandTagline = taglineFor;
  window.pkBrandLinkHtml = brandLinkHtml;
  window.pkSyncBrandTaglines = syncBrandTaglines;
})();
