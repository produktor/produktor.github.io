(function () {
  // Legacy shim: header hygiene only. Footer markup comes from site-footer.js + data/footer.json.
  function applyHeaderLinks() {
    const logo = document.querySelector('header a[href="#"]');
    if (logo && logo.getAttribute("href") !== "/") {
      logo.setAttribute("href", "/");
    }
  }

  function mount() {
    applyHeaderLinks();
    if (window.pkMountSiteFooter) window.pkMountSiteFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
