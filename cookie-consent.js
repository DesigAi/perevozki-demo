// Demo consent manager. Analytics is represented by a local marker cookie;
// no external analytics service is loaded by this template.
(() => {
  const choiceName = 'demo_cookie_choice';
  const analyticsName = 'demo_analytics';
  const maxAge = 60 * 60 * 24 * 180;
  const readCookie = name => document.cookie.split('; ').find(part => part.startsWith(name + '='))?.slice(name.length + 1);
  const cookieOptions = `Path=/; SameSite=Lax; ${location.protocol === 'https:' ? 'Secure; ' : ''}`;
  const setCookie = (name, value, age = maxAge) => { document.cookie = `${name}=${value}; ${cookieOptions}${age === null ? '' : `Max-Age=${age}`}`; };
  const deleteCookie = name => { document.cookie = `${name}=; ${cookieOptions}Max-Age=0`; };
  const readLocalChoice = () => {
    try { return localStorage.getItem(choiceName); } catch { return null; }
  };
  const readChoice = () => {
    const value = readCookie(choiceName) || (location.protocol === 'file:' ? readLocalChoice() : null);
    return value === 'all' || value === 'necessary' ? value : null;
  };
  let choice = readChoice();
  if (!choice && !readCookie(choiceName)) setCookie(choiceName, 'pending', null);
  if (choice === 'all') {
    if (!readCookie(analyticsName)) setCookie(analyticsName, '1');
  } else deleteCookie(analyticsName);

  const banner = document.createElement('section');
  banner.className = 'cookie-banner';
  banner.setAttribute('aria-labelledby', 'cookie-banner-title');
  banner.innerHTML = `
    <h2 id="cookie-banner-title">Файлы cookie</h2>
    <p>Мы сохраняем ваш выбор настроек. Аналитические cookie в&nbsp;этом демо показаны без&nbsp;подключения внешней статистики. Подробнее&nbsp;— в&nbsp;<a href="./cookie-policy.html" target="_blank" rel="noopener noreferrer">Политике в&nbsp;отношении обработки файлов&nbsp;cookie</a>.</p>
    <div class="cookie-banner__actions">
      <button type="button" data-cookie-action="all">Принять всё</button>
      <button type="button" data-cookie-action="necessary">Только необходимые</button>
      <button type="button" data-cookie-action="settings">Настроить</button>
    </div>`;

  const overlay = document.createElement('div');
  overlay.className = 'cookie-settings-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="cookie-settings" role="dialog" aria-modal="false" aria-labelledby="cookie-settings-title">
      <header class="cookie-settings__header">
        <button type="button" class="cookie-settings__back" aria-label="Вернуться к выбору cookie">←</button>
        <span>Файлы cookie</span>
      </header>
      <div class="cookie-settings__body">
        <h2 id="cookie-settings-title">Настройка cookie</h2>
        <p class="cookie-settings__intro">Необходимые файлы сохраняют ваш выбор. Аналитические можно включить или&nbsp;отключить.</p>
        <details class="cookie-settings__group">
          <summary>Необходимые <span>Всегда разрешены</span></summary>
          <p>Cookie demo_cookie_choice хранит состояние выбора: до&nbsp;ответа — в&nbsp;течение сеанса, после ответа — до&nbsp;180 дней. Без&nbsp;него сайт повторно спросит о&nbsp;настройках.</p>
        </details>
        <details class="cookie-settings__group">
          <summary>Аналитические <span class="cookie-settings__analytics-state">Выключены</span></summary>
          <p>В&nbsp;демо сохраняется только маркер demo_analytics на&nbsp;180 дней: он&nbsp;показывает работу переключателя. Данные внешним сервисам не&nbsp;передаются.</p>
          <label class="cookie-settings__switch">
            <input type="checkbox" role="switch" aria-label="Разрешить аналитические cookie">
            <span class="cookie-settings__track" aria-hidden="true"></span>
            <span>Разрешить аналитические cookie</span>
          </label>
        </details>
        <p class="cookie-settings__more">Подробности&nbsp;— в&nbsp;<a href="./cookie-policy.html" target="_blank" rel="noopener noreferrer">Политике в&nbsp;отношении обработки файлов&nbsp;cookie</a>.</p>
      </div>
      <footer class="cookie-settings__footer"><button type="button" class="cookie-settings__save">Сохранить выбор</button></footer>
    </section>`;

  document.body.append(banner, overlay);
  const analyticsToggle = overlay.querySelector('input[type="checkbox"]');
  const analyticsState = overlay.querySelector('.cookie-settings__analytics-state');
  const settingsGroups = overlay.querySelectorAll('.cookie-settings__group');
  const settingsBody = overlay.querySelector('.cookie-settings__body');
  const back = overlay.querySelector('.cookie-settings__back');
  let opener = null;
  const syncToggle = () => { analyticsState.textContent = analyticsToggle.checked ? 'Включены' : 'Выключены'; };
  const closeSettings = (showBanner = true) => {
    overlay.hidden = true;
    banner.hidden = !showBanner;
    if (showBanner && opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  };
  const openSettings = trigger => {
    opener = trigger;
    settingsGroups.forEach(group => { group.open = false; });
    settingsBody.scrollTop = 0;
    analyticsToggle.checked = choice === 'all';
    syncToggle();
    banner.hidden = true;
    overlay.hidden = false;
    back.focus();
  };
  const saveChoice = next => {
    choice = next;
    setCookie(choiceName, next);
    if (location.protocol === 'file:') {
      try { localStorage.setItem(choiceName, next); } catch { /* File previews may block storage. */ }
    }
    if (next === 'all') setCookie(analyticsName, '1');
    else deleteCookie(analyticsName);
    const returnTarget = opener?.closest('.cookie-banner') ? document.querySelector('.site-header .brand') : opener || document.querySelector('.site-header .brand');
    banner.hidden = true;
    closeSettings(false);
    returnTarget?.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { analytics: next === 'all' } }));
  };

  banner.hidden = choice !== null;
  banner.addEventListener('click', event => {
    const button = event.target.closest('[data-cookie-action]');
    if (!button) return;
    if (button.dataset.cookieAction === 'settings') openSettings(button);
    else saveChoice(button.dataset.cookieAction);
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-cookie-settings]');
    if (button) {
      overlay.hidden = true;
      banner.hidden = false;
      banner.querySelector('[data-cookie-action="all"]').focus({ preventScroll: true });
    }
  });
  analyticsToggle.addEventListener('change', syncToggle);
  overlay.querySelector('.cookie-settings__save').addEventListener('click', () => saveChoice(analyticsToggle.checked ? 'all' : 'necessary'));
  back.addEventListener('click', () => closeSettings());
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') closeSettings();
  });
  window.demoCookieConsent = { analyticsAllowed: () => choice === 'all' };
})();
