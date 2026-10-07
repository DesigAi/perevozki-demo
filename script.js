// CSS photos stay deferred until their section approaches the viewport.
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
  }, { rootMargin: '600px 0px' });
  lazyPhotos.forEach(element => photoObserver.observe(element));
} else {
  lazyPhotos.forEach(loadLazyPhoto);
}
window.lazyPhotosReady = true;

// Reveal the hero benefits when each item enters the viewport.
// Skip the invisible layout spacer in the base page and generated city copies.
const heroBenefits = document.querySelectorAll('.hero--simple-mobile .hero__benefits:not(.hero__benefits--spacer) p');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const heroBenefitObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.intersectionRatio < .2) return;
      entry.target.classList.remove('is-hero-benefit-pending');
      entry.target.classList.add('is-hero-benefit-visible');
      heroBenefitObserver.unobserve(entry.target);
    });
  }, { threshold: .2 });
  heroBenefits.forEach(item => {
    item.classList.add('is-hero-benefit-pending');
    heroBenefitObserver.observe(item);
  });
}

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
const dialogOverlay = document.querySelector('#quote-overlay');
const dialog = dialogOverlay.querySelector('.quote-dialog');
const dialogClose = dialogOverlay.querySelector('.quote-dialog__close');
const form = document.querySelector('#quote-form');
const formNote = document.querySelector('#form-note');
const quoteTitleAccent = document.querySelector('[data-quote-title-accent]');
const quoteTitleTail = document.querySelector('[data-quote-title-tail]');
const quoteSubmit = document.querySelector('.quote-dialog__submit');
const servicesSection = document.querySelector('#services');
const servicesMore = document.querySelector('.services__more');
const serviceOptions = {
  city: { title: 'Грузовое такси по Бресту', heading: 'Заказать грузовое такси\nпо\u00a0Бресту', button: 'Заказать грузовое такси' },
  apartment: { title: 'Квартирный переезд', heading: 'Заказать квартирный\nпереезд', button: 'Заказать квартирный переезд' },
  office: { title: 'Офисный переезд', heading: 'Заказать офисный\nпереезд', button: 'Заказать офисный переезд' },
  furniture: { title: 'Перевозка мебели', heading: 'Заказать перевозку\nмебели', button: 'Заказать перевозку мебели' },
  materials: { title: 'Перевозка стройматериалов', heading: 'Заказать перевозку\nстройматериалов\n', tail: 'и\u00a0получить расчёт перевозки', button: 'Заказать перевозку стройматериалов' },
  loaders: { title: 'Грузчики и упаковка', heading: 'Заказать грузчиков\nи\u00a0упаковку', button: 'Заказать грузчиков и упаковку' }
};
function formatBelarusPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('375') && digits.length > 9) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  return digits.slice(0, 2)
    + (digits.length > 2 ? ` ${digits.slice(2, 5)}` : '')
    + (digits.length > 5 ? `-${digits.slice(5, 7)}` : '')
    + (digits.length > 7 ? `-${digits.slice(7, 9)}` : '');
}
const drawer = document.querySelector('#mobile-menu');
const drawerBackdrop = document.querySelector('.drawer-backdrop');
const menuToggles = [...document.querySelectorAll('.menu-toggle')];
const toast = document.querySelector('.demo-toast');
let lastFocused = null;
let toastTimer;
let lastViewportWidth = 0;
let availableWidthFloor = Infinity;
let scaleFrame = 0;

// Tilda's five width bands. Each band keeps Autoscale; adjacent bands may
// refine the composition in CSS without changing the Figma reference frame.
function getWidthBand(width) {
  if (width < 480) return { name: 'phone-portrait', reference: 393 };
  if (width < 640) return { name: 'phone-landscape', reference: 393 };
  if (width < 980) return { name: 'tablet-portrait', reference: 960 };
  if (width < 1200) return { name: 'tablet-landscape', reference: 960 };
  return { name: 'desktop', reference: 1400 };
}

