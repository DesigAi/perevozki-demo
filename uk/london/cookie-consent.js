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
  // Demo previews open consent controls only from the footer.
  banner.hidden = true;
  banner.setAttribute('aria-labelledby', 'cookie-banner-title');
  banner.innerHTML = `
    <h2 id="cookie-banner-title">Cookies</h2>
    <p>Your preferences are saved locally. Optional cookies demonstrate the controls without external analytics. Read our <a href="./cookie-policy.html" target="_blank" rel="noopener noreferrer">cookie information</a>.</p>
    <div class="cookie-banner__actions">
      <button type="button" data-cookie-action="all">Accept all</button>
      <button type="button" data-cookie-action="necessary">Necessary only</button>
      <button type="button" data-cookie-action="settings">Settings</button>
    </div>`;

  const overlay = document.createElement('div');
  overlay.className = 'cookie-settings-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="cookie-settings" role="dialog" aria-modal="false" aria-labelledby="cookie-settings-title">
      <header class="cookie-settings__header">
        <button type="button" class="cookie-settings__back" aria-label="Back to cookie choices">←</button>
        <span>Cookies</span>
      </header>
      <div class="cookie-settings__body">
        <h2 id="cookie-settings-title">Cookie settings</h2>
        <p class="cookie-settings__intro">Necessary cookies save your choice. Optional cookies can be turned on or off.</p>
        <details class="cookie-settings__group">
          <summary>Necessary <span>Always on</span></summary>
          <p>demo_cookie_choice saves your choice for the session before you decide, then for up to 180 days. You can change it from the footer.</p>
        </details>
        <details class="cookie-settings__group">
          <summary>Optional analytics <span class="cookie-settings__analytics-state">Off</span></summary>
          <p>demo_analytics is a local marker kept for up to 180 days to demonstrate this switch. No data is sent to external analytics services.</p>
          <label class="cookie-settings__switch">
            <input type="checkbox" role="switch" aria-label="Allow optional analytics cookies">
            <span class="cookie-settings__track" aria-hidden="true"></span>
            <span>Allow optional analytics cookies</span>
          </label>
        </details>
        <p class="cookie-settings__more">Read our <a href="./cookie-policy.html" target="_blank" rel="noopener noreferrer">cookie information</a>.</p>
      </div>
      <footer class="cookie-settings__footer"><button type="button" class="cookie-settings__save">Save preferences</button></footer>
    </section>`;

  document.body.append(banner, overlay);
  const analyticsToggle = overlay.querySelector('input[type="checkbox"]');
  const analyticsState = overlay.querySelector('.cookie-settings__analytics-state');
  const settingsGroups = overlay.querySelectorAll('.cookie-settings__group');
  const settingsBody = overlay.querySelector('.cookie-settings__body');
  const back = overlay.querySelector('.cookie-settings__back');
  let opener = null;
  const syncToggle = () => { analyticsState.textContent = analyticsToggle.checked ? 'On' : 'Off'; };
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

  banner.hidden = true;
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
