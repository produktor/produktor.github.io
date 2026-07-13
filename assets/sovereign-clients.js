(function () {
  const PLACEHOLDER_LOGOS = /NULSPACE|HELION|ORBIT|ZEPHYR|PARABOLA|ARC LABS|MERIDIAN|GENESIS|WAVERLY/;

  function isGerman() {
    return window.pkIsGerman ? window.pkIsGerman() : false;
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
    const byId = document.getElementById("sovereign-clients");
    if (byId) return byId;
    for (const section of document.querySelectorAll("section")) {
      if (PLACEHOLDER_LOGOS.test(section.textContent || "")) return section;
    }
    return null;
  }

  function renderClients(grid, data, de) {
    grid.className =
      "pk-sovereign__grid flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3";

    grid.innerHTML = data.clients
      .map((client) => {
        const tag = de ? client.tagDe : client.tagEn;
        const featured = client.featured
          ? " shadow-[6px_6px_0_0_#f2c849] ring-2 ring-[#f2c849]/40"
          : "";
        const cardClass = `pk-sovereign__card border-[3px] border-black bg-[#faf5ea] text-[#0a0a0a] px-4 py-4 flex flex-col gap-1.5${featured}`;
        const inner = `
            <span class="pk-sovereign__title font-black uppercase text-[13px] sm:text-sm tracking-[0.08em] leading-tight text-[#0a0a0a]">${client.name}</span>
            <span class="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#0a0a0a]/65 leading-snug">${tag}</span>`;

        if (client.onPrem || !client.url) {
          return `<div class="${cardClass} pk-sovereign__card--onprem" aria-label="${client.name}">${inner}</div>`;
        }

        return `
          <a
            href="${client.url}"
            target="_blank"
            rel="noopener noreferrer"
            class="${cardClass} transition-shadow hover:shadow-[6px_6px_0_0_#f2c849]"
          >${inner}</a>`;
      })
      .join("");
  }

  function isPatched(section, data, de) {
    const lang = de ? "de" : "en";
    if (section.getAttribute("data-pk-sovereign") !== lang) return false;
    const grid = section.querySelector(".pk-sovereign__grid");
    const first = data.clients[0]?.name;
    return Boolean(grid && first && grid.textContent.includes(first));
  }

  function applyTrustStrip(section, data) {
    const de = isGerman();
    if (isPatched(section, data, de)) return;

    section.id = "sovereign-clients";
    section.setAttribute("data-pk-sovereign", de ? "de" : "en");

    const kicker = section.querySelector(".text-\\[11px\\].uppercase.font-black");
    const kickerText = de ? data.kickerDe : data.kickerEn;
    if (kicker && kicker.textContent !== kickerText) kicker.textContent = kickerText;

    const headline = kicker?.parentElement?.querySelector(".font-black.uppercase.tracking-tight");
    const headlineText = de ? data.headlineDe : data.headlineEn;
    if (headline && headline.innerHTML !== headlineText) headline.innerHTML = headlineText;

    const grid =
      section.querySelector(".pk-sovereign__grid") ||
      [...section.querySelectorAll(".grid")].find((el) =>
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

      window.pkWatchPatch(run, {
        done: () => {
          const section = findTrustSection();
          return Boolean(section && isPatched(section, data, isGerman()));
        },
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