// One design unit is one pixel at the reference width. Scaling the root unit
// keeps type, spacing, radius, image crop and the twelve-column composition in sync.
function updateScale() {
  // innerWidth can include a classic vertical scrollbar. The body content box
  // is the width the design canvas can actually occupy.
  const viewportWidth = window.innerWidth;
  if (viewportWidth !== lastViewportWidth) {
    lastViewportWidth = viewportWidth;
    availableWidthFloor = Infinity;
  }
  const mobile = viewportWidth < 640;
  const measuredWidth = mobile
    ? document.documentElement.clientWidth || viewportWidth
    : document.body.clientWidth || document.documentElement.clientWidth || viewportWidth;
  // Mobile follows the current layout width, including recovery after loading
  // or closing an overlay. Only tablet/desktop retain the scrollbar safeguard.
  availableWidthFloor = mobile ? measuredWidth : Math.min(availableWidthFloor, measuredWidth);
  const band = getWidthBand(viewportWidth);
  document.documentElement.dataset.widthBand = band.name;
  document.documentElement.style.fontSize = `${availableWidthFloor / band.reference}px`;
  updateSticky();
}

function queueScaleUpdate() {
  if (scaleFrame) return;
  scaleFrame = requestAnimationFrame(() => {
    scaleFrame = 0;
    updateScale();
  });
}

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

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
}

function openDialog(event) {
  lastFocused = event.currentTarget;
  closeMenu();
  const serviceId = event.currentTarget.dataset.service;
  const selectedService = serviceOptions[serviceId];
  const photoPath = event.currentTarget.closest('.service-card')?.querySelector('.service-card__image')?.getAttribute('src') || './assets/01_hero_background.png';
  dialog.querySelector('.quote-dialog__image').style.setProperty('--lazy-photo', `url("${new URL(photoPath, document.baseURI).href}")`);
  if (selectedService) dialog.dataset.service = serviceId;
  else delete dialog.dataset.service;
  form.elements.service.value = selectedService?.title || '';
  quoteTitleAccent.textContent = selectedService?.heading || 'Получите расчёт стоимости перевозки';
  quoteTitleTail.textContent = selectedService
    ? selectedService.tail || 'и\u00a0получить\nрасчёт перевозки'
    : 'и\u00a0узнайте итоговую цену до выезда машины';
  quoteSubmit.textContent = selectedService?.button || 'Рассчитать перевозку';
  dialogOverlay.hidden = false;
  document.body.classList.add('is-locked');
  formNote.textContent = '';
  delete formNote.dataset.state;
  form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  dialogClose.focus();
}

function closeDialog() {
  dialogOverlay.hidden = true;
  document.body.classList.remove('is-locked');
  lastFocused?.focus();
}

function openMenu() {
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  drawerBackdrop.hidden = false;
  menuToggles.forEach(button => button.setAttribute('aria-expanded', 'true'));
  document.body.classList.add('is-locked');
  drawer.querySelector('.mobile-menu__close').focus();
}

function closeMenu() {
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  drawerBackdrop.hidden = true;
  menuToggles.forEach(button => button.setAttribute('aria-expanded', 'false'));
  if (dialogOverlay.hidden) document.body.classList.remove('is-locked');
}

document.querySelectorAll('[data-open-dialog]').forEach(button => button.addEventListener('click', openDialog));
dialogClose.addEventListener('click', closeDialog);
dialogOverlay.addEventListener('click', event => {
  if (event.target === dialogOverlay) closeDialog();
});
dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]')];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

menuToggles.forEach(button => button.addEventListener('click', openMenu));
drawer.querySelector('.mobile-menu__close').addEventListener('click', closeMenu);
drawerBackdrop.addEventListener('click', closeMenu);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeMenu();
});

