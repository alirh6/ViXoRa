// src/pages/auth/login/login.js

import { login } from '../../../core/services/auth-service.js';
import {
  auT,
  auBg,
  auHero,
  auCardHead,
  auFld,
  auCta,
  auSecureNote,
  AU_ICONS,
  bindLangPills,
  bindTilt,
  bindPasswordField,
  fieldError,
  fieldClear,
  ctaState,
  shakeCard,
} from '../auth-ui.js';

export function createLoginPage(ctx) {
  let root = null;
  let card = null;
  let isSubmitting = false;
  let unsubs = [];
  let offs = [];

  function render() {
    return `
      <main class="au-scene" data-au-page="login">
        ${auBg()}
        <div class="au-shell">
          ${auHero()}
          <section class="au-card" data-au-card>
            ${auCardHead({ title: auT('loginTitle'), sub: auT('loginSub') })}
            <form class="au-form" data-login-form novalidate>
              ${auFld({ name: 'username', label: auT('username'), ph: auT('usernamePh'), autoComplete: 'username', icon: AU_ICONS.id })}
              ${auFld({ name: 'password', type: 'password', pw: true, label: auT('password'), ph: auT('passwordPh'), autoComplete: 'current-password', icon: AU_ICONS.lock })}
              <p class="au-msg" data-form-message></p>
              ${auCta('auLoginCta', auT('loginCta'))}
            </form>
            <p class="au-switch">${auT('toRegister')}<a href="/register" data-link>${auT('toRegisterLink')}</a></p>
            ${auSecureNote()}
            <a class="au-back" href="/" data-link>🏠 ${auT('backHome')}</a>
          </section>
        </div>
      </main>
    `;
  }

  function setMessage(message, type = 'error') {
    const el = root?.querySelector('[data-form-message]');
    if (!el) return;
    el.textContent = message || '';
    el.dataset.type = type;
  }

  function fld(name) {
    return root?.querySelector(`[data-login-form] [name="${name}"]`)?.closest('.au-fld') || null;
  }

  function clearAll() {
    fieldClear(fld('username'));
    fieldClear(fld('password'));
  }

  function teardownFx() {
    for (const f of offs.splice(0)) {
      try { f(); } catch { /* ignore */ }
    }
    for (const u of unsubs.splice(0)) {
      try { u(); } catch { /* ignore */ }
    }
  }

  function snapshot() {
    const out = {};
    root?.querySelectorAll('input[name]').forEach((i) => { out[i.name] = i.value; });
    return out;
  }

  function restore(snap) {
    for (const [k, v] of Object.entries(snap)) {
      const i = root?.querySelector(`input[name="${k}"]`);
      if (i) i.value = v;
    }
  }

  function mount() {
    teardownFx();
    const snap = root ? snapshot() : {};
    root.innerHTML = render();
    card = root.querySelector('[data-au-card]');
    root.querySelector('[data-login-form]')?.addEventListener('submit', handleSubmit);
    offs.push(bindPasswordField(root));
    offs.push(bindTilt(card));
    unsubs.push(bindLangPills(root, () => mount()));
    restore(snap);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const username = String(formData.get('username') || '').trim();
    const password = String(formData.get('password') || '');

    setMessage('');
    clearAll();

    let bad = false;
    if (!username) { fieldError(fld('username'), auT('errUsername')); bad = true; }
    if (!password) { fieldError(fld('password'), auT('errPasswordFa')); bad = true; }
    if (bad) { shakeCard(card); return; }

    isSubmitting = true;
    ctaState(root.querySelector('[data-submit-button]'), 'loading', auT('loadingLogin'));

    const result = await login(username, password);

    if (!result.success) {
      isSubmitting = false;
      ctaState(root.querySelector('[data-submit-button]'), 'idle', auT('loginCta'));
      setMessage(result.message);
      shakeCard(card);
      return;
    }

    setMessage(auT('loginCta') + ' ✓', 'success');
    ctaState(root.querySelector('[data-submit-button]'), 'done');

    window.dispatchEvent(new CustomEvent('auth:changed', { detail: { type: 'login', user: result.user } }));

    window.setTimeout(() => {
      window.appRouter?.navigate('/tools/dashboard', { replace: true });
    }, 650);
  }

  function afterRender() {
    root = document.querySelector('.au-scene');
    if (!root) return;
    mount();
  }

  function destroy() {
    teardownFx();
    root = null;
    card = null;
    isSubmitting = false;
  }

  return { render, afterRender, destroy };
}

export default createLoginPage;
