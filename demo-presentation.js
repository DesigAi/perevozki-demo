// Buyer presentation is independent of the existing carrier interactions.
(() => {
  const section = document.querySelector('.demo-presentation');
  if (!section) return;
  // Keep keyboard focus visible without leaving rings after a tap/click.
  const root = document.documentElement;
  root.dataset.demoInput = 'keyboard';
  document.addEventListener('pointerdown', () => { root.dataset.demoInput = 'pointer'; }, true);
  document.addEventListener('keydown', event => {
    if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) root.dataset.demoInput = 'keyboard';
  }, true);
  const dialogs = [...document.querySelectorAll('.demo-detail')];
  let opener = null;
  section.querySelectorAll('[data-demo-detail]').forEach(button => {
    button.addEventListener('click', () => {
      const dialog = document.getElementById(button.dataset.demoDetail);
      if (!dialog) return;
      opener = button;
      dialog.showModal();
      dialog.querySelector('.demo-detail__body').scrollTop = 0;
      document.body.classList.add('is-locked');
      dialog.querySelector('.demo-detail__close').focus();
    });
  });
  dialogs.forEach(dialog => {
    dialog.querySelector('.demo-detail__close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const targets = [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')];
      const first = targets[0];
      const last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    });
    // A backdrop click closes the window; starting a selection inside does not.
    let startedOutside = false;
    const outside = event => {
      const r = dialog.getBoundingClientRect();
      return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
    };
    dialog.addEventListener('pointerdown', event => { startedOutside = event.target === dialog && outside(event); });
    dialog.addEventListener('click', event => {
      if (startedOutside && event.target === dialog && outside(event)) dialog.close();
      startedOutside = false;
    });
    dialog.addEventListener('close', () => {
      if (!document.querySelector('.demo-detail[open], .dialog-overlay:not([hidden]), .mobile-menu.is-open, .gallery-lightbox[open]')) {
        document.body.classList.remove('is-locked');
      }
      opener?.focus({ preventScroll: true });
      opener = null;
    });
  });
  const track = section.querySelector('.demo-presentation__track');
  const cards = [...track.querySelectorAll('.demo-benefit')];
  const previous = section.querySelector('[data-demo-previous]');
  const next = section.querySelector('[data-demo-next]');
  const progress = section.querySelector('[data-demo-progress]');
  let requestedLeft = null;
  // Several cards can share the same reachable end position on a tablet.
  // Move between distinct scroll stops rather than between card indices.
  function stops() {
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    const origin = track.getBoundingClientRect().left;
    const values = cards.map(card => Math.max(0, Math.min(max,
      card.getBoundingClientRect().left - origin + track.scrollLeft)));
    return values.filter((value, index) => !index || value - values[index - 1] > 2);
  }
  function update() {
    const positions = stops();
    const left = track.scrollLeft;
    const max = positions.at(-1) || 0;
    if (requestedLeft !== null && Math.abs(left - requestedLeft) < 2) requestedLeft = null;
    previous.disabled = left <= 2;
    next.disabled = left >= max - 2;
    const rect = track.getBoundingClientRect();
    const visible = cards.map((card, index) => ({ index, r: card.getBoundingClientRect() }))
      .filter(({ r }) => Math.min(r.right, rect.right) - Math.max(r.left, rect.left) >= r.width * .25);
    const first = (visible[0]?.index || 0) + 1;
    const last = (visible.at(-1)?.index || 0) + 1;
    progress.textContent = (first === last ? first : first + '–' + last) + ' из\u00a0' + cards.length;
  }
  function move(direction) {
    const positions = stops();
    const left = requestedLeft ?? track.scrollLeft;
    const target = direction > 0
      ? positions.find(value => value > left + 2)
      : positions.findLast(value => value < left - 2);
    if (target === undefined) return;
    requestedLeft = target;
    track.scrollTo({ left: target, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    update();
  }
  track.addEventListener('scrollend', () => { requestedLeft = null; update(); });
  track.addEventListener('pointerdown', () => { requestedLeft = null; });
  track.addEventListener('wheel', () => { requestedLeft = null; }, { passive: true });
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', update, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  new ResizeObserver(() => { requestedLeft = null; update(); }).observe(track);
  update();
})();
