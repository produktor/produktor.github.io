(function () {
  const ICONS = {
    service:
      '<svg class="size-12 sm:size-14 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>',
    geo:
      '<svg class="size-12 sm:size-14 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  };

  const ARROW =
    '<svg class="size-4 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  const LIVE_ARROW =
    '<svg class="size-3.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

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

  function labelsFromSection(section) {
    const sample = section.querySelector("article a[href='#contact']");
    const moduleLabel =
      sample?.closest("article")?.querySelector(".tracking-\\[0\\.2em\\]")?.textContent?.split("·")[0]?.trim() ||
      "MODULE";
    const versionLabel =
      [...section.querySelectorAll("article .tracking-\\[0\\.2em\\]")].find((el) =>
        /v\d/i.test(el.textContent || ""),
      )?.textContent?.trim() || "v1";
    const moduleBrief = sample?.textContent?.replace(/\s+/g, " ").trim() || "Module brief";
    const liveDemo =
      section.querySelector("article a[target='_blank']")?.textContent?.replace(/\s+/g, " ").trim() ||
      "Live demo";
    return { moduleLabel, versionLabel, moduleBrief, liveDemo };
  }

  function renderCard(product, labels, de) {
    const name = de ? product.nameDe : product.nameEn;
    const tag = de ? product.tagDe : product.tagEn;
    const description = de ? product.descriptionDe : product.descriptionEn;
    const bullets = de ? product.bulletsDe : product.bulletsEn;
    const icon = ICONS[product.icon] || ICONS.service;

    const bulletHtml = bullets
      .map((item) => {
        const linked = item.replace(
          /git\.produktor\.io/g,
          '<a href="https://git.produktor.io/" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">git.produktor.io</a>',
        );
        return `<li class="flex items-start gap-2.5 text-[14px] leading-snug"><span class="mt-1.5 size-2 shrink-0 bg-[#143a6f] border border-black"></span><span>${linked}</span></li>`;
      })
      .join("");

    return `
      <article class="pk-product__extra border-[3px] border-black bg-white shadow-brutal p-6 flex flex-col" data-code="${product.code}">
        <div class="border-[3px] border-black ${product.accent} flex items-center justify-center aspect-[5/3]">${icon}</div>
        <div class="pt-5 flex items-center justify-between">
          <span class="font-black uppercase tracking-[0.2em] text-[11px] text-[#0a0a0a]/80">${labels.moduleLabel} · ${product.code}</span>
          <span class="font-black uppercase tracking-[0.2em] text-[11px] text-[#0a0a0a]/40">${labels.versionLabel}</span>
        </div>
        <h3 class="font-black uppercase tracking-tight text-2xl sm:text-3xl mt-2">${name}</h3>
        <p class="mt-1 text-sm font-bold uppercase tracking-[0.08em] text-[#0a0a0a]/65">${tag}</p>
        <p class="mt-4 text-[14px] sm:text-[15px] leading-relaxed text-[#0a0a0a]/80">${description}</p>
        <ul class="mt-5 space-y-2">${bulletHtml}</ul>
        <div class="mt-6 pt-5 border-t-[3px] border-black flex flex-wrap items-center justify-between gap-3">
          <a href="#contact" class="inline-flex items-center gap-2 font-black uppercase text-sm tracking-[0.12em] text-[#143a6f] hover:underline underline-offset-4">${labels.moduleBrief} ${ARROW}</a>
          <a href="${product.liveDemoUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-3 h-9 border-[3px] border-black bg-[#f2c849] text-[#0a0a0a] font-black uppercase text-[11px] sm:text-xs tracking-[0.12em] hover:shadow-[3px_3px_0_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100">${labels.liveDemo} ${LIVE_ARROW}</a>
        </div>
      </article>`;
  }

  function isPatched(section, data, de) {
    const lang = de ? "de" : "en";
    if (section.getAttribute("data-pk-products-extra") !== lang) return false;
    const first = data.products[0]?.nameEn;
    return Boolean(section.querySelector(".pk-product__extra") && section.textContent.includes(first));
  }

  function applyProducts(section, data) {
    const de = isGerman();
    if (isPatched(section, data, de)) return;

    const grid = section.querySelector(".grid");
    if (!grid) return;

    grid.className = "pk-products__grid mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6";

    const labels = labelsFromSection(section);
    const existing = [...grid.querySelectorAll("article")].filter(
      (node) => !node.classList.contains("pk-product__extra"),
    );
    const extras = data.products.map((product) => renderCard(product, labels, de)).join("");

    grid.innerHTML = existing.map((node) => node.outerHTML).join("") + extras;
    section.setAttribute("data-pk-products-extra", de ? "de" : "en");
  }

  function addFooterModuleLinks(footer, data) {
    const de = isGerman();
    const labels = de ? data.footerLinks.modulesDe : data.footerLinks.modulesEn;
    const stackMeet = [...footer.querySelectorAll("a")].find((a) =>
      /^stack meet$/i.test(a.textContent.trim()),
    );
    const list = stackMeet?.closest("ul");
    if (!list) return;

    const sample = list.querySelector("a");
    if (!sample) return;

    for (const label of labels) {
      if ([...list.querySelectorAll("a")].some((a) => a.textContent.trim() === label)) continue;
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = sample.className;
      link.textContent = label;
      if (label === "UI") {
        link.href = data.uiUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.href = "#products";
      }
      item.appendChild(link);
      list.appendChild(item);
    }
  }

  async function mount() {
    try {
      const [section, response] = await Promise.all([
        waitFor("#products"),
        fetch("data/products-extra.json"),
      ]);
      if (!response.ok) throw new Error(`products-extra.json ${response.status}`);
      const data = await response.json();

      const run = () => {
        applyProducts(section, data);
        const footer = document.querySelector("footer");
        if (footer) addFooterModuleLinks(footer, data);
      };

      const watch = window.pkWatchPatch || ((fn) => fn());
      watch(run, {
        root: section,
        done: () => isPatched(section, data, isGerman()),
      });

      const footer = await waitFor("footer");
      watch(
        () => addFooterModuleLinks(footer, data),
        {
          root: footer,
          done: () => {
            const labels = isGerman() ? data.footerLinks.modulesDe : data.footerLinks.modulesEn;
            return labels.every((label) =>
              [...footer.querySelectorAll("a")].some((a) => a.textContent.trim() === label),
            );
          },
        },
      );
    } catch (err) {
      console.warn("[produktor products-extra]", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
