(function () {
  const LOGO =
    '<svg width="36" height="36" viewBox="0 0 40 48" fill="none" aria-hidden="true"><path d="M3 4 H37 V24 C37 32.5 31.5 39 20 46 C8.5 39 3 32.5 3 24 Z" fill="#143a6f" stroke="#0a0a0a" stroke-width="3" stroke-linejoin="miter"/><path d="M11 22 L17 28 L29 16" stroke="#f2c849" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter" fill="none"/></svg>';

  let footerData = null;
  let mounting = false;

  function isGerman() {
    if (window.pkIsGerman) return window.pkIsGerman();
    const lang = (document.documentElement.lang || "").slice(0, 2).toLowerCase();
    return lang === "de";
  }

  function copy() {
    const lang = isGerman() ? "de" : "en";
    return footerData[lang] || footerData.en;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildFooter() {
    const c = copy();
    const year = String(new Date().getFullYear());
    const copyright = (c.copyright || "").replace(/\{\{year\}\}|\{year\}/g, year);
    const brand = footerData.brand || "produktor.io";

    const columns = (c.columns || [])
      .map((col) => {
        const items = (col.items || [])
          .map((item) => {
            const href = item.href || "#";
            const label = escapeHtml(item.label);
            return `<li><a href="${escapeHtml(href)}">${label}</a></li>`;
          })
          .join("");
        return `
          <div class="lg:col-span-2">
            <div class="pk-site-footer__col-title">${escapeHtml(col.title)}</div>
            <ul class="mt-4 space-y-2.5 list-none p-0 m-0">${items}</ul>
          </div>`;
      })
      .join("");

    const footer = document.createElement("footer");
    footer.className = "pk-site-footer";
    footer.dataset.pkSiteFooter = "1";
    footer.dataset.pkLang = isGerman() ? "de" : "en";
    footer.innerHTML = `
      <div class="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div class="grid lg:grid-cols-12 gap-10">
          <div class="lg:col-span-5">
            <div class="flex items-center gap-3">
              <a href="/" class="inline-flex items-center gap-3 no-underline text-inherit">${LOGO}
                <span class="leading-none">
                  <span class="block font-black uppercase tracking-tight text-xl text-[#faf5ea]">${escapeHtml(brand)}</span>
                  <span class="block text-[11px] uppercase tracking-[0.22em] text-[#faf5ea]/70 mt-1">${escapeHtml(c.brandTagline)}</span>
                </span>
              </a>
            </div>
            <p class="mt-6 text-[14px] leading-relaxed text-[#faf5ea]/75 max-w-md m-0">${escapeHtml(c.lead)}</p>
            <div class="mt-6 inline-flex items-center gap-2 border-[3px] border-[#faf5ea] px-3 py-1.5">
              <span class="size-2 bg-[#7bfa63] border border-[#0a0a0a]"></span>
              <span class="font-black uppercase text-[11px] tracking-[0.18em]">${escapeHtml(c.systemsOk)}</span>
            </div>
          </div>
          ${columns}
        </div>
        <div class="pk-site-footer__meta">
          <span>${escapeHtml(copyright)}</span>
          <span class="font-black">${escapeHtml(c.tagline)}</span>
        </div>
      </div>`;

    footer.addEventListener("click", (event) => {
      const anchor = event.target.closest('a[href^="/#"]');
      if (!anchor) return;
      const id = (anchor.getAttribute("href") || "").replace(/^\/#/, "");
      if (!id) return;
      try {
        sessionStorage.setItem("pkScrollTo", id);
      } catch (e) {}
    });

    return footer;
  }

  function hideReactFooters() {
    const root = document.getElementById("root");
    if (!root) return;
    root.querySelectorAll("footer").forEach((footer) => {
      if (footer.dataset.pkSiteFooter === "1") return;
      footer.hidden = true;
      footer.setAttribute("aria-hidden", "true");
      footer.style.display = "none";
    });
  }

  function placeFooter(next) {
    hideReactFooters();

    let host = document.getElementById("pk-site-footer-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "pk-site-footer-host";
      document.body.appendChild(host);
    }

    const current = host.querySelector("footer[data-pk-site-footer='1']");
    if (
      current &&
      current.dataset.pkLang === next.dataset.pkLang &&
      current.innerHTML === next.innerHTML
    ) {
      return current;
    }
    host.replaceChildren(next);
    return next;
  }

  function apply() {
    if (!footerData) return null;
    return placeFooter(buildFooter());
  }

  function waitForBody() {
    return new Promise((resolve) => {
      if (document.body) {
        resolve();
        return;
      }
      document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
    });
  }

  async function mount() {
    if (mounting) return;
    mounting = true;
    try {
      await waitForBody();
      if (!footerData) {
        const res = await fetch("/data/footer.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`footer.json ${res.status}`);
        footerData = await res.json();
      }

      const sync = () => apply();
      sync();

      if (window.pkWatchPatch) {
        window.pkWatchPatch(sync, {
          root: document.body,
          done: () => {
            hideReactFooters();
            const f = document.querySelector("#pk-site-footer-host footer[data-pk-site-footer='1']");
            return Boolean(f && f.dataset.pkLang === (isGerman() ? "de" : "en"));
          },
        });
      }

      if (window.pkOnLanguageChange) {
        window.pkOnLanguageChange(() => sync());
      }

      const mo = new MutationObserver(() => {
        hideReactFooters();
        if (!document.querySelector("#pk-site-footer-host footer[data-pk-site-footer='1']")) {
          sync();
        }
      });
      // Only top-level body children — subtree observe fights React renders.
      mo.observe(document.body, { childList: true, subtree: false });
    } catch (err) {
      console.warn("[produktor site-footer]", err);
    } finally {
      mounting = false;
    }
  }

  window.pkMountSiteFooter = mount;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
