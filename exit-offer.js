// Enabled only by the root page. City copies keep their existing interactions.
(() => {
  const visitKey = 'demo_exit_offer_seen';
  let finished = false;
  try { finished = sessionStorage.getItem(visitKey) === '1'; } catch { /* In-memory fallback. */ }

  const finish = () => {
    finished = true;
    try { sessionStorage.setItem(visitKey, '1'); } catch { /* In-memory fallback. */ }
  };
  const busy = () => document.hidden
    || document.body.classList.contains('is-locked')
    || document.querySelector('dialog[open]')
    || document.querySelector('.cookie-banner:not([hidden]), .cookie-settings-overlay:not([hidden])')
    || [...document.querySelectorAll('[data-quote-form] input:not([type="hidden"]):not([type="checkbox"]), [data-quote-form] textarea')].some(field => field.value.trim());

  const showOffer = () => {
    if (finished || busy()) return;
    finish();
    // Mouse-exit and touch-scroll triggers are pointer input, even without a click.
    document.documentElement.dataset.demoInput = 'pointer';
    openDialog({ currentTarget: document.activeElement || document.body, offer: 'exit' });
  };

  // The browser's close button is outside the page; only the top-boundary exit
  // of a mouse cursor can be observed here.
  document.addEventListener('mouseout', event => {
    if (event.relatedTarget === null && event.clientY <= 0
      && window.matchMedia('(hover: hover) and (pointer: fine)').matches) showOffer();
  });

  // Touch devices use a rapid upward scroll after a meaningful downward scroll.
  // These thresholds are a product hypothesis, not proof of intent to leave.
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  let previousY = window.scrollY;
  let previousTime = performance.now();
  let deepestY = previousY;
  let lastTouchTime = -Infinity;
  let upwardDistance = 0;
  let upwardStart = 0;
  const resetUpward = () => { upwardDistance = 0; upwardStart = 0; };
  const trackTouch = event => {
    if (event.touches.length === 1) lastTouchTime = performance.now();
  };
  window.addEventListener('touchstart', event => {
    resetUpward();
    previousY = window.scrollY;
    previousTime = performance.now();
    trackTouch(event);
  }, { passive: true });
  window.addEventListener('touchmove', trackTouch, { passive: true });
  window.addEventListener('touchcancel', resetUpward, { passive: true });
  document.addEventListener('visibilitychange', resetUpward);
  window.addEventListener('scroll', () => {
    const now = performance.now();
    const y = Math.max(0, window.scrollY);
    const delta = previousY - y;
    const elapsed = now - previousTime;
    deepestY = Math.max(deepestY, y);
    if (!coarsePointer.matches || finished || busy()
      || deepestY < Math.max(240, window.innerHeight * .6)
      || now - lastTouchTime > 1000 || delta <= 0) {
      resetUpward();
    } else {
      if (!upwardStart || elapsed > 250 || now - upwardStart > 350) {
        upwardStart = previousTime;
        upwardDistance = 0;
      }
      upwardDistance += delta;
      if (upwardDistance >= 100 && upwardDistance / Math.max(1, now - upwardStart) >= .7) showOffer();
    }
    previousY = y;
    previousTime = now;
  }, { passive: true });

  window.addEventListener('quote-form-completed', finish);
  document.addEventListener('click', event => {
    if (event.target.closest('[data-demo-contact], a[href^="tel:"], a[href^="viber:"], a[href*="wa.me/"], a[href*="t.me/"]')) finish();
  }, true);
})();
