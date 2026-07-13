(function () {
  const ARROW =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function initials(name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function avatarStyle(member) {
    const scale = member.avatarScale ?? 1;
    const position = member.avatarObjectPosition ?? "center center";
    if (scale === 1 && position === "center center") return "";
    return `transform:scale(${scale});object-position:${position};transform-origin:center 30%`;
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
    section.className = "bg-[#143a6f] text-[#faf5ea] border-b-[3px] border-black";
    section.setAttribute("aria-labelledby", "pk-team-title");

    const cards = data.members
      .map((member) => {
        const ini = initials(member.name);
        const imgStyle = avatarStyle(member);
        return `
          <a
            class="pk-team__card group border-[3px] border-black bg-white shadow-brutal p-6 sm:p-7 flex flex-col text-[#0a0a0a] no-underline transition-shadow duration-200 hover:shadow-[8px_8px_0_0_#f2c849]"
            href="${member.url}"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="flex items-center gap-4">
              <div class="pk-team__avatar-wrap" data-initials="${ini}">
                <img
                  class="pk-team__avatar"
                  src="${member.avatar}"
                  alt=""
                  loading="lazy"
                  ${imgStyle ? `style="${imgStyle}"` : ""}
                />
              </div>
              <div class="min-w-0">
                <h3 class="m-0 font-black uppercase tracking-tight text-xl sm:text-2xl leading-tight">${member.name}</h3>
                <p class="mt-1 mb-0 text-sm font-bold uppercase tracking-[0.08em] text-[#0a0a0a]/70 leading-snug">${member.role}</p>
              </div>
            </div>
            <span class="pk-team__link mt-6 inline-flex items-center gap-2 font-black uppercase tracking-[0.12em] text-[11px] sm:text-xs text-[#143a6f]">
              View profile ${ARROW}
            </span>
          </a>`;
      })
      .join("");

    section.innerHTML = `
      <div class="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-3 mb-6">
            <span class="inline-flex items-center justify-center size-9 border-[3px] border-[#faf5ea] bg-[#f2c849] text-[#0a0a0a] font-black text-sm">${data.section}</span>
            <span class="text-[11px] sm:text-xs font-black uppercase tracking-[0.18em]">${data.kicker}</span>
          </div>
          <h2 class="font-black uppercase tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.02]" id="pk-team-title">${data.title}</h2>
          <p class="mt-6 text-[15px] sm:text-[17px] leading-relaxed text-[#faf5ea]/85 max-w-2xl">${data.subtitle}</p>
        </div>
        <div class="mt-12 grid sm:grid-cols-2 gap-6">${cards}</div>
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
          fallback.className =
            "pk-team__avatar pk-team__avatar--fallback size-full grid place-items-center font-black text-lg text-[#0a0a0a]";
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
