import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { services, faq, details, copy, attributes } from './uk/content.mjs';

// Run explicitly after editing the shared Brest layout or British content.
// Generated files are committed; Vercel serves them without a build command.
const root = new URL('./', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8').replace(/\r/g, '');
const write = (file, value) => writeFileSync(new URL(file, root), value);
const folder = 'uk/london';
const shared = '../../';
mkdirSync(new URL(`${folder}/`, root), { recursive: true });
const replaceCopy = (source, entries) => Object.entries(entries).sort(([a], [b]) => b.length - a.length).reduce((value, [from, to]) => value.replaceAll(from, to), source);
const asset = name => `${shared}assets/${name}`;

function localiseLayout(source) {
  let html = source
    .replace('<html lang="ru">', '<html lang="en-GB" data-city="uk-london" data-region="uk">')
    .replace('<base href="/">', '<base href="/uk/london/">')
    .replaceAll('ru_BY', 'en_GB')
    .replaceAll('+375&nbsp;(33)&nbsp;555-66-77', '+44&nbsp;7700&nbsp;900123')
    .replaceAll('+375 (33) 555-66-77', '+44 7700 900123')
    .replaceAll('belarus-flag.svg', 'uk-flag.svg')
    .replaceAll('<span class="phone-field__code">+375</span>', '<span class="phone-field__code">+44</span>')
    .replaceAll('29 491-19-11', '7700 900123')
    .replaceAll('autocomplete="street-address"', 'autocomplete="postal-code"')
    .replace(/\s*<button\b[^>]*data-demo-contact="(?:Viber|Telegram|Яндекс Карты)"[^>]*>[\s\S]*?<\/button>/g, '')
    .replace(/<label class="consent">[\s\S]*?<\/label>/g, '<label class="consent"><input type="checkbox" name="consent" required><span>I’ve read the <a href="./privacy-policy.html" target="_blank" rel="noopener noreferrer">privacy notice</a> and understand how my <a href="./consent.html" target="_blank" rel="noopener noreferrer">enquiry details</a> will be used.</span></label>')
    .replaceAll('data-demo-contact="телефон"', 'data-demo-contact="phone"')
    .replaceAll('data-demo-contact="почту"', 'data-demo-contact="email"')
    .replaceAll('post@mail.com', 'hello@example.com');
  html = replaceCopy(html, attributes);
  html = html.replace(/>([^<>]*[А-Яа-яЁё][^<>]*)</g, (match, text) => {
    const key = text.trim();
    return copy[key] !== undefined ? `>${text.replace(key, copy[key])}<` : match;
  });
  html = html.replace(/\.\/assets\//g, asset(''));
  html = html.replace(/(href|src)="\.\/([^"/]+\.(?:css|js))"/g, (match, attr, file) =>
    `${attr}="${['script.js', 'legal.js', 'cookie-consent.js', 'demo-presentation.js'].includes(file) ? './' : shared}${file}"`);
  html = html.replace('</head>', '  <link rel="stylesheet" href="./region.css">\n</head>');
  return html;
}

