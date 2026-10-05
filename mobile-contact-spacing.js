// Keep the former mobile free spaces while contact panels grow with their text.
// Measuring the old typography also preserves wraps in the capped 480–639 band.
(() => {
  const photo = document.querySelector('.quick-quote__photo-panel');
  const final = document.querySelector('.final-contact');
  if (!photo && !final) return;
  let frame = 0;
  let lastWidth = '';

  function baseline(panel, isPhoto, scale, wide) {
    const clone = panel.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    const probe = document.createElement('div');
    if (isPhoto) probe.className = 'quick-quote';
    Object.assign(probe.style, {
      position: 'fixed', left: '0', top: '0', width: panel.getBoundingClientRect().width + 'px',
      display: 'block', margin: '0', visibility: 'hidden', pointerEvents: 'none',
      contain: 'layout style', overflow: 'hidden'
    });
    clone.style.width = '100%';
    const content = clone.querySelector(isPhoto ? '.quick-quote__photo-content' : '.final-contact__content');
    content.querySelector('h2').style.fontSize = (wide ? Math.min(26 * scale, 34) : 26 * scale) + 'px';
    const lead = content.querySelector(isPhoto ? 'p' : '.final-contact__lead');
    lead.style.fontSize = (wide ? Math.min(15 * scale, 18) : 15 * scale) + 'px';
    const call = content.querySelector(isPhoto ? '.quick-quote__call' : '.final-contact__call');
    Object.assign(call.style, {
      width: '179rem', height: (wide ? Math.min(52 * scale, 60) : 52 * scale) + 'px',
      fontSize: (wide ? Math.min(15 * scale, 18) : 15 * scale) + 'px', marginRight: '5rem'
    });
    if (isPhoto) {
      Object.assign(clone.style, { height: '500rem', minHeight: '0', padding: '0' });
      Object.assign(content.style, { position: 'absolute', left: '20rem', right: '20rem', bottom: '40rem' });
    } else {
      content.style.minHeight = '400rem';
      const hours = content.querySelector('.final-contact__hours');
      Object.assign(hours.style, { marginTop: 'auto', fontSize: '12rem' });
    }
    probe.append(clone);
    document.body.append(probe);
    const gap = isPhoto
      ? content.getBoundingClientRect().top - clone.getBoundingClientRect().top
      : content.querySelector('.final-contact__hours').getBoundingClientRect().top
        - content.querySelector('.final-contact__actions').getBoundingClientRect().bottom;
    probe.remove();
    return Math.max(0, gap);
  }

  function update() {
    frame = 0;
    const scale = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const key = [innerWidth, scale, photo?.getBoundingClientRect().width, final?.getBoundingClientRect().width].join(':');
    if (key === lastWidth) return;
    lastWidth = key;
    if (innerWidth >= 640) {
      photo?.style.removeProperty('--mobile-photo-gap');
      final?.style.removeProperty('--mobile-hours-gap');
      return;
    }
    if (photo) photo.style.setProperty('--mobile-photo-gap', baseline(photo, true, scale, innerWidth >= 480) + 'px');
    if (final) final.style.setProperty('--mobile-hours-gap', baseline(final, false, scale, innerWidth >= 480) + 'px');
  }

  function queue() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  const observer = new ResizeObserver(queue);
  if (photo) observer.observe(photo);
  if (final) observer.observe(final);
  window.addEventListener('resize', queue, { passive: true });
  document.fonts.ready.then(() => { lastWidth = ''; queue(); });
  queue();
})();