document.querySelectorAll('[data-demo-contact]').forEach(button => button.addEventListener('click', () => {
  showToast(`Демо: ссылка на ${button.dataset.demoContact} пока не подключена`);
}));
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const serviceCards = [...servicesSection.querySelectorAll('.service-card')];
  const serviceRows = new WeakMap();
  const serviceObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      serviceRows.get(entry.target)?.forEach(card => {
        card.classList.add('is-reveal-active');
        card.classList.remove('is-reveal-pending');
      });
      serviceObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px 5% 0px' });
  const columnsAtWidth = () => window.innerWidth < 640 ? 1 : window.innerWidth < 1200 ? 2 : 3;
  let currentColumns = columnsAtWidth();

  function observeServiceRows() {
    serviceObserver.disconnect();
    for (let index = 0; index < serviceCards.length; index += currentColumns) {
      const row = serviceCards.slice(index, index + currentColumns);
      if (row.some(card => !card.classList.contains('is-reveal-pending'))) {
        row.forEach(card => {
          card.classList.add('is-reveal-active');
          card.classList.remove('is-reveal-pending');
        });
      } else {
        serviceRows.set(row[0], row);
        serviceObserver.observe(row[0]);
      }
    }
  }

  serviceCards.forEach(card => card.classList.add('is-reveal-pending'));
  servicesSection.dataset.revealReady = '';
  observeServiceRows();
  window.addEventListener('resize', () => {
    const nextColumns = columnsAtWidth();
    if (nextColumns === currentColumns) return;
    currentColumns = nextColumns;
    observeServiceRows();
  });
}

servicesMore.addEventListener('click', () => {
  const expanded = servicesSection.classList.toggle('is-expanded');
  servicesMore.setAttribute('aria-expanded', String(expanded));
  servicesMore.textContent = expanded ? 'Свернуть услуги' : 'Смотреть ещё';
  if (!expanded) {
    requestAnimationFrame(() => servicesMore.scrollIntoView({ block: 'center', behavior: 'instant' }));
  }
});

const tariffsSection = document.querySelector('#tariffs');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const tariffTable = tariffsSection.querySelector('.tariffs__table');
  const tariffCta = tariffsSection.querySelector('.tariffs__cta');
  const tariffObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      revealTariffPart(entry.target);
      if (entry.target === tariffTable && window.innerWidth >= 1200) revealTariffPart(tariffCta);
    });
  }, { rootMargin: '0px 0px 5% 0px' });
  let sideBySide = window.innerWidth >= 1200;

  function revealTariffPart(element) {
    element.classList.add('is-reveal-active');
    element.classList.remove('is-reveal-pending');
    tariffObserver.unobserve(element);
  }

  function observeTariffParts() {
    tariffObserver.disconnect();
    if (tariffTable.classList.contains('is-reveal-pending')) tariffObserver.observe(tariffTable);
    if (sideBySide) {
      if (!tariffTable.classList.contains('is-reveal-pending') && tariffCta.classList.contains('is-reveal-pending')) revealTariffPart(tariffCta);
    } else if (tariffCta.classList.contains('is-reveal-pending')) {
      tariffObserver.observe(tariffCta);
    }
  }

  tariffTable.classList.add('is-reveal-pending');
  tariffCta.classList.add('is-reveal-pending');
  tariffsSection.dataset.revealReady = '';
  observeTariffParts();
  window.addEventListener('resize', () => {
    const nextSideBySide = window.innerWidth >= 1200;
    if (nextSideBySide === sideBySide) return;
    sideBySide = nextSideBySide;
    observeTariffParts();
  });
}

document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const target = link.getAttribute('href');
  if (target === '#top') return;
  event.preventDefault();
  closeMenu();
  const section = document.querySelector(target);
  if (section) section.scrollIntoView();
  else showToast('Этот раздел появится на следующем этапе вёрстки');
}));

