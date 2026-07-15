(function () {
  const DEFAULT_WEBHOOK =
    window.PRODUKTOR_CONTACT_WEBHOOK ||
    "";

  const MESSAGES = {
    en: {
      sending: "Sending…",
      successTitle: "Request received",
      successBody: "We will reply within one business day.",
      error: "Could not send your request. Please email info@produktor.io directly.",
      again: "Send another request",
    },
    de: {
      sending: "Wird gesendet…",
      successTitle: "Anfrage erhalten",
      successBody: "Wir melden uns innerhalb eines Werktags.",
      error: "Anfrage konnte nicht gesendet werden. Bitte schreiben Sie an info@produktor.io.",
      again: "Weitere Anfrage senden",
    },
  };

  function locale() {
    const lang =
      document.documentElement.lang ||
      (window.pkLang && window.pkLang.current) ||
      "en";
    return String(lang).toLowerCase().startsWith("de") ? "de" : "en";
  }

  function msg(key) {
    return MESSAGES[locale()][key];
  }

  async function webhookUrl() {
    if (DEFAULT_WEBHOOK) return DEFAULT_WEBHOOK;
    try {
      const res = await fetch("/data/contact-webhook.json", { cache: "no-store" });
      if (!res.ok) return "";
      const data = await res.json();
      return data.webhookUrl || "";
    } catch {
      return "";
    }
  }

  function readForm(form) {
    const fd = new FormData(form);
    return {
      email: String(fd.get("email") || "").trim(),
      company: String(fd.get("company") || "").trim(),
      seats: String(fd.get("seats") || ""),
      module: String(fd.get("module") || ""),
      notes: String(fd.get("notes") || "").trim(),
      locale: locale(),
      origin: window.location.pathname,
      userAgent: navigator.userAgent,
      website: String(fd.get("website") || ""),
    };
  }

  function showSuccess(form, panel) {
    const wrap = form.parentElement;
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="border-[3px] border-black bg-[#143a6f] text-[#faf5ea] shadow-brutal-lg p-6 sm:p-8">
        <div class="inline-flex items-center gap-2 mb-5 px-3 py-1 border-[3px] border-[#faf5ea] bg-[#f2c849] text-[#0a0a0a] font-black uppercase text-[11px] tracking-[0.18em]">OK</div>
        <h3 class="font-black uppercase tracking-tight text-3xl sm:text-4xl">${msg("successTitle")}</h3>
        <p class="mt-3 text-[15px] leading-relaxed text-[#faf5ea]/80 max-w-prose">${msg("successBody")}</p>
        <button type="button" id="pk-contact-again" class="mt-6 inline-flex items-center gap-2 px-4 h-11 border-[3px] border-[#faf5ea] bg-transparent text-[#faf5ea] font-black uppercase tracking-wide text-sm hover:bg-[#f2c849] hover:text-[#0a0a0a] hover:border-[#0a0a0a] transition-colors">${msg("again")}</button>
      </div>`;
    wrap.querySelector("#pk-contact-again")?.addEventListener("click", () => {
      window.location.hash = "#contact";
      window.location.reload();
    });
  }

  function setSubmitting(form, on) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = on;
    if (on) btn.dataset.pkPrev = btn.textContent || "";
    btn.textContent = on ? msg("sending") : btn.dataset.pkPrev || btn.textContent;
  }

  async function onSubmit(event) {
    const form = event.target.closest("#contact form");
    if (!form) return;

    const url = await webhookUrl();
    if (!url) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const payload = readForm(form);
    if (payload.website) return;
    if (!payload.email || !payload.company) return;

    setSubmitting(form, true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const section = document.getElementById("contact");
      showSuccess(form, section);
    } catch (err) {
      console.error("contact-api submit failed", err);
      alert(msg("error"));
    } finally {
      setSubmitting(form, false);
    }
  }

  function bind() {
    const section = document.getElementById("contact");
    const form = section?.querySelector("form");
    if (!form || form.dataset.pkContactBound === "1") return false;

    if (!form.querySelector('input[name="website"]')) {
      const honeypot = document.createElement("input");
      honeypot.type = "text";
      honeypot.name = "website";
      honeypot.tabIndex = -1;
      honeypot.autocomplete = "off";
      honeypot.setAttribute("aria-hidden", "true");
      honeypot.style.cssText =
        "position:absolute;left:-9999px;width:1px;height:1px;opacity:0;";
      form.appendChild(honeypot);
    }

    form.dataset.pkContactBound = "1";
    return true;
  }

  document.addEventListener("submit", onSubmit, true);

  if (window.pkWatchPatch) {
    window.pkWatchPatch(bind, {
      done: () => Boolean(document.querySelector("#contact form")),
    });
  } else {
    const tick = () => {
      if (bind()) return;
      requestAnimationFrame(tick);
    };
    tick();
  }
})();
