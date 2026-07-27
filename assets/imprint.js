(function () {
  const ROOT = document.getElementById("pk-imprint-root");
  let data = null;

  function preferredLang() {
    const stored = localStorage.getItem("pk-imprint-lang");
    if (stored === "en" || stored === "de") return stored;
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return nav === "de" ? "de" : "en";
  }

  function setLangButtons(lang) {
    document.querySelectorAll(".pk-imprint__lang").forEach((btn) => {
      const on = btn.dataset.lang === lang;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render(lang) {
    if (!data || !ROOT) return;
    const c = data[lang] || data.en;
    const labels = c.labels;
    const s = c.sections;
    document.documentElement.lang = lang;
    document.title = c.pageTitle;
    localStorage.setItem("pk-imprint-lang", lang);
    // sync after DOM updated below
    const syncFooter = () => {
      setLangButtons(lang);
      if (window.pkMountSiteFooter) window.pkMountSiteFooter();
    };

    const addressLines = data.correspondence?.lines || [];
    const addressHtml = addressLines.length
      ? `<dt>${escapeHtml(labels.address)}</dt><dd>${addressLines.map((line) => escapeHtml(line)).join("<br />")}</dd>`
      : "";

    const team = (data.team || [])
      .map((member) => {
        const memberRole = lang === "de" ? member.roleDe : member.roleEn;
        return `<li class="font-bold text-[15px] leading-snug"><span class="font-black">${escapeHtml(member.name)}</span><br /><span class="text-[#0a0a0a]/70 text-sm">${escapeHtml(memberRole)}</span></li>`;
      })
      .join("");

    ROOT.innerHTML = `
      <div class="inline-flex items-center gap-3 mb-6">
        <span class="inline-flex items-center justify-center size-9 border-[3px] border-black bg-[#f2c849] text-[#0a0a0a] font-black text-sm">§</span>
        <span class="text-[11px] sm:text-xs font-black uppercase tracking-[0.18em]">${escapeHtml(c.kicker)}</span>
      </div>
      <h1 class="font-black uppercase tracking-tight text-4xl sm:text-5xl leading-[1.02] m-0">${escapeHtml(c.title)}</h1>
      <p class="mt-5 text-[15px] sm:text-[17px] leading-relaxed text-[#0a0a0a]/80 max-w-2xl">${escapeHtml(c.lead)}</p>

      <div class="mt-10 border-[3px] border-black bg-white shadow-[6px_6px_0_0_#0a0a0a] p-6 sm:p-8 space-y-0">
        <section>
          <h2 class="m-0 font-black uppercase tracking-tight text-xl sm:text-2xl">${escapeHtml(s.provider)}</h2>
          <dl class="mt-4">
            <dt>${escapeHtml(labels.legalName)}</dt>
            <dd>${escapeHtml(data.legalName)}</dd>
            <dt>${escapeHtml(labels.tradeName)}</dt>
            <dd>${escapeHtml(data.tradeName)}</dd>
            ${addressHtml}
          </dl>
        </section>

        <section>
          <h2 class="m-0 font-black uppercase tracking-tight text-xl sm:text-2xl">${escapeHtml(s.contact)}</h2>
          <dl class="mt-4">
            <dt>${escapeHtml(labels.email)}</dt>
            <dd><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></dd>
            <dt>${escapeHtml(labels.web)}</dt>
            <dd><a href="${escapeHtml(data.website)}">${escapeHtml(String(data.website || "").replace(/^https?:\/\//, ""))}</a></dd>
          </dl>
        </section>

        <section>
          <h2 class="m-0 font-black uppercase tracking-tight text-xl sm:text-2xl">${escapeHtml(s.team)}</h2>
          <ul class="mt-4 mb-0 pl-0 list-none space-y-4">${team}</ul>
        </section>

        <section>
          <h2 class="m-0 font-black uppercase tracking-tight text-xl sm:text-2xl">${escapeHtml(s.register)}</h2>
          <p class="mt-4 mb-0 text-[15px] leading-relaxed text-[#0a0a0a]/85">${escapeHtml(s.registerBody)}</p>
        </section>

        <section>
          <h2 class="m-0 font-black uppercase tracking-tight text-xl sm:text-2xl">${escapeHtml(s.dispute)}</h2>
          <p class="mt-4 mb-2 text-[15px] leading-relaxed text-[#0a0a0a]/85">${escapeHtml(s.disputeBody)}</p>
          <p class="m-0"><a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a></p>
          <p class="mt-3 mb-0 text-[14px] leading-relaxed text-[#0a0a0a]/75">${escapeHtml(s.disputeNote)}</p>
        </section>

        <section>
          <h2 class="m-0 font-black uppercase tracking-tight text-xl sm:text-2xl">${escapeHtml(s.liability)}</h2>
          <p class="mt-4 mb-0 text-[15px] leading-relaxed text-[#0a0a0a]/85">${escapeHtml(s.liabilityBody)}</p>
        </section>

        <section>
          <h2 class="m-0 font-black uppercase tracking-tight text-xl sm:text-2xl">${escapeHtml(s.copyright)}</h2>
          <p class="mt-4 mb-0 text-[15px] leading-relaxed text-[#0a0a0a]/85">${escapeHtml(s.copyrightBody)}</p>
        </section>
      </div>

      <p class="mt-10">
        <a href="/" class="pk-imprint__cta pk-press inline-flex items-center justify-center gap-2 px-5 h-12 border-[3px] border-black bg-[#143a6f] text-[#faf5ea] font-black uppercase tracking-wide text-sm no-underline shadow-[4px_4px_0_0_#0a0a0a] hover:shadow-[2px_2px_0_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100">${escapeHtml(s.back)}</a>
      </p>
    `;
    syncFooter();
  }

  async function mount() {
    try {
      const res = await fetch("/data/imprint.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`imprint.json ${res.status}`);
      data = await res.json();
      render(preferredLang());
      document.querySelectorAll(".pk-imprint__lang").forEach((btn) => {
        btn.addEventListener("click", () => render(btn.dataset.lang));
      });
    } catch (err) {
      if (ROOT) ROOT.innerHTML = `<p class="font-bold text-red-800">Failed to load imprint.</p>`;
      console.warn("[produktor imprint]", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
