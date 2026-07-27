(function () {
  const ICONS = {
    crm: '<svg class="pk-mod__icon stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>',
    chat: '<svg class="pk-mod__icon stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/></svg>',
    meet: '<svg class="pk-mod__icon stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>',
    service:
      '<svg class="pk-mod__icon stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>',
    geo: '<svg class="pk-mod__icon stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    ai: '<svg class="pk-mod__icon stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4 12H2"/><path d="M22 12h-2"/><path d="M19.78 4.22l-2.83 2.83"/><path d="M7.05 16.95l-2.83 2.83"/><path d="M19.78 19.78l-2.83-2.83"/><path d="M7.05 7.05 4.22 4.22"/><path d="M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10Z"/></svg>',
    ui: '<svg class="pk-mod__icon stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
  };

  const ARROW =
    '<svg class="size-4 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  let catalog = null;

  function slugFromPath() {
    const parts = location.pathname.replace(/\/+$/, "").split("/");
    const idx = parts.lastIndexOf("modules");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].toLowerCase();
    const meta = document.querySelector('meta[name="pk-module-slug"]');
    return (meta?.content || "").toLowerCase();
  }

  function preferredLang() {
    const stored = localStorage.getItem("pk-module-lang");
    if (stored === "en" || stored === "de") return stored;
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return nav === "de" ? "de" : "en";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function list(items) {
    return (items || [])
      .map(
        (item) =>
          `<li class="flex items-start gap-2.5 text-[14px] sm:text-[15px] leading-snug"><span class="mt-1.5 size-2 shrink-0 bg-[#143a6f] border border-black"></span><span>${escapeHtml(item)}</span></li>`,
      )
      .join("");
  }

  function setLangButtons(lang) {
    document.querySelectorAll(".pk-mod__lang").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
    });
  }

  function render(lang) {
    const slug = slugFromPath();
    const mod = (catalog.modules || []).find((m) => m.slug === slug);
    const root = document.getElementById("pk-mod-root");
    if (!mod || !root) {
      if (root) {
        root.innerHTML = `<div class="max-w-3xl mx-auto px-5 py-20"><h1 class="font-black text-3xl">Module not found</h1><p class="mt-4"><a href="/" class="font-bold underline">Home</a></p></div>`;
      }
      return;
    }

    const ui = catalog.ui[lang] || catalog.ui.en;
    const c = mod[lang] || mod.en;
    const others = (catalog.modules || []).filter((m) => m.slug !== slug);
    document.documentElement.lang = lang;
    document.title = `${c.name} — produktor.io`;
    localStorage.setItem("pk-module-lang", lang);

    const icon = ICONS[mod.icon] || ICONS.crm;
    const replaces = (c.replaces || []).map(escapeHtml).join(" · ");

    const otherCards = others
      .map((m) => {
        const oc = m[lang] || m.en;
        return `
          <a href="/modules/${escapeHtml(m.slug)}/" class="border-[3px] border-black bg-white shadow-[4px_4px_0_0_#0a0a0a] p-5 no-underline text-inherit hover:shadow-[2px_2px_0_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100">
            <div class="font-black uppercase tracking-[0.18em] text-[10px] text-[#0a0a0a]/55">${escapeHtml(ui.kicker)} · ${escapeHtml(m.code)}</div>
            <div class="mt-2 font-black uppercase tracking-tight text-xl">${escapeHtml(oc.name)}</div>
            <div class="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#0a0a0a]/65">${escapeHtml(oc.tag)}</div>
          </a>`;
      })
      .join("");

    root.innerHTML = `
      <header class="sticky top-0 z-40 border-b-[3px] border-black bg-[#faf5ea]/95 backdrop-blur-sm">
        <div class="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-4">
          ${
            window.pkBrandLinkHtml
              ? window.pkBrandLinkHtml({ size: 32, lang })
              : `<a href="/" class="flex items-center gap-3 group no-underline text-inherit"><span class="font-black uppercase tracking-tight text-base sm:text-lg">produktor.io</span></a>`
          }
          <div class="flex items-center gap-2 sm:gap-3">
            <div class="inline-flex border-[3px] border-black" role="group" aria-label="Language">
              <button type="button" data-lang="en" class="pk-mod__lang px-3 h-10 font-black uppercase tracking-[0.14em] text-[11px]">EN</button>
              <button type="button" data-lang="de" class="pk-mod__lang px-3 h-10 font-black uppercase tracking-[0.14em] text-[11px] border-l-[3px] border-black">DE</button>
            </div>
            <a href="/products/" class="hidden sm:inline-flex items-center px-4 h-10 border-[3px] border-black font-bold text-sm hover:bg-[#143a6f] hover:text-[#faf5ea] no-underline">${escapeHtml(ui.backHome)}</a>
          </div>
        </div>
      </header>

      <section class="relative bg-[#143a6f] text-[#faf5ea] border-b-[3px] border-black overflow-hidden">
        <div class="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div class="max-w-3xl">
            <div class="inline-flex items-center gap-3 mb-6">
              <span class="inline-flex items-center justify-center size-9 border-[3px] border-[#faf5ea] bg-[#f2c849] text-[#0a0a0a] font-black text-sm">${escapeHtml(mod.code)}</span>
              <span class="text-[11px] sm:text-xs font-black uppercase tracking-[0.18em]">${escapeHtml(ui.kicker)}</span>
            </div>
            <h1 class="font-black uppercase tracking-tight text-[40px] sm:text-[56px] lg:text-[68px] leading-[0.95] m-0">
              <span class="inline-block bg-[#f2c849] text-[#0a0a0a] px-3 sm:px-4 py-1 border-[3px] border-black">${escapeHtml(c.titleHighlight)}</span>
              ${escapeHtml(c.titleRest)}
            </h1>
            <p class="mt-6 text-[15px] sm:text-[17px] leading-relaxed text-[#faf5ea]/85 max-w-2xl">${escapeHtml(c.lead)}</p>
            <div class="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-[#faf5ea]/70">${escapeHtml(ui.replaces)}: ${replaces}</div>
            <div class="mt-8 flex flex-wrap gap-3">
              <a href="${escapeHtml(mod.liveDemoUrl)}" target="_blank" rel="noopener noreferrer" class="pk-press inline-flex items-center justify-center gap-2 px-5 h-12 border-[3px] border-black bg-[#f2c849] text-[#0a0a0a] font-black uppercase tracking-wide text-sm no-underline shadow-[4px_4px_0_0_#0a0a0a] hover:shadow-[2px_2px_0_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100">${escapeHtml(ui.liveDemo)} ${ARROW}</a>
              <a href="/contact/" class="pk-mod__cta-ghost pk-press inline-flex items-center justify-center gap-2 px-5 h-12 border-[3px] border-white bg-transparent text-white font-black uppercase tracking-wide text-sm no-underline shadow-[4px_4px_0_0_#0a0a0a] hover:shadow-[2px_2px_0_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 hover:bg-[#f2c849] hover:text-[#0a0a0a] hover:border-black">${escapeHtml(ui.contactCta)}</a>
            </div>
          </div>
        </div>
        <div aria-hidden="true" class="absolute bottom-0 left-0 right-0 h-2 bg-[#f2c849]"></div>
      </section>

      <section class="bg-[#faf5ea] border-b-[3px] border-black">
        <div class="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20 grid lg:grid-cols-12 gap-10">
          <div class="lg:col-span-4">
            <div class="border-[3px] border-black ${escapeHtml(mod.accent)} flex items-center justify-center aspect-square max-w-[220px]">${icon}</div>
            <p class="mt-5 text-sm font-bold uppercase tracking-[0.1em] text-[#0a0a0a]/65">${escapeHtml(c.tag)}</p>
          </div>
          <div class="lg:col-span-8">
            <h2 class="m-0 font-black uppercase tracking-tight text-2xl sm:text-3xl">${escapeHtml(ui.overview)}</h2>
            <p class="mt-4 text-[15px] sm:text-[16px] leading-relaxed text-[#0a0a0a]/85">${escapeHtml(c.overview)}</p>
          </div>
        </div>
      </section>

      <section class="bg-white border-b-[3px] border-black">
        <div class="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20 grid md:grid-cols-3 gap-10">
          <div>
            <h2 class="m-0 font-black uppercase tracking-[0.14em] text-[12px] text-[#0a0a0a]/65">${escapeHtml(ui.features)}</h2>
            <ul class="mt-4 space-y-2.5 list-none p-0 m-0">${list(c.features)}</ul>
          </div>
          <div>
            <h2 class="m-0 font-black uppercase tracking-[0.14em] text-[12px] text-[#0a0a0a]/65">${escapeHtml(ui.useCases)}</h2>
            <ul class="mt-4 space-y-2.5 list-none p-0 m-0">${list(c.useCases)}</ul>
          </div>
          <div>
            <h2 class="m-0 font-black uppercase tracking-[0.14em] text-[12px] text-[#0a0a0a]/65">${escapeHtml(ui.deploy)}</h2>
            <ul class="mt-4 space-y-2.5 list-none p-0 m-0">${list(c.deploy)}</ul>
          </div>
        </div>
      </section>

      <section class="bg-[#efe6cf] border-b-[3px] border-black">
        <div class="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
          <h2 class="m-0 font-black uppercase tracking-tight text-2xl sm:text-3xl text-[#143a6f]">${escapeHtml(ui.otherModules)}</h2>
          <div class="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${otherCards}</div>
          <div class="mt-10 flex flex-wrap gap-3">
            <a href="/contact/" class="pk-mod__cta-primary pk-press inline-flex items-center justify-center gap-2 px-5 h-12 border-[3px] border-black bg-[#143a6f] text-white font-black uppercase tracking-wide text-sm no-underline shadow-[4px_4px_0_0_#0a0a0a] hover:shadow-[2px_2px_0_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100">${escapeHtml(ui.contactCta)} ${ARROW}</a>
            <a href="/products/" class="pk-press inline-flex items-center justify-center gap-2 px-5 h-12 border-[3px] border-black bg-[#faf5ea] text-[#0a0a0a] font-black uppercase tracking-wide text-sm no-underline shadow-[4px_4px_0_0_#0a0a0a] hover:shadow-[2px_2px_0_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100">${escapeHtml(ui.backHome)}</a>
          </div>
        </div>
      </section>
    `;

    setLangButtons(lang);
    root.querySelectorAll(".pk-mod__lang").forEach((btn) => {
      btn.addEventListener("click", () => render(btn.dataset.lang));
    });
  }

  async function mount() {
    try {
      const res = await fetch("/data/modules.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`modules.json ${res.status}`);
      catalog = await res.json();
      render(preferredLang());
    } catch (err) {
      const root = document.getElementById("pk-mod-root");
      if (root) root.innerHTML = `<p class="p-10 font-bold text-red-800">Failed to load module.</p>`;
      console.warn("[produktor module-page]", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
