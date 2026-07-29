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

  function findReactLogoGrid(section) {
    return [...section.querySelectorAll(".grid")].find(
      (el) =>
        !el.classList.contains("pk-sovereign__grid") &&
        PLACEHOLDER_LOGOS.test(el.textContent || ""),
    );
  }

  function hideReactNode(node) {
    if (!node) return;
    node.hidden = true;
    node.setAttribute("aria-hidden", "true");
    node.style.display = "none";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cardHtml(client, de) {
    const tag = de ? client.tagDe : client.tagEn;
    const featured = client.featured
      ? " shadow-[6px_6px_0_0_#f2c849] ring-2 ring-[#f2c849]/40"
      : "";
    const cardClass = `pk-sovereign__card border-[3px] border-black bg-[#faf5ea] text-[#0a0a0a] px-4 py-4 flex flex-col gap-1.5${featured}`;
    const name = escapeHtml(client.name);
    const tagSafe = escapeHtml(tag);
    const links = Array.isArray(client.links) ? client.links.filter((l) => l && l.href) : [];

    const title = `<span class="pk-sovereign__title font-black uppercase text-[13px] sm:text-sm tracking-[0.08em] leading-tight text-[#0a0a0a]">${name}</span>`;
    const tagLine = `<span class="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#0a0a0a]/65 leading-snug">${tagSafe}</span>`;
    const linksHtml =
      links.length > 1
        ? `<span class="pk-sovereign__links mt-0.5 flex flex-wrap gap-x-2 gap-y-1">${links
            .map(
              (l) =>
                `<a href="${escapeHtml(l.href)}" target="_blank" rel="noopener noreferrer" class="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] text-[#143a6f] underline underline-offset-2 hover:text-[#0a0a0a]">${escapeHtml(l.label || l.href)}</a>`,
            )
            .join("")}</span>`
        : "";

    if (client.onPrem || !client.url) {
      return `<div class="${cardClass} pk-sovereign__card--onprem" aria-label="${name}">${title}${tagLine}${linksHtml}</div>`;
    }

    if (links.length > 1) {
      return `<div class="${cardClass}" aria-label="${name}"><a href="${escapeHtml(client.url)}" target="_blank" rel="noopener noreferrer" class="no-underline text-inherit hover:underline">${title}${tagLine}</a>${linksHtml}</div>`;
    }

    return `
          <a
            href="${escapeHtml(client.url)}"
            target="_blank"
            rel="noopener noreferrer"
            class="${cardClass} transition-shadow hover:shadow-[6px_6px_0_0_#f2c849]"
          >${title}${tagLine}</a>`;
  }

  function ensurePkGrid(section) {
    let grid = section.querySelector(".pk-sovereign__grid");
    if (grid) return grid;

    grid = document.createElement("div");
    grid.className =
      "pk-sovereign__grid flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3";

    const reactGrid = findReactLogoGrid(section);
    if (reactGrid) {
      hideReactNode(reactGrid);
      reactGrid.insertAdjacentElement("afterend", grid);
    } else {
      section.appendChild(grid);
    }
    return grid;
  }

  function renderClients(grid, data, de) {
    // Only touch our pk-owned grid — never React children.
    const holder = document.createElement("div");
    holder.innerHTML = data.clients.map((client) => cardHtml(client, de)).join("");
    grid.replaceChildren(...holder.children);
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

    // Prefer overlay copy on pk-owned nodes only; soft-update React text as last resort.
    const kicker = section.querySelector(".text-\\[11px\\].uppercase.font-black");
    const kickerText = de ? data.kickerDe : data.kickerEn;
    if (kicker && kicker.textContent !== kickerText) kicker.textContent = kickerText;

    const headline = kicker?.parentElement?.querySelector(".font-black.uppercase.tracking-tight");
    const headlineText = de ? data.headlineDe : data.headlineEn;
    if (headline && headline.innerHTML !== headlineText) headline.innerHTML = headlineText;

    const reactGrid = findReactLogoGrid(section);
    hideReactNode(reactGrid);

    const grid = ensurePkGrid(section);
    renderClients(grid, data, de);
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
