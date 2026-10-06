import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

// The Brest pages remain the source of layout and content. City editions are
// rebuilt on every deployment; edit the source/configuration, not generated city folders.
const root = new URL('./', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');
const write = (file, content) => writeFileSync(new URL(file, root), content.replace(/\r/g, ''));
const cities = [{
  slug: 'moscow',
  country: 'RU',
  names: { 'Бресту': 'Москве', 'Бресте': 'Москве', 'Бреста': 'Москвы', 'Брест': 'Москва' },
  phone: '+7 (905) 555-66-77',
  prices: [1500, 2900, 3500, 800, 2900, 13600]
}, {
  slug: 'minsk',
  country: 'BY',
  names: { 'Бресту': 'Минску', 'Бресте': 'Минске', 'Бреста': 'Минска', 'Брест': 'Минск' }
}];

const russianFormatter = `function formatRussianPhone(value) {
  let digits = value.replace(/\\D/g, '');
  if (digits.length > 10 && /^[78]/.test(digits)) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (!digits) return '';
  return '(' + digits.slice(0, 3)
    + (digits.length >= 3 ? ')' : '')
    + (digits.length > 3 ? ' ' + digits.slice(3, 6) : '')
    + (digits.length > 6 ? '-' + digits.slice(6, 8) : '')
    + (digits.length > 8 ? '-' + digits.slice(8, 10) : '');
}

function formatRussianPhoneInput(phone, event) {
  const cursor = phone.selectionStart ?? phone.value.length;
  let before = phone.value.slice(0, cursor).replace(/\\D/g, '').length;
  let raw = phone.value;
  const digits = raw.replace(/\\D/g, '');
  // When Backspace/Delete removes a separator, remove the adjacent digit too.
  // Otherwise formatting would recreate that separator and trap the cursor.
  if (event.inputType?.startsWith('delete') && digits === phone.dataset.previousDigits) {
    const backward = event.inputType === 'deleteContentBackward';
    const index = backward ? before - 1 : before;
    raw = digits.slice(0, Math.max(0, index)) + digits.slice(Math.max(0, index) + 1);
    if (backward) before = Math.max(0, before - 1);
  }
  phone.value = formatRussianPhone(raw);
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

function buildCity(city) {
  const localizeCity = value => value.replace(/Бресту|Бресте|Бреста|Брест/g, name => city.names[name]);
  const amount = value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;');
  mkdirSync(new URL(`${city.slug}/`, root), { recursive: true });

  for (const file of ['index.html', 'privacy-policy.html', 'consent.html', 'cookie-policy.html', 'thank-you.html', '404.html']) {
    let html = localizeCity(read(file))
      .replace('<html lang="ru">', `<html lang="ru" data-city="${city.slug}">`)
      .replace('<base href="/">', `<base href="/${city.slug}/">`);
    if (city.country === 'RU') html = html
      .replaceAll('+375&nbsp;(33)&nbsp;555-66-77', city.phone.replaceAll(' ', '&nbsp;'))
      .replaceAll('+375 (33) 555-66-77', city.phone)
      .replaceAll('ru_BY', 'ru_RU')
      .replaceAll('belarus-flag.svg', 'russia-flag.svg')
      .replaceAll('<span class="phone-field__code">+375</span>', '<span class="phone-field__code">+7</span>')
      .replaceAll('29 491-19-11', '(905) 555-66-77')
      .replaceAll('Номер телефона Беларуси после кода +375', 'Номер телефона России после кода +7');

    // Freight demo contacts only. The author's real WhatsApp/QR stays intact.
    if (city.country === 'RU') {
      html = html.replace(/\s*<button\b[^>]*data-demo-contact="Viber"[^>]*>[\s\S]*?<\/button>/g, '');
      html = html.replace(/<button\b[^>]*data-demo-contact="WhatsApp"[^>]*>[\s\S]*?<\/button>/g,
        button => button.replaceAll('WhatsApp', 'MAX').replaceAll('whatsapp.svg', 'max.svg'));
    }

    // Share styles/images/scripts, except localized phone + service controllers.
    html = html.replace(/\.\/assets\//g, '../assets/');
    html = html.replace(/(href|src)="\.\/([^"/]+\.(?:css|js))"/g,
      (match, attribute, asset) => `${attribute}="${['script.js', 'legal.js'].includes(asset) ? './' : '../'}${asset}"`);
    if (city.country === 'RU') html = html.replace('</head>', '  <link rel="stylesheet" href="../city-variants.css">\n</head>');
    html = html.replace('content="../assets/badge.png"', `content="https://perevozki-demo.vercel.app/${city.slug}/badge.png"`);

    if (file === 'index.html' && city.prices) {
      html = html.replace('от&nbsp;50&nbsp;руб./час', `от&nbsp;${amount(city.prices[0])}&nbsp;₽/час`);
      let row = 0;
      html = html.replace(/<td>от&nbsp;\d+&nbsp;руб\.(\/час(?: чел\.)?)?<\/td>/g, (_, unit = '') =>
        `<td>от&nbsp;${amount(city.prices[row++])}&nbsp;₽${unit}</td>`);
      if (row !== city.prices.length) throw new Error(`Tariff structure changed: found ${row} rows`);
    }
    if (/Брест/.test(html)) throw new Error(`Unlocalized city in ${city.slug}/${file}`);
    if (city.country === 'RU' && /Беларус|\+375(?:&nbsp;| )\(33\)|руб\./.test(html)) throw new Error(`Unlocalized Russian content in ${file}`);
    write(`${city.slug}/${file}`, html);
  }

  for (const file of ['script.js', 'legal.js']) {
    let js = localizeCity(read(file)).replaceAll("'./assets/", "'../assets/");
    if (city.country === 'RU') {
      const formatter = /function formatBelarusPhone\(value\) \{[\s\S]*?\r?\n\}/;
      if (!formatter.test(js)) throw new Error(`Phone formatter missing in ${file}`);
      js = js.replace(formatter, () => russianFormatter)
        .replaceAll(".length !== 9", ".length !== 10")
        .replaceAll('phone.value = formatBelarusPhone(phone.value)', 'formatRussianPhoneInput(phone, event)');
    }
    write(`${city.slug}/${file}`, js);
  }

  const manifest = JSON.parse(localizeCity(read('site.webmanifest')));
  manifest.start_url = './';
  manifest.icons.forEach(icon => { icon.src = icon.src.replace('./assets/', '../assets/'); });
  write(`${city.slug}/site.webmanifest`, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Built /${city.slug}/: six pages, two phone controllers and manifest; shared layout/assets.`);
}

for (const city of cities) buildCity(city);