function setupQuoteForm(quoteForm) {
  const note = quoteForm.querySelector('.form-note');
  const phone = quoteForm.elements.phone;
  quoteForm.addEventListener('submit', event => {
    event.preventDefault();
    const fields = [...quoteForm.querySelectorAll('input[required], textarea[required]')];
    const fieldIsValid = field => field.type === 'checkbox'
      ? field.checked
      : Boolean(field.value.trim()) && field.checkValidity();
    fields.forEach(field => field.setAttribute('aria-invalid', String(!fieldIsValid(field))));
    const invalid = fields.find(field => !fieldIsValid(field));
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
    if (event.target.matches('input, textarea')) {
      if (event.target === phone) phone.value = formatBelarusPhone(phone.value);
      event.target.removeAttribute('aria-invalid');
      note.textContent = '';
      delete note.dataset.state;
    }
  });
  quoteForm.addEventListener('change', event => {
    if (event.target.matches('input[type="checkbox"]')) {
      event.target.removeAttribute('aria-invalid');
      note.textContent = '';
      delete note.dataset.state;
    }
  });
}
document.querySelectorAll('[data-quote-form]').forEach(setupQuoteForm);

const reviewsTrack = document.querySelector('#reviews-track');
const reviewsPrev = document.querySelector('[data-reviews-prev]');
const reviewsNext = document.querySelector('[data-reviews-next]');
function updateReviewArrows() {
  const maxScroll = reviewsTrack.scrollWidth - reviewsTrack.clientWidth;
  reviewsPrev.disabled = reviewsTrack.scrollLeft <= 1;
  reviewsNext.disabled = reviewsTrack.scrollLeft >= maxScroll - 1;
}
function scrollReviews(direction) {
  const firstCard = reviewsTrack.querySelector('img');
  const gap = parseFloat(getComputedStyle(reviewsTrack).columnGap) || 0;
  reviewsTrack.scrollBy({ left: direction * (firstCard.getBoundingClientRect().width + gap), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
reviewsPrev.addEventListener('click', () => scrollReviews(-1));
reviewsNext.addEventListener('click', () => scrollReviews(1));
reviewsTrack.addEventListener('scroll', updateReviewArrows, { passive: true });
reviewsTrack.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    scrollReviews(event.key === 'ArrowRight' ? 1 : -1);
  }
});
new ResizeObserver(updateReviewArrows).observe(reviewsTrack);
updateReviewArrows();
const processSection = document.querySelector('#process');
const processStages = processSection.querySelector('.process__stages');
const processBadges = [...processStages.querySelectorAll('.process-step__number')];
const reducedProcessMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let processFrame = 0;
function updateProcessLine() {
  processFrame = 0;
  const stagesRect = processStages.getBoundingClientRect();
  const firstRect = processBadges[0].getBoundingClientRect();
  const lastRect = processBadges.at(-1).getBoundingClientRect();
  const vertical = window.innerWidth < 980;
  const firstX = firstRect.left + firstRect.width / 2;
  const firstY = firstRect.top + firstRect.height / 2;
  const length = vertical
    ? lastRect.top + lastRect.height / 2 - firstY
    : lastRect.left + lastRect.width / 2 - firstX;
  processStages.style.setProperty('--line-left', `${firstX - stagesRect.left}px`);
  processStages.style.setProperty('--line-top', `${firstY - stagesRect.top}px`);
  processStages.style.setProperty('--line-length', `${Math.max(0, length)}px`);
  // Begin as the first badge enters from the bottom; finish when the last
  // badge reaches the upper quarter of the viewport.
  const distance = window.innerHeight * .75 + (vertical ? length : 0);
  const scrollProgress = (window.innerHeight - firstY) / Math.max(1, distance);
  const progress = reducedProcessMotion.matches ? 1 : Math.max(0, Math.min(1, scrollProgress));
  processStages.style.setProperty('--process-progress', progress.toFixed(3));
}
function queueProcessLine() {
  if (processFrame) return;
  processFrame = requestAnimationFrame(updateProcessLine);
}
new ResizeObserver(queueProcessLine).observe(processStages);
window.addEventListener('scroll', queueProcessLine, { passive: true });
window.addEventListener('resize', queueProcessLine, { passive: true });
reducedProcessMotion.addEventListener('change', queueProcessLine);
document.fonts.ready.then(queueProcessLine);

