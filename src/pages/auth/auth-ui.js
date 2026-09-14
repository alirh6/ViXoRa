// src/pages/auth/auth-ui.js
/**
 * ViXoRa Auth UI — جعبه‌ابزار مشترک صفحات ورود/ثبت‌نام
 * ------------------------------------------------------------------
 * دیکشنری ۴زبانه • سنجش قدرت رمز • لیبل شناور • چشمک رمز • CapsLock
 * تیلت سه‌بعدی کارت • قرص‌های زبان • خطاهای میدانی • CTA سه‌حالته
 * هیچ وابستگی خارجی — همه‌چیز با DOM خام.
 */

import { getLang, setLang, onLangChange, LANGUAGE_META, LANGUAGES } from '../../core/i18n/i18n.js';

/* ------------------------------------------------------------------ */
/* دیکشنری                                                             */
/* ------------------------------------------------------------------ */

export const AU = {
  fa: {
    brandSub: 'سکوی مدیریت یکپارچهٔ ViXoRa',
    loginTitle: 'خوش برگشتی 👋',
    loginSub: 'برای ادامه به حسابت وارد شو',
    regTitle: 'بیا شروع کنیم 🚀',
    regSub: 'تو کمتر از یک دقیقه حسابت رو بساز',
    name: 'نام و نام خانوادگی',
    username: 'نام کاربری',
    email: 'ایمیل',
    password: 'رمز عبور',
    confirm: 'تکرار رمز عبور',
    namePh: 'مثلاً نیما پارسا',
    usernamePh: 'مثلاً nima_p',
    emailPh: 'you@example.com',
    passwordPh: 'حداقل ۶ کاراکتر',
    confirmPh: 'دوباره همون رمز',
    loginCta: 'ورود به ViXoRa',
    regCta: 'ساخت حساب',
    loadingLogin: 'در حال ورود…',
    loadingReg: 'در حال ساخت…',
    toRegister: 'حساب نداری؟',
    toRegisterLink: 'یه حساب بساز',
    toLogin: 'قبلاً اومدی؟',
    toLoginLink: 'وارد شو',
    backHome: 'بازگشت به خانه',
    secure: 'اتصال امن • داده‌ها فقط روی دستگاه خودت',
    errRequiredName: 'نامت رو بنویس',
    errUsername: 'حداقل ۳ کاراکتر — فقط حرف انگلیسی، عدد، _ و -',
    errEmail: 'این ایمیل درست به نظر نمی‌رسه',
    errPasswordFa: 'رمز حداقل باید ۶ کاراکتر باشه',
    errConfirm: 'دو رمز یکسان نیستن',
    strength: 'قدرت رمز',
    pwLevels: ['خیلی ضعیف', 'ضعیف', 'متوسط', 'خوب', 'عالی', 'فوق‌العاده'],
    chkLen: '۶+ کاراکتر',
    chkCase: 'حرف بزرگ و کوچک',
    chkDigit: 'عدد',
    chkSymbol: 'نماد (@#!)',
    caps: 'CapsLock روشنه',
    showPw: 'نمایش رمز',
    hidePw: 'مخفی کردن رمز',
    feat1: 'امنیت محلی',
    feat1d: 'اطلاعاتت هیچ‌جا نمی‌ره؛ فقط روی دستگاه خودته',
    feat2: 'جعبه‌ابزار کامل',
    feat2d: 'مالی، آشپزخونه، موزیک، یادداشت و ده‌ها ابزار دیگه',
    feat3: 'شخصی‌سازی بی‌نهایت',
    feat3d: 'تم، زبان، چیدمان — همه با سلیقهٔ خودت',
    statTools: 'ابزار حرفه‌ای',
    statLocal: '۱۰۰٪ محلی و خصوصی',
    statLangs: 'زبان زنده',
    heroBadge: 'نسخهٔ v3 Pro',
  },
  en: {
    brandSub: 'The ViXoRa unified platform',
    loginTitle: 'Welcome back 👋',
    loginSub: 'Sign in to continue to your account',
    regTitle: "Let's get started 🚀",
    regSub: 'Create your account in under a minute',
    name: 'Full name',
    username: 'Username',
    email: 'Email',
    password: 'Password',
    confirm: 'Confirm password',
    namePh: 'e.g. Nima Parsa',
    usernamePh: 'e.g. nima_p',
    emailPh: 'you@example.com',
    passwordPh: 'At least 6 characters',
    confirmPh: 'Repeat the password',
    loginCta: 'Sign in to ViXoRa',
    regCta: 'Create account',
    loadingLogin: 'Signing in…',
    loadingReg: 'Creating…',
    toRegister: 'No account yet?',
    toRegisterLink: 'Create one',
    toLogin: 'Been here before?',
    toLoginLink: 'Sign in',
    backHome: 'Back to home',
    secure: 'Secure • Your data never leaves this device',
    errRequiredName: 'Please tell us your name',
    errUsername: 'Min 3 chars — letters, numbers, _ and - only',
    errEmail: "That email doesn't look right",
    errPasswordFa: 'Password must be at least 6 characters',
    errConfirm: "Passwords don't match",
    strength: 'Password strength',
    pwLevels: ['Very weak', 'Weak', 'Fair', 'Good', 'Great', 'Elite'],
    chkLen: '6+ chars',
    chkCase: 'Upper & lower',
    chkDigit: 'Number',
    chkSymbol: 'Symbol (@#!)',
    caps: 'CapsLock is on',
    showPw: 'Show password',
    hidePw: 'Hide password',
    feat1: 'Local-first security',
    feat1d: 'Your data never leaves your device',
    feat2: 'A full toolbox',
    feat2d: 'Finance, kitchen, music, notes & many more',
    feat3: 'Endless customization',
    feat3d: 'Themes, language, layout — all yours',
    statTools: 'pro tools',
    statLocal: '100% local & private',
    statLangs: 'live languages',
    heroBadge: 'v3 Pro',
  },
  fr: {
    brandSub: 'La plateforme unifiée ViXoRa',
    loginTitle: 'Content de te revoir 👋',
    loginSub: 'Connecte-toi pour continuer',
    regTitle: 'On commence 🚀',
    regSub: 'Crée ton compte en moins d’une minute',
    name: 'Nom complet',
    username: "Nom d'utilisateur",
    email: 'E-mail',
    password: 'Mot de passe',
    confirm: 'Confirmation',
    namePh: 'ex. Nima Parsa',
    usernamePh: 'ex. nima_p',
    emailPh: 'toi@exemple.com',
    passwordPh: 'Au moins 6 caractères',
    confirmPh: 'Répète le mot de passe',
    loginCta: 'Se connecter',
    regCta: 'Créer le compte',
    loadingLogin: 'Connexion…',
    loadingReg: 'Création…',
    toRegister: 'Pas de compte ?',
    toRegisterLink: 'Créez-en un',
    toLogin: 'Déjà venu ?',
    toLoginLink: 'Connecte-toi',
    backHome: "Retour à l'accueil",
    secure: 'Sécurisé • Tes données restent sur ton appareil',
    errRequiredName: 'Dis-nous ton nom',
    errUsername: 'Min. 3 caractères — lettres, chiffres, _ et -',
    errEmail: "Cet e-mail semble incorrect",
    errPasswordFa: 'Le mot de passe doit faire au moins 6 caractères',
    errConfirm: 'Les mots de passe ne correspondent pas',
    strength: 'Force du mot de passe',
    pwLevels: ['Très faible', 'Faible', 'Moyen', 'Bon', 'Top', 'Élite'],
    chkLen: '6+ caractères',
    chkCase: 'Maj. & min.',
    chkDigit: 'Chiffre',
    chkSymbol: 'Symbole (@#!)',
    caps: 'Majuscules activées',
    showPw: 'Afficher',
    hidePw: 'Masquer',
    feat1: 'Sécurité locale',
    feat1d: 'Tes données ne quittent jamais ton appareil',
    feat2: 'Boîte à outils complète',
    feat2d: 'Finances, cuisine, musique, notes et plus',
    feat3: 'Personnalisation infinie',
    feat3d: 'Thèmes, langue, disposition — à toi',
    statTools: 'outils pro',
    statLocal: '100% local & privé',
    statLangs: 'langues',
    heroBadge: 'v3 Pro',
  },
  ar: {
    brandSub: 'منصة ViXoRa الموحدة',
    loginTitle: 'أهلاً بعودتك 👋',
    loginSub: 'سجّل الدخول للمتابعة',
    regTitle: 'لنبدأ 🚀',
    regSub: 'أنشئ حسابك في أقل من دقيقة',
    name: 'الاسم الكامل',
    username: 'اسم المستخدم',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirm: 'تأكيد كلمة المرور',
    namePh: 'مثال: نیما',
    usernamePh: 'مثال: nima_p',
    emailPh: 'you@example.com',
    passwordPh: '٦ أحرف على الأقل',
    confirmPh: 'أعد كتابة كلمة المرور',
    loginCta: 'تسجيل الدخول',
    regCta: 'إنشاء الحساب',
    loadingLogin: 'جارٍ الدخول…',
    loadingReg: 'جارٍ الإنشاء…',
    toRegister: 'ليس لديك حساب؟',
    toRegisterLink: 'أنشئ واحداً',
    toLogin: 'سبق أن جئت؟',
    toLoginLink: 'سجّل الدخول',
    backHome: 'العودة للرئيسية',
    secure: 'آمن • بياناتك تبقى على جهازك فقط',
    errRequiredName: 'اكتب اسمك',
    errUsername: '٣ أحرف على الأقل — حروف وأرقام و _ و -',
    errEmail: 'هذا البريد لا يبدو صحيحاً',
    errPasswordFa: 'كلمة المرور ٦ أحرف على الأقل',
    errConfirm: 'كلمتا المرور غير متطابقتين',
    strength: 'قوة كلمة المرور',
    pwLevels: ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'جيدة', 'رائعة', 'أسطورية'],
    chkLen: '+٦ أحرف',
    chkCase: 'أحرف كبيرة وصغيرة',
    chkDigit: 'رقم',
    chkSymbol: 'رمز (@#!)',
    caps: 'CapsLock مفعّل',
    showPw: 'إظهار',
    hidePw: 'إخفاء',
    feat1: 'أمان محلي',
    feat1d: 'بياناتك لا تغادر جهازك أبداً',
    feat2: 'صندوق أدوات كامل',
    feat2d: 'مال، مطبخ، موسيقى، ملاحظات والمزيد',
    feat3: 'تخصيص بلا حدود',
    feat3d: 'الثيمات واللغة والتخطيط — كما تحب',
    statTools: 'أداة احترافية',
    statLocal: '١٠٠٪ محلي وخاص',
    statLangs: 'لغات حية',
    heroBadge: 'v3 Pro',
  },
};

