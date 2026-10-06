// Shared controls for the standalone legal and 404 pages.
const lazyPhotos = [...document.querySelectorAll('[data-lazy-photo]')];
function loadLazyPhoto(element) {
  const url = new URL(element.dataset.lazyPhoto, document.baseURI).href;
  element.style.setProperty('--lazy-photo', `url("${url}")`);
}
if ('IntersectionObserver' in window) {
  const photoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      loadLazyPhoto(entry.target);
      photoObserver.unobserve(entry.target);
    });
  }, { rootMargin: '300px' });
  lazyPhotos.forEach(element => photoObserver.observe(element));
} else {
  lazyPhotos.forEach(loadLazyPhoto);
}
window.lazyPhotosReady = true;

const header = document.querySelector('.site-header');
const desktopSticky = document.createElement('div');
desktopSticky.className = 'desktop-sticky';
desktopSticky.setAttribute('aria-hidden', 'true');
desktopSticky.inert = true;
const desktopStickyInner = document.createElement('div');
desktopStickyInner.className = 'desktop-sticky__inner';
const desktopStickyHeader = header.cloneNode(true);
desktopStickyHeader.removeAttribute('id');
desktopStickyInner.append(desktopStickyHeader);
desktopSticky.append(desktopStickyInner);
document.body.append(desktopSticky);

const stickyPanels = [...document.querySelectorAll('.mobile-sticky')];
const menu = document.querySelector('#mobile-menu');
const menuBackdrop = document.querySelector('.drawer-backdrop');
const menuToggles = [...document.querySelectorAll('.menu-toggle')];
const overlay = document.querySelector('#quote-overlay');
const dialog = overlay.querySelector('.quote-dialog');
const closeButton = dialog.querySelector('.quote-dialog__close');
const toast = document.querySelector('.demo-toast');
let lastFocused = null;
let toastTimer;
let lastViewportWidth = 0;
let availableWidthFloor = Infinity;
let scaleFrame = 0;

function updateSticky() {
  const mobile = window.innerWidth < 640;
  const threshold = header.getBoundingClientRect().top + window.scrollY + header.getBoundingClientRect().height;
  const pastHeader = window.scrollY >= threshold;
  stickyPanels.forEach(panel => {
    panel.classList.toggle('is-visible', mobile && pastHeader);
    panel.setAttribute('aria-hidden', String(!mobile || !pastHeader));
  });
  const desktopVisible = !mobile && pastHeader;
  desktopSticky.classList.toggle('is-visible', desktopVisible);
  desktopSticky.setAttribute('aria-hidden', String(!desktopVisible));
  desktopSticky.inert = !desktopVisible;
}

function updateScale() {
  const viewportWidth = window.innerWidth;
  if (viewportWidth !== lastViewportWidth) {
    lastViewportWidth = viewportWidth;
    availableWidthFloor = Infinity;
  }
  const mobile = viewportWidth < 640;
  const measuredWidth = mobile
    ? document.documentElement.clientWidth || viewportWidth
    : document.body.clientWidth || document.documentElement.clientWidth || viewportWidth;
  // Keep mobile in sync with the current layout width; preserve the existing
  // scrollbar safeguard for tablet/desktop, as on the main page.
  availableWidthFloor = mobile ? measuredWidth : Math.min(availableWidthFloor, measuredWidth);
  const reference = viewportWidth < 640 ? 393 : viewportWidth < 1200 ? 960 : 1400;
  document.documentElement.style.fontSize = `${availableWidthFloor / reference}px`;
  updateSticky();
}

function queueScaleUpdate() {
  if (scaleFrame) return;
  scaleFrame = requestAnimationFrame(() => { scaleFrame = 0; updateScale(); });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
}

function closeMenu() {
  menu.classList.remove('is-open');
  menu.setAttribute('aria-hidden', 'true');
  menuBackdrop.hidden = true;
  menuToggles.forEach(button => button.setAttribute('aria-expanded', 'false'));
  if (overlay.hidden) document.body.classList.remove('is-locked');
}

