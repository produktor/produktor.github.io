(function () {
  const LINK = "https://git.produktor.io/";

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

  function findRackContainer() {
    const tape = [...document.querySelectorAll("span")].find(
      (s) => (s.textContent || "").trim().toUpperCase() === "PILOT · STACK",
    );
    return tape?.closest("div")?.parentElement || null;
  }

  function isPatched(container) {
    if (!container) return false;
    if (container.querySelector('a[href^="https://git.produktor.io"]')) return true;
    return (container.innerText || "").toUpperCase().includes("STACK REPO");
  }

  function apply() {
    const container = findRackContainer();
    if (!container) return;
    if (isPatched(container)) return;

    const list = container.querySelector(".space-y-3");
    if (!list) return;

    const template = [...list.querySelectorAll("a")].at(-1) || null;
    if (!template) return;

    const row = template.cloneNode(true);
    row.setAttribute("href", LINK);
    row.setAttribute("target", "_blank");
    row.setAttribute("rel", "noopener noreferrer");
    row.setAttribute("aria-label", "Stack Repo · git.produktor.io");

    row.className = row.className
      .replace(/\bbg-\[[^\]]+\]\b/g, "")
      .replace(/\btext-\[[^\]]+\]\b/g, "")
      .replace(/\btext-#\[[^\]]+\]\b/g, "")
      .replace(/\btext-\[#faf5ea\]\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!row.className.includes("bg-[#faf5ea]")) row.className += " bg-[#faf5ea]";
    row.className = row.className.replace(/\btext-\[#faf5ea\]\b/g, "");

    const number = row.querySelector("span.opacity-65");
    if (number) number.textContent = "04";

    const title = row.querySelector("span.tracking-tight");
    if (title) title.textContent = "Stack Repo";

    const host = row.querySelector("span.font-mono");
    if (host) host.textContent = "git.produktor.io";

    list.appendChild(row);
  }

  async function mount() {
    try {
      await waitFor("section");
      const run = () => apply();
      if (window.pkWatchPatch) {
        window.pkWatchPatch(run, { done: () => isPatched(findRackContainer()) });
      } else {
        run();
      }
    } catch (err) {
      console.warn("[produktor stack-repo]", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();