export function auT(key) {
  const lang = getLang();
  return AU[lang]?.[key] ?? AU.fa[key] ?? key;
}

/* ------------------------------------------------------------------ */
/* قدرت رمز                                                            */
/* ------------------------------------------------------------------ */

export function scorePassword(pw = '') {
  let s = 0;
  if (String(pw).length >= 6) s++;
  if (String(pw).length >= 10) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s > 0 && /^(.)\1+$/.test(pw)) s = 1;
  return Math.min(s, 5);
}

export function passwordChecks(pw = '') {
  return [
    { id: 'len', ok: pw.length >= 6 },
    { id: 'case', ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { id: 'digit', ok: /\d/.test(pw) },
    { id: 'symbol', ok: /[^A-Za-z0-9]/.test(pw) },
  ];
}

/* ------------------------------------------------------------------ */
/* بایندینگ‌های مشترک                                                   */
/* ------------------------------------------------------------------ */

export function bindLangPills(root, onChange) {
  const host = root.querySelector('[data-au-langs]');
  if (!host) return () => {};

  const paint = () => {
    const lang = getLang();
    host.innerHTML = LANGUAGES.map((l) => {
      const meta = LANGUAGE_META[l] || {};
      return (
        '<button type="button" class="au-langpill' + (l === lang ? ' is-active' : '') + '" data-lang="' + l +
        '" title="' + (meta.label || l) + '">' + (meta.flag || '') + '</button>'
      );
    }).join('');
  };

  paint();
  const unsub = onLangChange(() => {
    paint();
    if (onChange) onChange();
  });

  host.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lang]');
    if (!btn) return;
    setLang(btn.dataset.lang);
  });

  return unsub;
}

