(function () {
  const PLACEHOLDER_LOGOS = /NULSPACE|HELION|ORBIT|ZEPHYR|PARABOLA|ARC LABS|MERIDIAN|GENESIS|WAVERLY/;

  function isGerman() {
    const lang = document.documentElement.lang || "";
    if (lang.startsWith("de")) return true;
    return /Souverän|Souveräne|Installationsmethode|Vor-Ort-Installationen/i.test(
      document.body?.textContent || "",
    );
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

  function findTrustSection() {
    for (const section of document.querySelectorAll("section")) {
      if (PLACEHOLDER_LOGOS.test(section.textContent || "")) return section;
    }
    return null;
  }

  function renderClients(grid, data, de) {
    if (grid.dataset.pkSovereignDone === "1") return;
    grid.dataset.pkSovereignDone = "1";
    grid.className =
      "pk-sovereign__grid flex-1 grid sm:grid-cols-2 gap-3 max-w-3xl";

    grid.innerHTML = data.clients
      .map((client) => {
        const tag = de ? client.tagDe : client.tagEn;
        const featured = client.featured
          ? " shadow-[6px_6px_0_0_#f2c849] ring-2 ring-[#f2c849]/40"
          : "";
        return `
          <a
            href="${client.url}"
            target="_blank"
            rel="noopener noreferrer"
            class="border-[3px] border-black bg-[#faf5ea] text-[#0a0a0a] px-4 py-4 flex flex-col gap-1.5 transition-shadow hover:shadow-[6px_6px_0_0_#f2c849]${featured}"
          >
            <span class="font-black uppercase text-[13px] sm:text-sm tracking-[0.08em] leading-tight">${client.name}</span>
            <span class="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#0a0a0a]/65 leading-snug">${tag}</span>
          </a>`;
      })
      .join("");
  }

  function applyTrustStrip(section, data) {
    const de = isGerman();
    section.id = "sovereign-clients";

    const kicker = section.querySelector(".text-\\[11px\\].uppercase.font-black");
    if (kicker) kicker.textContent = de ? data.kickerDe : data.kickerEn;

    const headline = kicker?.parentElement?.querySelector(".font-black.uppercase.tracking-tight");
    if (headline) headline.textContent = de ? data.headlineDe : data.headlineEn;

    const grid = [...section.querySelectorAll(".grid")].find((el) =>
      PLACEHOLDER_LOGOS.test(el.textContent || ""),
    );
    if (grid) renderClients(grid, data, de);
  }

  async function mount() {
    try {
      await waitFor("section");
      const [response] = await Promise.all([fetch("data/sovereign-clients.json")]);
      if (!response.ok) throw new Error(`sovereign-clients.json ${response.status}`);
      const data = await response.json();

      const run = () => {
        const section = findTrustSection();
        if (section) applyTrustStrip(section, data);
      };

      run();
      new MutationObserver(run).observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    } catch (err) {
      console.warn("[produktor sovereign-clients]", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
