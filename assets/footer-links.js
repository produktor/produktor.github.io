(function () {
  // Legacy shim: email/header hygiene only. Footer markup comes from site-footer.js.
  const OLD_EMAIL = "install@proprodukt.example";
  const NEW_EMAIL = "info@produktor.io";

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
  }

  function applyHeaderLinks() {
    const logo = document.querySelector('header a[href="#"]');
    if (logo && logo.getAttribute("href") !== "/") {
      logo.setAttribute("href", "/");
    }
  }

  function mount() {
    fixContactEmail(document.body);
    applyHeaderLinks();
    if (window.pkMountSiteFooter) window.pkMountSiteFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
