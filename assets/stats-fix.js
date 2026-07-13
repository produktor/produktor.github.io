(function () {
  const VALUE = "5+";

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

  function labelsForLanguage() {
    return isGerman()
      ? ["Vor-Ort-Installationen", "On-prem installs"]
      : ["On-prem installs", "Vor-Ort-Installationen"];
  }

  function isPatched() {
    const section = document.querySelector("section.bg-\\[\\#143a6f\\]");
    if (!section) return false;

    const labels = labelsForLanguage();
    for (const grid of section.querySelectorAll(".grid")) {
      for (const block of grid.children) {
        const labelEl = block.querySelector(".text-\\[11px\\], .text-xs");
        const valueEl = block.querySelector(".font-black.text-2xl, .font-black.text-3xl");
        if (!labelEl || !valueEl) continue;
        const label = (labelEl.textContent || "").trim();
        if (!labels.some((candidate) => label.includes(candidate))) continue;
        return valueEl.textContent === VALUE;
      }
    }
    return false;
  }

  function patchStats() {
    if (isPatched()) return;

    const section = document.querySelector("section.bg-\\[\\#143a6f\\]");
    if (!section) return;

    const labels = labelsForLanguage();
    for (const grid of section.querySelectorAll(".grid")) {
      for (const block of grid.children) {
        const labelEl = block.querySelector(".text-\\[11px\\], .text-xs");
        const valueEl = block.querySelector(".font-black.text-2xl, .font-black.text-3xl");
        if (!labelEl || !valueEl) continue;
        const label = (labelEl.textContent || "").trim();
        if (!labels.some((candidate) => label.includes(candidate))) continue;
        if (valueEl.textContent !== VALUE) valueEl.textContent = VALUE;
      }
    }
  }

  async function mount() {
    try {
      await waitFor("section");
      window.pkWatchPatch(patchStats, { done: isPatched });
    } catch (err) {
      console.warn("[produktor stats-fix]", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
