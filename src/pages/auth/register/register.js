// src/pages/auth/register/register.js

import { register } from '../../../core/services/auth-service.js';
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
  scorePassword,
  passwordChecks,
} from '../auth-ui.js';

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createRegisterPage(ctx) {
  let root = null;
  let card = null;
  let isSubmitting = false;
  let unsubs = [];
  let offs = [];

  function render() {
    return `
      <main class="au-scene" data-au-page="register">
        ${auBg()}
        <div class="au-shell">
          ${auHero()}
          <section class="au-card" data-au-card>
            ${auCardHead({ title: auT('regTitle'), sub: auT('regSub') })}
            <form class="au-form au-form--2col" data-register-form novalidate>
              ${auFld({ name: 'name', label: auT('name'), ph: auT('namePh'), autoComplete: 'name', icon: AU_ICONS.user })}
              ${auFld({ name: 'username', label: auT('username'), ph: auT('usernamePh'), autoComplete: 'username', icon: AU_ICONS.id })}
              ${auFld({ name: 'email', type: 'email', label: auT('email'), ph: auT('emailPh'), autoComplete: 'email', icon: AU_ICONS.mail, inputmode: 'email', wide: true })}
              ${auFld({ name: 'password', type: 'password', pw: true, label: auT('password'), ph: auT('passwordPh'), autoComplete: 'new-password', icon: AU_ICONS.lock, wide: true })}
              <div class="au-fld--wide">
                <div class="au-meter" data-meter data-score="0">
                  <div class="au-meter__bars"><i></i><i></i><i></i><i></i><i></i></div>
                  <div class="au-meter__row"><span>${auT('strength')}</span><span class="au-meter__val" data-meter-val></span></div>
                </div>
                <div class="au-checks" data-checks>
                  ${passwordChecks('')
                    .map((c) => `<span data-chk="${c.id}">${auT('chk' + c.id[0].toUpperCase() + c.id.slice(1))}</span>`)
                    .join('')}
                </div>
              </div>
              ${auFld({ name: 'confirmPassword', type: 'password', pw: true, label: auT('confirm'), ph: auT('confirmPh'), autoComplete: 'new-password', icon: AU_ICONS.lock, wide: true })}
              <p class="au-msg au-fld--wide" data-form-message></p>
              <div class="au-fld--wide">${auCta('auRegCta', auT('regCta'))}</div>
            </form>
            <p class="au-switch">${auT('toLogin')}<a href="/login" data-link>${auT('toLoginLink')}</a></p>
            ${auSecureNote()}
            <a class="au-back" href="/" data-link>🏠 ${auT('backHome')}</a>
          </section>
        </div>
      </main>
    `;
  }

  function fld(name) {
    return root?.querySelector(`[data-register-form] [name="${name}"]`)?.closest('.au-fld') || null;
  }

  function setMessage(message, type = 'error') {
    const el = root?.querySelector('[data-form-message]');
    if (!el) return;
    el.textContent = message || '';
    el.dataset.type = type;
  }

  function clearAll() {
    ['name', 'username', 'email', 'password', 'confirmPassword'].forEach((n) => fieldClear(fld(n)));
  }

  function paintStrength() {
    const pwInput = root?.querySelector('[data-register-form] [name="password"]');
    const meter = root?.querySelector('[data-meter]');
    if (!pwInput || !meter) return;
    const s = scorePassword(pwInput.value);
    meter.dataset.score = String(s);
    const val = root.querySelector('[data-meter-val]');
    if (val) val.textContent = pwInput.value ? auT('pwLevels')[s] : '';
    const checks = passwordChecks(pwInput.value);
    root.querySelectorAll('[data-chk]').forEach((chip) => {
      const c = checks.find((x) => x.id === chip.dataset.chk);
      chip.classList.toggle('is-ok', !!c && c.ok);
    });
  }

  function checkConfirm() {
    const p = root?.querySelector('[data-register-form] [name="password"]');
    const c = root?.querySelector('[data-register-form] [name="confirmPassword"]');
    if (!p || !c || !c.value) return;
    if (p.value === c.value) fieldClear(fld('confirmPassword'));
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

    const form = root.querySelector('[data-register-form]');
    form?.addEventListener('submit', handleSubmit);
    form?.addEventListener('input', (e) => {
      const t = e.target;
      if (!t || typeof t.name !== 'string') return;
      if (t.name === 'password') { paintStrength(); checkConfirm(); }
      if (t.name === 'confirmPassword') checkConfirm();
      const f = t.closest?.('.au-fld');
      if (f && t.value) fieldClear(f);
    });

    offs.push(bindPasswordField(root));
    offs.push(bindTilt(card));
    unsubs.push(bindLangPills(root, () => mount()));
    restore(snap);
    paintStrength();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const data = {
      name: String(formData.get('name') || '').trim(),
      username: String(formData.get('username') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || ''),
      confirmPassword: String(formData.get('confirmPassword') || ''),
    };

    setMessage('');
    clearAll();

    let bad = false;
    if (!data.name) { fieldError(fld('name'), auT('errRequiredName')); bad = true; }
    if (data.username.length < 3 || !USERNAME_PATTERN.test(data.username)) { fieldError(fld('username'), auT('errUsername')); bad = true; }
    if (!EMAIL_PATTERN.test(data.email)) { fieldError(fld('email'), auT('errEmail')); bad = true; }
    if (data.password.length < 6) { fieldError(fld('password'), auT('errPasswordFa')); bad = true; }
    if (data.password !== data.confirmPassword) { fieldError(fld('confirmPassword'), auT('errConfirm')); bad = true; }
    if (bad) { shakeCard(card); return; }

    isSubmitting = true;
    ctaState(root.querySelector('[data-submit-button]'), 'loading', auT('loadingReg'));

    const result = await register(data);

    if (!result.success) {
      isSubmitting = false;
      ctaState(root.querySelector('[data-submit-button]'), 'idle', auT('regCta'));
      setMessage(result.message);
      shakeCard(card);
      return;
    }

    setMessage(auT('regTitle') + ' ✓', 'success');
    ctaState(root.querySelector('[data-submit-button]'), 'done');

    window.dispatchEvent(new CustomEvent('auth:changed', { detail: { type: 'register', user: result.user } }));

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

export default createRegisterPage;
