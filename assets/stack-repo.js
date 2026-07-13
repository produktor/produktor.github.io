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

    const tokens = (row.className || "")
      .split(/\s+/)
      .filter(Boolean)
      .filter((t) => !t.startsWith("bg-["))
      .filter((t) => !t.startsWith("text-["));
    row.className = tokens.join(" ");
    row.classList.add("bg-[#faf5ea]");

    const number = row.querySelector("span.opacity-65");
    if (number) number.textContent = "04";

    const mainIcon = row.querySelector("div.flex.items-center.gap-3 svg");
    if (mainIcon) {
      mainIcon.outerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-git-branch size-4 stroke-[3] shrink-0" aria-hidden="true"><line x1="6" x2="6" y1="3" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>';
    }

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