function localiseSections(html) {
  html = html.replace(/<h1 id="hero-title">[\s\S]*?<\/h1>/, '<h1 id="hero-title">Man and van<br class="mobile-break"> &amp; removals in London.<br> <span>The right van and help<br> for your move</span></h1>');
  html = html.replace(/(<div class="services__grid" id="services-list">)[\s\S]*?(\n        <\/div>\n        <button class="services__more")/, (match, start, end) => start + '\n' + services.map(service => `          <article class="service-card">
            <img class="service-card__image" src="${asset(service.image)}" width="413" height="240" alt="${service.alt}" loading="lazy" decoding="async">
            <h3>${service.title}</h3><p class="service-card__description">${service.description}</p>
            <ul class="service-card__features">${service.features.map(text => `<li>${text}</li>`).join('')}</ul>
            <div class="service-card__actions"><button class="button service-card__order" type="button" data-open-dialog data-service="${service.id}">Get a quote</button><button class="social" type="button" data-demo-contact="WhatsApp" aria-label="WhatsApp: ${service.title}"><img src="${asset('whatsapp.svg')}" width="48" height="48" alt=""></button></div>
          </article>`).join('\n') + end);
  html = html.replace(/<table class="tariffs__table"[\s\S]*?<\/table>/, `<table class="tariffs__table" aria-label="How moving quotes are arranged">
    <colgroup><col><col><col></colgroup><thead><tr><th scope="col">Moving option</th><th scope="col">What we plan</th><th scope="col">Quote basis</th></tr></thead>
    <tbody>${[
      ['Man and van', 'Van and driver; loading help agreed for your items', 'Hourly or fixed'],
      ['Van + two movers', 'The van, carrying, loading and unloading', 'Hourly or fixed'],
      ['Flat or house move', 'Volume, team, access and any packing required', 'After assessment'],
      ['Furniture collection', 'Item size, collection slot and delivery access', 'Per job'],
      ['Student move', 'Boxes, bags and furniture from your room', 'Per job'],
      ['Storage move', 'Items, unit access and collection or delivery', 'Per job']
    ].map(row => `<tr><th scope="row">${row[0]}</th><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('\n')}</tbody></table>
    <p class="uk-pricing-note">Quotes are in GBP (£). Your items, route, stairs, parking and extra services affect the total. Any minimum booking, waiting time or additional charges are explained before you book.</p>`);
  html = html.replace(/<section class="faq"[\s\S]*?<\/section>/, `<section class="faq" id="faq" aria-labelledby="faq-title"><h2 id="faq-title">Questions before you book</h2><div class="faq__columns">${[[0,2,4],[1,3,5]].map(indices => `<div class="faq__column">${indices.map(index => `<div class="faq-item"><h3><button class="faq-item__trigger" type="button" aria-expanded="false" aria-controls="faq-answer-${index+1}">${faq[index][0]}<span class="faq-item__icon" aria-hidden="true"></span></button></h3><div class="faq-item__answer" id="faq-answer-${index+1}" aria-hidden="true"><div class="faq-item__answer-inner"><p>${faq[index][1]}</p></div></div></div>`).join('\n')}</div>`).join('\n')}</div></section>`);
  let review = 0;
  html = html.replace(/<picture><img[^>]*review-[^>]*><\/picture>/g, () => `<picture><img src="${asset(`uk-review-${++review}.svg`)}" width="300" height="370" alt="Illustrative review layout: ${['home move','furniture collection','office move','student move','storage move'][review-1]}" loading="lazy" decoding="async"></picture>`);
  html = html.replaceAll('06_gallery_02_fleet.png', '02_services_01_uk-man-and-van.jpg');
  for (let index = 0; index < details.length; index++) {
    const id = index + 1;
    html = html.replace(new RegExp(`(<dialog class="demo-detail" id="demo-detail-${id}"[\\s\\S]*?<h2[^>]*>)[\\s\\S]*?(</h2>)`), `$1${details[index].title}$2`);
    html = html.replace(new RegExp(`(<dialog class="demo-detail" id="demo-detail-${id}"[\\s\\S]*?<div class="demo-detail__body" tabindex="0">)[\\s\\S]*?(</div>\\s*</dialog>)`), `$1${details[index].body}$2`);
  }
  return html;
}

const legalContent = {
  'privacy-policy.html': ['Privacy notice — demo', '<p>This is a website preview, not a live moving service. Sample phone numbers, email addresses, prices and reviews do not identify a trading company.</p><h2>Enquiry forms</h2><p>Forms are checked in your browser but do not send the details you enter to a server. Use sample details when testing the preview.</p><h2>Local settings</h2><p>The preview stores your cookie choice and whether the exit offer has been shown. An optional analytics marker demonstrates the settings switch; no external analytics service is connected.</p><h2>External links</h2><p>The website designer’s contact links open third-party services. Their own privacy information applies when you visit them.</p><h2>Before a business launch</h2><p>This page must be replaced with the operator’s privacy information, including its identity, contact details, enquiry handling, storage periods and any services receiving data. This demo page is not a finished privacy notice for a real business.</p>'],
  'consent.html': ['Your enquiry details — demo', '<p>The forms in this preview do not send your enquiry. Entering details only demonstrates the layout and validation.</p><h2>On a live business website</h2><p>Your name, phone number, move details and postcodes would be used to respond to your enquiry and prepare a quote. The operator must explain how this works in its own privacy notice before launch.</p><h2>No marketing signup</h2><p>The demo checkbox does not subscribe you to advertising or transfer your details to a mailing list.</p>'],
  'cookie-policy.html': ['Cookie information — demo', '<p>Cookie controls are available from the footer. They do not open automatically in this preview.</p><h2>Necessary settings</h2><p>demo_cookie_choice remembers your choice. Before a choice it lasts for the browser session; a saved choice is retained for up to 180 days.</p><h2>Optional analytics marker</h2><p>demo_analytics demonstrates the analytics switch for up to 180 days. It does not connect to an external analytics provider and is removed when optional cookies are turned off.</p><h2>Exit offer</h2><p>Session storage remembers whether the London exit offer has been shown during this tab’s visit. It is not shared with external services.</p><h2>Live website setup</h2><p>The operator’s actual cookies and services must be reviewed and described before business launch.</p>']
};

for (const file of ['index.html', 'privacy-policy.html', 'consent.html', 'cookie-policy.html', 'thank-you.html', '404.html']) {
  let source = read(file);
  if (legalContent[file]) {
    const [title, body] = legalContent[file];
    source = source.replace(/<main\b[^>]*>[\s\S]*?<\/main>/, `<main class="legal-main" id="legal-content"><nav class="legal-breadcrumbs" aria-label="Breadcrumb"><a href="./index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">${title}</span></nav><h1>${title}</h1><div class="legal-copy">${body}</div></main>`);
  }
  let html = localiseSections(localiseLayout(source));
  const title = file === 'index.html' ? 'Demo: Man and van & removals in London' : legalContent[file]?.[0] || (file === '404.html' ? 'Demo: Page not found' : 'Demo: Thanks for your enquiry');
  const description = 'London moving website demo: man and van, home and office moves, furniture collection, student and storage moves.';
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title.replaceAll('&', '&amp;')}</title>`)
    .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*(">)/g, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/g, `$1${title.replaceAll('&', '&amp;')}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(">)/g, '$1https://perevozki-demo.vercel.app/uk/london/badge.png$2')
    .replace(/(<meta property="og:image:alt" content=")[^"]*(">)/g, '$1Man and van and removals across London$2');
  const leftovers = html.match(/[^<>\n]*[А-Яа-яЁё][^<>\n]*/g);
  if (leftovers) throw new Error(`${file}: untranslated content:\n${[...new Set(leftovers)].join('\n')}`);
  write(`${folder}/${file}`, html);
}

const phoneFormatter = `function formatUKPhone(value) {
  let digits = value.replace(/\\D/g, '');
  if (digits.startsWith('0044')) digits = digits.slice(4);
  else if (digits.startsWith('44') && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 4) + (digits.length > 4 ? ' ' + digits.slice(4, 10) : '');
}
function formatUKPhoneInput(phone, event) {
  const cursor = phone.selectionStart ?? phone.value.length;
  let before = phone.value.slice(0, cursor).replace(/\\D/g, '').length;
  let raw = phone.value;
  const digits = raw.replace(/\\D/g, '');
  if (event.inputType?.startsWith('delete') && digits === phone.dataset.previousDigits) {
    const backward = event.inputType === 'deleteContentBackward';
    const index = Math.max(0, backward ? before - 1 : before);
    raw = digits.slice(0, index) + digits.slice(index + 1);
    if (backward) before = Math.max(0, before - 1);
  }
  phone.value = formatUKPhone(raw);
  phone.dataset.previousDigits = phone.value.replace(/\\D/g, '');
  if (event.inputType?.startsWith('delete')) {
    let position = 0, count = 0;
    while (position < phone.value.length && count < before) {
      if (/\\d/.test(phone.value[position])) count++;
      position++;
    }
    phone.setSelectionRange(position, position);
  }
}`;
const dynamicCopy = {
  'Получите расчёт стоимости перевозки': 'Get a clear quote for your move',
  'и\\u00a0получить\\nрасчёт перевозки': 'and plan the help you need',
  'и\\u00a0узнайте итоговую цену до выезда машины': 'and know what’s included before you book',
  'Рассчитать перевозку': 'Get a quote', 'Перевозка со скидкой 10%': 'Move with a 10% discount',
  'Оставьте заявку прямо сейчас и': 'Request your quote now and', 'получите скидку 10% на вашу перевозку': 'get 10% off your move', 'Получить скидку 10%': 'Get 10% off',
  'Демо: ссылка на ': 'Demo: ', ' пока не подключена': ' contact is not connected', 'Свернуть услуги': 'Show fewer services', 'Смотреть ещё': 'Show more services',
  'Этот раздел появится на следующем этапе вёрстки': 'This section is not available in the demo', 'Заполните все поля и подтвердите согласие.': 'Complete the required fields and tick the privacy checkbox.', 'Проверьте номер телефона.': 'Enter a UK number with 10 digits after +44.', 'Демо: отправка заявки пока не подключена': 'Demo: no enquiry has been sent'
};
for (const file of ['script.js','legal.js']) {
  let js = read(file).replaceAll("'./assets/", "'../../assets/");
  js = js.replace(/function formatBelarusPhone\(value\) \{[\s\S]*?\n\}/, phoneFormatter)
    .replaceAll('formatBelarusPhone', 'formatUKPhone').replaceAll('.length !== 9', '.length !== 10')
    .replaceAll('phone.value = formatUKPhone(phone.value)', 'formatUKPhoneInput(phone, event)');
  if (file === 'script.js') js = js.replace(/const serviceOptions = \{[\s\S]*?\n\};/, `const serviceOptions = ${JSON.stringify(Object.fromEntries(services.map(service => [service.id, {title:service.title,heading:service.heading,tail:'and plan the help you need',button:'Get a quote'}])), null, 2)};`);
  js = replaceCopy(js, dynamicCopy);
  write(`${folder}/${file}`, js);
}
let presentation = read('demo-presentation.js').replace("' из\\u00a0'", "' of '");
write(`${folder}/demo-presentation.js`, presentation);
const cookieCopy = {
  'Файлы cookie': 'Cookies', 'Мы сохраняем ваш выбор настроек. Аналитические cookie в&nbsp;этом демо показаны без&nbsp;подключения внешней статистики. Подробнее&nbsp;— в&nbsp;': 'Your preferences are saved locally. Optional cookies demonstrate the controls without external analytics. Read our ',
  'Политике в&nbsp;отношении обработки файлов&nbsp;cookie': 'cookie information', 'Принять всё': 'Accept all', 'Только необходимые': 'Necessary only', 'Настроить': 'Settings', 'Вернуться к выбору cookie': 'Back to cookie choices', 'Настройка cookie': 'Cookie settings',
  'Необходимые файлы сохраняют ваш выбор. Аналитические можно включить или&nbsp;отключить.': 'Necessary cookies save your choice. Optional cookies can be turned on or off.', 'Всегда разрешены': 'Always on', 'Необходимые': 'Necessary', 'Аналитические': 'Optional analytics',
  'Cookie demo_cookie_choice хранит состояние выбора: до&nbsp;ответа — в&nbsp;течение сеанса, после ответа — до&nbsp;180 дней. Настройки доступны через кнопку в&nbsp;футере.': 'demo_cookie_choice saves your choice for the session before you decide, then for up to 180 days. You can change it from the footer.',
  'В&nbsp;демо сохраняется только маркер demo_analytics на&nbsp;180 дней: он&nbsp;показывает работу переключателя. Данные внешним сервисам не&nbsp;передаются.': 'demo_analytics is a local marker kept for up to 180 days to demonstrate this switch. No data is sent to external analytics services.',
  'Разрешить аналитические cookie': 'Allow optional analytics cookies', 'Подробности&nbsp;— в&nbsp;': 'Read our ', 'Сохранить выбор': 'Save preferences', 'Включены': 'On', 'Выключены': 'Off'
};
write(`${folder}/cookie-consent.js`, replaceCopy(read('cookie-consent.js'), cookieCopy));
const manifest = JSON.parse(read('site.webmanifest'));
manifest.name = 'London man and van website demo'; manifest.short_name = 'London moving demo'; manifest.lang = 'en-GB'; manifest.start_url = './';
manifest.icons.forEach(icon => { icon.src = icon.src.replace('./assets/', asset('')); });
write(`${folder}/site.webmanifest`, JSON.stringify(manifest, null, 2) + '\n');
console.log('Built /uk/london/: six English pages, UK phone controllers and shared layout/assets.');
