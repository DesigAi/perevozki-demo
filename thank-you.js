// Interactions for the copied process and FAQ sections on the thank-you page.
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


queueProcessLine();
