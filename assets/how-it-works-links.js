(function () {
  function isGerman() {
    const lang = document.documentElement.lang || "";
    if (lang.startsWith("de")) return true;
    return /Installationsmethode|Architektur-Audit|Vollständigen Ablauf/i.test(
      document.querySelector("#how-it-works")?.textContent || "",
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

  function applyExamples(section, data) {
    const de = isGerman();

    const cta = section.querySelector('a[href="#contact"]');
    if (cta && data.overview?.url) {
      cta.href = data.overview.url;
      cta.target = "_blank";
      cta.rel = "noopener noreferrer";
      const label = de ? data.overview.labelDe : data.overview.labelEn;
      if (label) {
        const textNode = [...cta.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = label;
        else cta.insertBefore(document.createTextNode(label), cta.firstChild);
      }
    }

    const articles = section.querySelectorAll("article");
    data.steps.forEach((step, index) => {
      const article = articles[index];
      if (!article || article.querySelector(".pk-hiw__example")) return;

      const link = document.createElement("a");
      link.href = step.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className =
        "pk-hiw__example mt-4 inline-flex items-center gap-2 font-black uppercase tracking-[0.12em] text-[11px] sm:text-xs text-[#143a6f] hover:underline underline-offset-4";
      link.textContent = de ? step.labelDe : step.labelEn;
      article.appendChild(link);
    });
  }

  async function mount() {
    try {
      const [section, response] = await Promise.all([
        waitFor("#how-it-works"),
        fetch("data/how-it-works-examples.json"),
      ]);
      if (!response.ok) throw new Error(`how-it-works-examples.json ${response.status}`);
      const data = await response.json();
      applyExamples(section, data);

      new MutationObserver(() => applyExamples(section, data)).observe(section, {
        childList: true,
        subtree: true,
        characterData: true,
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
