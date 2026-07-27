(function () {
  const OLD_EMAIL = "install@proprodukt.example";
  const NEW_EMAIL = "info@produktor.io";

  // Only real destinations. Dead stubs (Status page, Security disclosures → #contact) removed.
  const HREFS = {
    "Stack CRM": "/modules/crm/",
    "Stack Chat": "/modules/chat/",
    "Stack Meet": "/modules/meet/",
    "Service Produkt": "/modules/service/",
    "Geo-Service": "/modules/geo/",
    "Stack AI": "/modules/ai/",
    UI: "/modules/ui/",
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
    Imprint: "/impressum/",
    Impressum: "/impressum/",
    [OLD_EMAIL]: `mailto:${NEW_EMAIL}`,
    [NEW_EMAIL]: `mailto:${NEW_EMAIL}`,
  };

  const REMOVE_LABELS = new Set([
    "Status page",
    "Statusseite",
    "Security disclosures",
    "Sicherheits-Hinweise",
  ]);

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
      if (text.includes("{year}") || text.includes("{{year}}")) {
        const next = text.replace(/\{\{year\}\}|\{year\}/g, year);
        if (span.textContent !== next) span.textContent = next;
      }
    });
  }

  function fixContactEmail(root = document.body) {
    if (!root) return;
    root.querySelectorAll("a").forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      if (href.includes(OLD_EMAIL)) {
        anchor.setAttribute("href", href.replaceAll(OLD_EMAIL, NEW_EMAIL));
      }
      if (anchor.textContent.includes(OLD_EMAIL)) {
        anchor.textContent = anchor.textContent.replaceAll(OLD_EMAIL, NEW_EMAIL);
      }
    });
    root.querySelectorAll("li span, p, span, div").forEach((el) => {
      if (el.children.length > 0) return;
      const text = el.textContent?.trim();
      if (text === OLD_EMAIL) el.textContent = NEW_EMAIL;
    });
  }

  function removeDeadLinks(footer) {
    footer.querySelectorAll("a").forEach((anchor) => {
      const label = anchor.textContent.trim();
      if (!REMOVE_LABELS.has(label)) return;
      const item = anchor.closest("li");
      (item || anchor).remove();
    });
  }

  function applyFooterLinks(footer) {
    removeDeadLinks(footer);
    footer.querySelectorAll("a").forEach((anchor) => {
      const label = anchor.textContent.trim();
      const href = HREFS[label] || (label.includes("@") ? `mailto:${label}` : null);
      if (href && anchor.getAttribute("href") !== href) {
        anchor.setAttribute("href", href);
      }
    });
    addTeamLink(footer);
    addImprintLink(footer);
  }

  function addTeamLink(footer) {
    const existing = footer.querySelector('a[href="#team"]');
    if (existing) return;
    const careers = [...footer.querySelectorAll("a")].find((a) =>
      /^(careers|karriere)$/i.test(a.textContent.trim()),
    );
    if (!careers?.closest("ul")) return;
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = "#team";
    link.className = careers.className;
    link.textContent = "Team";
    item.appendChild(link);
    careers.closest("li")?.before(item);
  }

  function addImprintLink(footer) {
    if (footer.querySelector('a[href="/impressum/"], a[href="/impressum"]')) return;
    const careers = [...footer.querySelectorAll("a")].find((a) =>
      /^(careers|karriere)$/i.test(a.textContent.trim()),
    );
    if (!careers?.closest("ul")) return;
    const de = window.pkIsGerman ? window.pkIsGerman() : false;
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = "/impressum/";
    link.className = careers.className;
    link.textContent = de ? "Impressum" : "Imprint";
    item.appendChild(link);
    careers.closest("li")?.after(item);
  }

  function applyHeaderLinks() {
    const logo = document.querySelector('header a[href="#"]');
    if (logo && logo.getAttribute("href") !== "/") {
      logo.setAttribute("href", "/");
    }
  }

  function footerLinksDone(footer) {
    let ok = true;
    footer.querySelectorAll("a").forEach((anchor) => {
      const label = anchor.textContent.trim();
      if (REMOVE_LABELS.has(label)) ok = false;
      const expected = HREFS[label];
      if (expected && anchor.getAttribute("href") !== expected) ok = false;
    });
    return (
      ok &&
      Boolean(footer.querySelector('a[href="#team"]')) &&
      Boolean(footer.querySelector('a[href="/impressum/"], a[href="/impressum"]'))
    );
  }

  async function mount() {
    try {
      const footer = await waitFor("footer");
      const sync = () => {
        fixContactEmail(document.body);
        applyFooterLinks(footer);
        fixCopyrightYear(footer);
        applyHeaderLinks();
      };
      window.pkWatchPatch(sync, { root: footer, done: () => footerLinksDone(footer) });
      if (window.pkOnLanguageChange) {
        window.pkOnLanguageChange(() => {
          const imprint = footer.querySelector('a[href="/impressum/"], a[href="/impressum"]');
          if (imprint) {
            imprint.textContent = window.pkIsGerman() ? "Impressum" : "Imprint";
          }
        });
      }
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