export function bindTilt(card) {
  if (!card) return () => {};
  let off = () => {};
  try {
    const coarse = window.matchMedia('(pointer: coarse)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if ((coarse.matches || reduced.matches) && !coarse.addEventListener) return () => {};
    if (coarse.matches || reduced.matches) return () => {};

    const move = (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--au-ry', (px * 7).toFixed(2) + 'deg');
      card.style.setProperty('--au-rx', (-py * 6).toFixed(2) + 'deg');
    };
    const reset = () => {
      card.style.setProperty('--au-ry', '0deg');
      card.style.setProperty('--au-rx', '0deg');
    };
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', reset);
    off = () => {
      card.removeEventListener('pointermove', move);
      card.removeEventListener('pointerleave', reset);
    };
  } catch {
    /* ignore */
  }
  return off;
}

export function bindPasswordField(root) {
  const offs = [];
  root.querySelectorAll('.au-fld[data-pw]').forEach((fld) => {
    const input = fld.querySelector('input');
    const toggle = fld.querySelector('[data-pw-toggle]');
    const caps = fld.querySelector('[data-caps]');
    const eyeOn = fld.querySelector('[data-eye-on]');
    const eyeOff = fld.querySelector('[data-eye-off]');
    if (!input) return;

    if (toggle) {
      const fn = (e) => {
        e.preventDefault();
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        toggle.title = show ? auT('hidePw') : auT('showPw');
        toggle.setAttribute('aria-label', toggle.title);
        if (eyeOn) eyeOn.style.display = show ? 'none' : '';
        if (eyeOff) eyeOff.style.display = show ? '' : 'none';
        input.focus({ preventScroll: true });
      };
      toggle.addEventListener('click', fn);
      offs.push(() => toggle.removeEventListener('click', fn));
    }

    if (caps) {
      const fn = (e) => {
        let on = false;
        try {
          on = !!e.getModifierState && e.getModifierState('CapsLock');
        } catch {
          on = false;
        }
        caps.classList.toggle('is-show', on);
      };
      input.addEventListener('keyup', fn);
      input.addEventListener('keydown', fn);
      offs.push(() => {
        input.removeEventListener('keyup', fn);
        input.removeEventListener('keydown', fn);
      });
    }
  });
  return () => offs.forEach((f) => f());
}

/* خطای میدانی */
export function fieldError(fld, msg) {
  if (!fld) return;
  fld.classList.add('is-err');
  const m = fld.querySelector('.au-fld__msg');
  if (m) m.textContent = msg || '';
}

export function fieldClear(fld) {
  if (!fld) return;
  fld.classList.remove('is-err');
  const m = fld.querySelector('.au-fld__msg');
  if (m) m.textContent = '';
}

/* CTA سه‌حالته: idle | loading | done */
export function ctaState(btn, state, label) {
  if (!btn) return;
  btn.classList.remove('is-loading', 'is-done');
  if (state === 'loading') btn.classList.add('is-loading');
  if (state === 'done') btn.classList.add('is-done');
  const txt = btn.querySelector('[data-cta-txt]');
  if (txt && typeof label === 'string') txt.textContent = label;
}

export function shakeCard(card) {
  if (!card) return;
  card.classList.remove('is-shake');
  void card.offsetWidth;
  card.classList.add('is-shake');
}

/* ------------------------------------------------------------------ */
/* اسکلت‌های مارکاپ مشترک                                               */
/* ------------------------------------------------------------------ */

export function auBg() {
  return (
    '<div class="au-bg" aria-hidden="true">' +
    '<i class="au-orb au-orb--1"></i><i class="au-orb au-orb--2"></i><i class="au-orb au-orb--3"></i>' +
    '<span class="au-gridlines"></span><span class="au-noise"></span>' +
    '</div>'
  );
}

export function auHero() {
  return (
    '<section class="au-hero">' +
    '<span class="au-hero__badge"><i></i>' + auT('heroBadge') + '</span>' +
    '<div class="au-hero__logo au-logo-fx" aria-hidden="true"><span class="au-ring"></span><span class="au-core">V</span></div>' +
    '<h1 class="au-hero__title">Vi<span>X</span>oRa</h1>' +
    '<p class="au-hero__sub">' + auT('brandSub') + '</p>' +
    '<ul class="au-feats">' +
    [
      ['🛡️', 'feat1', 'feat1d'],
      ['🧰', 'feat2', 'feat2d'],
      ['🎨', 'feat3', 'feat3d'],
    ]
      .map(([ico, t, d], i) =>
        '<li style="--i:' + i + '"><span class="au-feats__ico">' + ico + '</span><span><b>' + auT(t) + '</b><small>' + auT(d) + '</small></span></li>'
      )
      .join('') +
    '</ul>' +
    '<div class="au-stats">' +
    '<span><b>۱۰+</b> ' + auT('statTools') + '</span>' +
    '<span><b>۱۰۰٪</b> ' + auT('statLocal') + '</span>' +
    '<span><b>۴</b> ' + auT('statLangs') + '</span>' +
    '</div>' +
    '<span class="au-float au-float--1">🍳</span>' +
    '<span class="au-float au-float--2">🎵</span>' +
    '<span class="au-float au-float--3">💰</span>' +
    '</section>'
  );
}

export function auCardHead({ title, sub }) {
  return (
    '<header class="au-head">' +
    '<div class="au-langrow"><span data-au-langs class="au-langs"></span></div>' +
    '<div class="au-mini-logo" aria-hidden="true"><span class="au-ring"></span><span class="au-core">V</span></div>' +
    '<h1 class="au-title">' + title + '</h1>' +
    '<p class="au-sub">' + sub + '</p>' +
    '</header>'
  );
}

export function auFld({ name, type = 'text', label, ph, autoComplete = 'off', icon, pw = false, inputmode = '', wide = false }) {
  const eye =
    pw
      ? '<button type="button" class="au-eye" data-pw-toggle title="" aria-label="">' +
        '<svg data-eye-on width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' +
        '<svg data-eye-off width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="display:none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
        '</button>'
      : '';
  const caps = pw ? '<span class="au-caps" data-caps>⇪ ' + auT('caps') + '</span>' : '';
  return (
    '<div class="au-fld' + (pw ? ' au-fld--pw' : '') + (wide ? ' au-fld--wide' : '') + '"' + (pw ? ' data-pw' : '') + '>' +
    '<input name="' + name + '" type="' + type + '" placeholder=" " autocomplete="' + autoComplete + '"' + (inputmode ? ' inputmode="' + inputmode + '"' : '') + ' />' +
    '<span class="au-fld__ico">' + icon + '</span>' +
    '<label>' + label + '</label>' +
    eye + caps +
    '<small class="au-fld__msg" aria-live="polite"></small>' +
    '</div>'
  );
}

export const AU_ICONS = {
  user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 6L22 7"/></svg>',
  lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="3"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  id: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M3 12h18"/></svg>',
};

export function auCta(id, label) {
  return (
    '<button class="au-cta" id="' + id + '" type="submit" data-submit-button>' +
    '<span class="au-cta__txt" data-cta-txt>' + label + '</span>' +
    '<span class="au-cta__spin" aria-hidden="true"></span>' +
    '<span class="au-cta__done" aria-hidden="true">' +
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
    '</span>' +
    '</button>'
  );
}

export function auSecureNote() {
  return (
    '<p class="au-secure">' +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="3"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
    auT('secure') + '</p>'
  );
}
