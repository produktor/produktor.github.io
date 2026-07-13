(function () {
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

  function isPatched(section, data) {
    const de = isGerman();
    const articles = section.querySelectorAll("article");
    if (articles.length < data.steps.length) return false;
    return data.steps.every((step, index) => {
      const link = articles[index]?.querySelector(".pk-hiw__example");
      const label = de ? step.labelDe : step.labelEn;
      return link && link.getAttribute("href") === step.url && link.textContent === label;
    });
  }

  function applyExamples(section, data) {
    if (isPatched(section, data)) return;

    const de = isGerman();

    const cta = section.querySelector('a[href="#contact"]');
    if (cta && data.overview?.url) {
      if (cta.getAttribute("href") !== data.overview.url) cta.href = data.overview.url;
      cta.target = "_blank";
      cta.rel = "noopener noreferrer";
      const label = de ? data.overview.labelDe : data.overview.labelEn;
      if (label) {
        const textNode = [...cta.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
        if (textNode) {
          if (textNode.textContent !== label) textNode.textContent = label;
        } else {
          cta.insertBefore(document.createTextNode(label), cta.firstChild);
        }
      }
    }

    const articles = section.querySelectorAll("article");
    data.steps.forEach((step, index) => {
      const article = articles[index];
      if (!article) return;

      let link = article.querySelector(".pk-hiw__example");
      if (!link) {
        link = document.createElement("a");
        link.className =
          "pk-hiw__example mt-4 inline-flex items-center gap-2 font-black uppercase tracking-[0.12em] text-[11px] sm:text-xs text-[#143a6f] hover:underline underline-offset-4";
        article.appendChild(link);
      }
      const label = de ? step.labelDe : step.labelEn;
      if (link.getAttribute("href") !== step.url) link.href = step.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      if (link.textContent !== label) link.textContent = label;
    });

    section.setAttribute("data-pk-hiw", de ? "de" : "en");
  }

  async function mount() {
    try {
      const [section, response] = await Promise.all([
        waitFor("#how-it-works"),
        fetch("data/how-it-works-examples.json"),
      ]);
      if (!response.ok) throw new Error(`how-it-works-examples.json ${response.status}`);
      const data = await response.json();

      const run = () => applyExamples(section, data);
      window.pkWatchPatch(run, {
        root: section,
        done: () => isPatched(section, data),
      });
    } catch (err) {
      console.warn("[produktor how-it-works]", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
