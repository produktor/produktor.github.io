(function () {
  const HREFS = {
    "Stack CRM": "#products",
    "Stack Chat": "#products",
    "Stack Meet": "#products",
    "Sizing sheet": "#pricing",
    "Sizing-Sheet": "#pricing",
    "Install method": "#how-it-works",
    Installationsmethode: "#how-it-works",
    Pricing: "#pricing",
    Preise: "#pricing",
    Compliance: "#compare",
    "Book a demo": "#contact",
    "Demo buchen": "#contact",
    Careers: "/careers",
    Karriere: "/careers",
    Team: "#team",
    "info@produktor.io": "mailto:info@produktor.io",
    "Status page": "#contact",
    Statusseite: "#contact",
    "Security disclosures": "#contact",
    "Sicherheits-Hinweise": "#contact",
  };

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

  function fixCopyrightYear(footer) {
    const year = String(new Date().getFullYear());
    footer.querySelectorAll("span").forEach((span) => {
      const text = span.textContent;
      if (!text || !text.includes("produktor.io")) return;
      if (text.includes("{year}")) {
        span.textContent = text.replace(/\{\{year\}\}|\{year\}/g, year);
      }
    });
  }

  function applyFooterLinks(footer) {
    footer.querySelectorAll("a").forEach((anchor) => {
      const label = anchor.textContent.trim();
      const href = HREFS[label] || (label.includes("@") ? `mailto:${label}` : null);
      if (href && anchor.getAttribute("href") !== href) {
        anchor.setAttribute("href", href);
      }
    });
    addTeamLink(footer);
  }

  function addTeamLink(footer) {
    if (footer.querySelector('a[href="#team"]')) return;
    const careers = [...footer.querySelectorAll("a")].find((a) =>
      /^(careers|karriere)$/i.test(a.textContent.trim()),
    );
    if (!careers?.closest("ul")) return;
    const list = careers.closest("ul");
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = "#team";
    link.className = careers.className;
    link.textContent = "Team";
    item.appendChild(link);
    careers.closest("li")?.before(item);
  }

  function applyHeaderLinks() {
    const logo = document.querySelector('header a[href="#"]');
    if (logo) logo.setAttribute("href", "/");
  }

  async function mount() {
    try {
      const footer = await waitFor("footer");
      applyFooterLinks(footer);
      fixCopyrightYear(footer);
      applyHeaderLinks();
      new MutationObserver(() => {
        applyFooterLinks(footer);
        fixCopyrightYear(footer);
        applyHeaderLinks();
      }).observe(footer, { childList: true, subtree: true, characterData: true });
    } catch (err) {
      console.warn("[produktor footer-links]", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