const processBenefits = processSection.querySelector('.process__benefits');
if ('IntersectionObserver' in window && !reducedProcessMotion.matches) {
  const benefitList = processBenefits.querySelector('.process__benefit-list');
  const benefitItems = [...benefitList.querySelectorAll('.process-benefit')];
  const benefitRows = new WeakMap();
  const benefitObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (entry.target === benefitList) {
        benefitList.classList.add('is-reveal-active');
        benefitItems.forEach(revealBenefit);
      } else {
        benefitRows.get(entry.target)?.forEach(revealBenefit);
      }
      benefitObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px 5% 0px' });
  const columnsAtWidth = () => window.innerWidth < 640 ? 1 : window.innerWidth < 1200 ? 2 : 4;
  let currentColumns = columnsAtWidth();

  function revealBenefit(item) {
    item.classList.add('is-reveal-active');
    item.classList.remove('is-reveal-pending');
  }

  function observeBenefitRows() {
    benefitObserver.disconnect();
    if (currentColumns === 4) {
      if (benefitItems.some(item => !item.classList.contains('is-reveal-pending'))) {
        benefitList.classList.add('is-reveal-active');
        benefitItems.forEach(revealBenefit);
      } else {
        benefitObserver.observe(benefitList);
      }
      return;
    }
    for (let index = 0; index < benefitItems.length; index += currentColumns) {
      const row = benefitItems.slice(index, index + currentColumns);
      if (row.some(item => !item.classList.contains('is-reveal-pending'))) {
        row.forEach(revealBenefit);
      } else {
        benefitRows.set(row[0], row);
        benefitObserver.observe(row[0]);
      }
    }
  }

  benefitItems.forEach(item => item.classList.add('is-reveal-pending'));
  processBenefits.dataset.revealReady = '';
  observeBenefitRows();
  window.addEventListener('resize', () => {
    const nextColumns = columnsAtWidth();
    if (nextColumns === currentColumns) return;
    currentColumns = nextColumns;
    observeBenefitRows();
  });
}

const galleryTrack = document.querySelector('#gallery-track');
const galleryItems = [...galleryTrack.querySelectorAll('.gallery__item')];
const galleryPrev = document.querySelector('[data-gallery-prev]');
const galleryNext = document.querySelector('[data-gallery-next]');
const galleryLightbox = document.querySelector('.gallery-lightbox');
const galleryLightboxImage = galleryLightbox.querySelector('.gallery-lightbox__image');
const galleryLightboxStage = galleryLightbox.querySelector('.gallery-lightbox__stage');
const galleryThumbnails = [...galleryLightbox.querySelectorAll('[data-gallery-thumb]')];
let activeGalleryIndex = 0;
let galleryOpenTrigger = null;
function updateGalleryArrows() {
  const maxScroll = galleryTrack.scrollWidth - galleryTrack.clientWidth;
  galleryPrev.disabled = galleryTrack.scrollLeft <= 1;
  galleryNext.disabled = galleryTrack.scrollLeft >= maxScroll - 1;
}
function scrollGallery(direction) {
  const gap = parseFloat(getComputedStyle(galleryTrack).columnGap) || 0;
  const step = galleryItems[0].getBoundingClientRect().width + gap;
  galleryTrack.scrollBy({ left: direction * step, behavior: reducedProcessMotion.matches ? 'instant' : 'smooth' });
}
galleryPrev.addEventListener('click', () => scrollGallery(-1));
galleryNext.addEventListener('click', () => scrollGallery(1));
galleryTrack.addEventListener('scroll', updateGalleryArrows, { passive: true });
galleryTrack.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  scrollGallery(event.key === 'ArrowRight' ? 1 : -1);
});
new ResizeObserver(updateGalleryArrows).observe(galleryTrack);
updateGalleryArrows();
function showGalleryImage(index, trigger = null) {
  activeGalleryIndex = (index + galleryItems.length) % galleryItems.length;
  const image = galleryItems[activeGalleryIndex].querySelector('img');
  galleryLightboxImage.src = image.currentSrc || image.src;
  galleryLightboxImage.alt = image.alt;
  galleryThumbnails.forEach((thumbnail, thumbnailIndex) => {
    const active = thumbnailIndex === activeGalleryIndex;
    thumbnail.classList.toggle('is-active', active);
    thumbnail.setAttribute('aria-pressed', String(active));
  });
  if (!galleryLightbox.open) galleryOpenTrigger = trigger || galleryItems[activeGalleryIndex];
  if (!galleryLightbox.open) galleryLightbox.showModal();
}
galleryItems.forEach((item, index) => item.addEventListener('click', () => showGalleryImage(index, item)));
galleryThumbnails.forEach((thumbnail, index) => thumbnail.addEventListener('click', () => showGalleryImage(index)));
galleryLightbox.querySelector('.gallery-lightbox__close').addEventListener('click', () => galleryLightbox.close());
galleryLightbox.querySelector('.gallery-lightbox__nav--prev').addEventListener('click', () => showGalleryImage(activeGalleryIndex - 1));
galleryLightbox.querySelector('.gallery-lightbox__nav--next').addEventListener('click', () => showGalleryImage(activeGalleryIndex + 1));
let galleryTouchStart = null;
galleryLightboxStage.addEventListener('touchstart', event => {
  if (event.touches.length !== 1) return;
  galleryTouchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}, { passive: true });
