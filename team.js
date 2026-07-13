(function () {
  const ARROW =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function initials(name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
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

  function addNavLink() {
    if (document.querySelector('a[href="#team"]')) return;
    const anchor = document.querySelector('a[href="#pricing"]');
    if (!anchor) return;
    const item = anchor.closest("li") || anchor.parentElement;
    if (!item || !item.parentElement) return;
    const clone = item.cloneNode(true);
    const link = clone.querySelector("a");
    if (!link) return;
    link.href = "#team";
    link.textContent = "Team";
    item.parentElement.insertBefore(clone, item.nextSibling);
  }

  function renderTeam(data) {
    const section = document.createElement("section");
    section.id = "team";
    section.className = "pk-team";
    section.setAttribute("aria-labelledby", "pk-team-title");

    const cards = data.members
      .map((member) => {
        const ini = initials(member.name);
        return `
          <a class="pk-team__card" href="${member.url}" target="_blank" rel="noopener noreferrer">
            <div class="pk-team__profile">
              <div class="pk-team__avatar-wrap" data-initials="${ini}">
                <img class="pk-team__avatar" src="${member.avatar}" alt="" loading="lazy" />
              </div>
              <div>
                <h3 class="pk-team__name">${member.name}</h3>
                <p class="pk-team__role">${member.role}</p>
              </div>
            </div>
            <span class="pk-team__link">View profile ${ARROW}</span>
          </a>`;
      })
      .join("");

    section.innerHTML = `
      <div class="pk-team__inner">
        <div class="pk-team__eyebrow">People</div>
        <h2 class="pk-team__title" id="pk-team-title">${data.title}</h2>
        <p class="pk-team__subtitle">${data.subtitle}</p>
        <div class="pk-team__grid">${cards}</div>
      </div>`;

    return section;
  }

  async function mount() {
    try {
      const [footer, response] = await Promise.all([
        waitFor("footer"),
        fetch("data/team.json"),
      ]);
      if (!response.ok) throw new Error(`team.json ${response.status}`);
      const data = await response.json();
      const section = renderTeam(data);
      footer.parentElement.insertBefore(section, footer);
      section.querySelectorAll(".pk-team__avatar").forEach((img) => {
        const wrap = img.closest(".pk-team__avatar-wrap");
        const ini = wrap?.dataset.initials || "?";
        img.addEventListener("error", () => {
          const fallback = document.createElement("div");
          fallback.className = "pk-team__avatar pk-team__avatar--fallback";
          fallback.textContent = ini;
          wrap?.replaceChildren(fallback);
        });
      });
      addNavLink();
    } catch (err) {
      console.warn("[produktor team]", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
