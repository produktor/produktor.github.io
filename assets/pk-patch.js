(function () {
  let inPatch = false;

  window.pkSchedulePatch = function (run) {
    if (inPatch) return;
    inPatch = true;
    try {
      run();
    } finally {
      inPatch = false;
    }
  };

  window.pkWatchPatch = function (run, options) {
    const root = options?.root || document.body;
    const done = options?.done || (() => false);
    let frame = null;
    let observer = null;

    const tick = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (done()) {
          observer?.disconnect();
          observer = null;
          return;
        }
        window.pkSchedulePatch(run);
        if (done()) {
          observer?.disconnect();
          observer = null;
        }
      });
    };

    const connect = () => {
      if (observer) return;
      observer = new MutationObserver(tick);
      observer.observe(root, { childList: true, subtree: true });
    };

    window.pkSchedulePatch(run);
    if (!done()) connect();

    if (window.pkOnLanguageChange) {
      window.pkOnLanguageChange(() => {
        connect();
        tick();
      });
    }

    return () => {
      observer?.disconnect();
      observer = null;
    };
  };
})();