galleryLightboxStage.addEventListener('touchend', event => {
  if (!galleryTouchStart || event.changedTouches.length !== 1) return;
  const deltaX = event.changedTouches[0].clientX - galleryTouchStart.x;
  const deltaY = event.changedTouches[0].clientY - galleryTouchStart.y;
  galleryTouchStart = null;
  if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
  showGalleryImage(activeGalleryIndex + (deltaX < 0 ? 1 : -1));
}, { passive: true });
galleryLightboxStage.addEventListener('touchcancel', () => { galleryTouchStart = null; });
galleryLightbox.addEventListener('click', event => {
  if (event.target === galleryLightbox || (event.target === galleryLightboxStage && window.matchMedia('(max-width:639px)').matches)) galleryLightbox.close();
});
galleryLightbox.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  showGalleryImage(activeGalleryIndex + (event.key === 'ArrowRight' ? 1 : -1));
});
galleryLightbox.addEventListener('close', () => {
  galleryOpenTrigger?.focus({ preventScroll: true });
  galleryOpenTrigger = null;
});

const faqItems = [...document.querySelectorAll('.faq-item')];
const faqSection = document.querySelector('.faq');
function setFaqOpen(item, open) {
  item.classList.toggle('is-open', open);
  item.querySelector('.faq-item__trigger').setAttribute('aria-expanded', String(open));
  item.querySelector('.faq-item__answer').setAttribute('aria-hidden', String(!open));
}
faqItems.forEach(item => item.querySelector('.faq-item__trigger').addEventListener('click', () => {
  const shouldOpen = !item.classList.contains('is-open');
  if (shouldOpen && faqItems.some(other => other !== item && other.classList.contains('is-open'))) {
    faqSection.style.minHeight = `${Math.max(faqSection.getBoundingClientRect().height, parseFloat(faqSection.style.minHeight) || 0)}px`;
  } else if (!shouldOpen) {
    faqSection.style.minHeight = '';
  }
  faqItems.forEach(other => setFaqOpen(other, other === item && shouldOpen));
}));

window.addEventListener('resize', queueScaleUpdate, { passive: true });
window.addEventListener('scroll', updateSticky, { passive: true });
new ResizeObserver(queueScaleUpdate).observe(document.body);
updateScale();
queueScaleUpdate();
queueProcessLine();