function openMenu() {
  menu.classList.add('is-open');
  menu.setAttribute('aria-hidden', 'false');
  menuBackdrop.hidden = false;
  menuToggles.forEach(button => button.setAttribute('aria-expanded', 'true'));
  document.body.classList.add('is-locked');
  menu.querySelector('.mobile-menu__close').focus();
}

function openDialog(event) {
  lastFocused = event.currentTarget;
  closeMenu();
  dialog.querySelector('.quote-dialog__image').style.setProperty('--lazy-photo', `url("${new URL('../assets/01_hero_background.png', document.baseURI).href}")`);
  overlay.hidden = false;
  document.body.classList.add('is-locked');
  closeButton.focus();
}

function closeDialog() {
  overlay.hidden = true;
  document.body.classList.remove('is-locked');
  lastFocused?.focus();
}

menuToggles.forEach(button => button.addEventListener('click', openMenu));
menu.querySelector('.mobile-menu__close').addEventListener('click', closeMenu);
menuBackdrop.addEventListener('click', closeMenu);
document.querySelectorAll('[data-open-dialog]').forEach(button => button.addEventListener('click', openDialog));
closeButton.addEventListener('click', closeDialog);
overlay.addEventListener('click', event => { if (event.target === overlay) closeDialog(); });
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!overlay.hidden) closeDialog();
  else if (menu.classList.contains('is-open')) closeMenu();
});
dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]')];
  if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
  if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
});
document.querySelectorAll('[data-demo-contact]').forEach(button => button.addEventListener('click', () => {
  showToast(`Демо: ссылка на ${button.dataset.demoContact} пока не подключена`);
}));

function formatBelarusPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('375') && digits.length > 9) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  return digits.slice(0, 2)
    + (digits.length > 2 ? ` ${digits.slice(2, 5)}` : '')
    + (digits.length > 5 ? `-${digits.slice(5, 7)}` : '')
    + (digits.length > 7 ? `-${digits.slice(7, 9)}` : '');
}

document.querySelectorAll('[data-quote-form]').forEach(quoteForm => {
  const note = quoteForm.querySelector('.form-note');
  const phone = quoteForm.elements.phone;
  quoteForm.addEventListener('submit', event => {
    event.preventDefault();
    const fields = [...quoteForm.querySelectorAll('input[required], textarea[required]')];
    const valid = field => field.type === 'checkbox' ? field.checked : Boolean(field.value.trim()) && field.checkValidity();
    fields.forEach(field => field.setAttribute('aria-invalid', String(!valid(field))));
    const invalid = fields.find(field => !valid(field));
    if (invalid) {
      note.textContent = 'Заполните все поля и подтвердите согласие.';
      note.dataset.state = 'error';
      invalid.focus();
      return;
    }
    if (phone.value.replace(/\D/g, '').length !== 9) {
      phone.setAttribute('aria-invalid', 'true');
      note.textContent = 'Проверьте номер телефона.';
      note.dataset.state = 'error';
      phone.focus();
      return;
    }
    note.textContent = '';
    delete note.dataset.state;
    showToast('Демо: отправка заявки пока не подключена');
  });
  quoteForm.addEventListener('input', event => {
    if (!event.target.matches('input, textarea')) return;
    if (event.target === phone) phone.value = formatBelarusPhone(phone.value);
    event.target.removeAttribute('aria-invalid');
    note.textContent = '';
    delete note.dataset.state;
  });
  quoteForm.addEventListener('change', event => {
    if (!event.target.matches('input[type="checkbox"]')) return;
    event.target.removeAttribute('aria-invalid');
    note.textContent = '';
    delete note.dataset.state;
  });
});

window.addEventListener('resize', queueScaleUpdate, { passive: true });
window.addEventListener('scroll', updateSticky, { passive: true });
new ResizeObserver(queueScaleUpdate).observe(document.body);
updateScale();
queueScaleUpdate();
