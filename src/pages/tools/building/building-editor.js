// src/pages/tools/building/building-editor.js

/**
 * ساختمون‌یار — ویرایشگر (همه مودال‌ها و فرم‌ها) 📝
 * هر مودال یک Promise برمی‌گرداند: draft یا null (انصراف)
 */

import { createModal, confirmDialog } from '../../../utilities/modal.js';
import { escapeHtml } from '../../../utilities/dom-utils.js';
import {
  imageFileToDataURL,
  faNum,
  toISODateInput,
  faDate,
  parseTransferPayload,
  importBuildingPackage,
  EXPENSE_CATS,
  TICKET_CATS,
  COMPLAINT_CATS,
  SUGGEST_AREAS,
  DOC_KINDS,
  PAY_METHODS,
} from './building-store.js';

/* ================================================================== */
/* اجزای فرم                                                               */
/* ================================================================== */

function row(label, inner, hint = '') {
  return `<label class="bld-f-row"><span class="bld-f-label">${label}</span>${inner}${hint ? `<small class="bld-f-hint">${hint}</small>` : ''}</label>`;
}

const txt = (name, val = '', ph = '', extra = '') =>
  `<input class="bld-f-input" name="${name}" value="${escapeHtml(val)}" placeholder="${escapeHtml(ph)}" ${extra}>`;
const num = (name, val = '', ph = '', extra = '') =>
  `<input class="bld-f-input" type="number" inputmode="numeric" min="0" name="${name}" value="${escapeHtml(val)}" placeholder="${escapeHtml(ph)}" ${extra}>`;
const ta = (name, val = '', ph = '', rows = 3) =>
  `<textarea class="bld-f-input" name="${name}" rows="${rows}" placeholder="${escapeHtml(ph)}">${escapeHtml(val)}</textarea>`;
const sel = (name, options, val = '') =>
  `<select class="bld-f-input" name="${name}">${options.map((o) => `<option value="${escapeHtml(o.v)}"${String(o.v) === String(val) ? ' selected' : ''}>${escapeHtml(o.t)}</option>`).join('')}</select>`;
const file = (name) =>
  `<input class="bld-f-input" type="file" name="${name}" accept="image/*"><img class="bld-f-preview hidden" alt="پیش‌نمایش">`;
const chk = (name, label, checked = false) =>
  `<label class="bld-f-check"><input type="checkbox" name="${name}"${checked ? ' checked' : ''}><span>${label}</span></label>`;

function formShell(inner) {
  return `<form class="bld-form" onsubmit="return false">${inner}<p class="bld-f-err hidden"></p></form>`;
}

function formData(dialog) {
  const form = dialog.querySelector('.bld-form');
  const out = {};
  form.querySelectorAll('[name]').forEach((el) => {
    if (el.type === 'checkbox') out[el.name] = el.checked;
    else if (el.type === 'file') out[`${el.name}__file`] = el.files?.[0] || null;
    else out[el.name] = el.value;
  });
  return out;
}

function formError(dialog, msg) {
  const el = dialog.querySelector('.bld-f-err');
  if (!el) return;
  if (!msg) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.classList.remove('hidden');
  el.textContent = msg;
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 220 }
  );
}

async function resolveImages(draft, names) {
  for (const n of names) {
    const f = draft[`${n}__file`];
    delete draft[`${n}__file`];
    if (f) {
      try {
        draft[n] = await imageFileToDataURL(f);
      } catch {
        draft[n] = '';
      }
    } else if (draft[n] === undefined) {
      draft[n] = '';
    }
  }
  return draft;
}

function wireFilePreviews(dialog) {
  dialog.querySelectorAll('input[type="file"]').forEach((inp) => {
    inp.addEventListener('change', () => {
      const img = inp.parentElement.querySelector('.bld-f-preview');
      const f = inp.files?.[0];
      if (!img) return;
      if (f) {
        img.src = URL.createObjectURL(f);
        img.classList.remove('hidden');
      } else {
        img.classList.add('hidden');
      }
    });
  });
}

function baseModal({ title, bodyHtml, saveLabel, size = 'default', onValidate, onSave, extraActions = [] }) {
  return new Promise((resolve) => {
    let result = null;
    let saved = false;
    const modal = createModal({
      title,
      bodyHtml,
      size,
      actions: [
        ...extraActions,
        { id: 'cancel', label: 'انصراف' },
        {
          id: 'save',
          label: saveLabel,
          variant: 'primary',
          onClick: async ({ dialog, button }) => {
            formError(dialog, '');
            const draft = formData(dialog);
            const err = onValidate ? onValidate(draft, dialog) : '';
            if (err) {
              formError(dialog, err);
              return false;
            }
            try {
              button.disabled = true;
              result = onSave ? await onSave(draft, dialog) : draft;
              saved = true;
            } catch (e) {
              formError(dialog, e?.message || 'خطایی رخ داد.');
              button.disabled = false;
              return false;
            }
          },
        },
      ],
      onOpen: (api) => wireFilePreviews(api.bodyElement || document),
      onClose: (reason) => resolve(reason === 'save' && saved ? result : null),
    });
    modal.open();
  });
}

const req = (v, msg) => (String(v || '').trim() ? '' : msg);
const posNum = (v, msg) => (Number(v) > 0 ? '' : msg);

/* ================================================================== */
/* ساختمان: ساخت + کد                                                      */
/* ================================================================== */

export function buildingCreateModal() {
  return baseModal({
    title: '🏢 ساخت ساختمان جدید',
    saveLabel: 'ساخت و دریافت کد ✨',
    size: 'wide',
    bodyHtml: formShell(
      row('نام ساختمان *', txt('name', '', 'مثلاً: برج سپیدار')) +
        row('شهر', txt('city', '', 'تهران')) +
        row('آدرس', txt('address', '', 'خیابان، کوچه، پلاک…')) +
        `<div class="bld-f-grid">` +
        row('تعداد طبقات *', num('floors', '4', '۴')) +
        row('واحد در هر طبقه *', num('unitsPerFloor', '3', '۳')) +
        `</div>` +
        row('موجودی اولیه صندوق (تومان)', num('fundStart', '0', '۰'), 'پولی که الان تو صندوق ساختمان هست') +
        row('عکس ساختمان (اختیاری)', file('cover')) +
        row('قوانین ساختمان', ta('rules', '', 'هر قانون در یک خط…', 4))
    ),
    onValidate: (d) =>
      req(d.name, 'نام ساختمان لازم است.') ||
      (Number(d.floors) >= 1 && Number(d.floors) <= 30 ? '' : 'طبقات باید بین ۱ تا ۳۰ باشد.') ||
      (Number(d.unitsPerFloor) >= 1 && Number(d.unitsPerFloor) <= 12 ? '' : 'واحد در طبقه باید بین ۱ تا ۱۲ باشد.'),
    onSave: (d) => resolveImages(d, ['cover']),
  });
}

export function showCodeModal(building) {
  return new Promise((resolve) => {
    const modal = createModal({
      title: '🎉 ساختمان ساخته شد!',
      bodyHtml: `<div class="bld-code-show">
        <p>این کد را به ساکنین بدهید تا با آن وارد ساختمان شوند:</p>
        <button type="button" class="bld-code-big" id="bldCopyCode" title="کلیک برای کپی">${escapeHtml(building.code)}</button>
        <p class="bld-f-hint">ساختمان: ${escapeHtml(building.name)} — ${faNum(building.floors * building.unitsPerFloor)} واحد در ${faNum(building.floors)} طبقه</p>
      </div>`,
      actions: [{ id: 'ok', label: 'ورود به ساختمان 🚀', variant: 'primary' }],
      onOpen: (api) => {
        const btn = api.bodyElement?.querySelector('#bldCopyCode');
        btn?.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(building.code);
            btn.textContent = 'کپی شد! ✅';
            setTimeout(() => (btn.textContent = building.code), 1200);
          } catch {
            /* ignore */
          }
        });
      },
      onClose: () => resolve(true),
    });
    modal.open();
  });
}

export function joinCodeModal() {
  return baseModal({
    title: '🔑 ورود با کد ساختمان',
    saveLabel: 'پیدا کردن ساختمان 🔍',
    bodyHtml: formShell(row('کد ۶ حرفی ساختمان *', txt('code', '', 'مثلاً: K7M2QX', 'style="text-align:center;letter-spacing:6px;font-weight:800" maxlength="8"'), 'کد را از مدیر بگیرید (دستگاه جدید؟ اول «بازیابی ساختمان» در صفحه اول)')),
    onValidate: (d) => req(d.code, 'کد را وارد کنید.'),
  }).then((r) => (r ? r.code : null));
}

export function joinProfileModal(slotText) {
  return baseModal({
    title: `🏠 عضویت در ${slotText}`,
    saveLabel: 'عضویت در ساختمان 🎉',
    size: 'wide',
    bodyHtml: formShell(
      row('نام سرپرست واحد *', txt('headName', '', 'نام و نام خانوادگی')) +
        `<div class="bld-f-grid">` +
        row('نام خانوادگی (پلاک)', txt('family', '', 'مثلاً: کریمی')) +
        row('موبایل', txt('phone', '', '۰۹…')) +
        `</div>` +
        `<div class="bld-f-grid">` +
        row('نوع سکونت', sel('ownerType', [{ v: 'owner', t: 'مالک 🏠' }, { v: 'tenant', t: 'مستأجر 🔑' }])) +
        row('تعداد ساکنین', num('residents', '2', '۲')) +
        `</div>` +
        `<div class="bld-f-grid">` +
        row('پلاک ماشین', txt('carPlate', '', '۱۲ب۳۴۵-۱۱')) +
        row('مدل ماشین', txt('carType', '', 'پژو ۲۰۷')) +
        `</div>` +
        row('حیوان خانگی', txt('pets', '', 'مثلاً: یک گربه 🐱')) +
        row('درباره واحد', ta('bio', '', 'یه جمله درباره خودتون…', 2)) +
        row('عکس واحد', file('photo'))
    ),
    onValidate: (d) => req(d.headName, 'نام سرپرست لازم است.'),
    onSave: async (d) => {
      await resolveImages(d, ['photo']);
      d.cars = d.carPlate?.trim() ? [{ plate: d.carPlate.trim(), type: d.carType?.trim() || '' }] : [];
      return d;
    },
  });
}

/* ================================================================== */
/* پست‌ها                                                                  */
/* ================================================================== */

const KIND_META = {
  charge: { title: '🧾 صدور شارژ ماهانه', save: 'صدور شارژ ✨' },
  expense: { title: '💸 ثبت هزینه جدید', save: 'ثبت هزینه ✨' },
  notice: { title: '📢 اطلاعیه جدید', save: 'انتشار 📢' },
  discussion: { title: '💭 بحث جدید', save: 'شروع بحث 💬' },
};

export function postModal(kind, totalSlots = 1, defaults = {}) {
  const meta = KIND_META[kind] || KIND_META.notice;
  const money = kind === 'charge' || kind === 'expense';
  const cats = Object.entries(EXPENSE_CATS).map(([v, c]) => ({ v, t: `${c.label} ${c.icon}` }));
  return baseModal({
    title: meta.title,
    saveLabel: meta.save,
    size: 'wide',
    bodyHtml: formShell(
      row('عنوان *', txt('title', defaults.title || '', kind === 'charge' ? 'مثلاً: شارژ شهریور' : '…')) +
        (money
          ? row('مبلغ کل (تومان) *', num('amount', defaults.amount || '', 'مثلاً: ۵۴۰۰۰۰۰'), `بین ${faNum(totalSlots)} واحد تقسیم می‌شود — سهم هر واحد: <b data-split-preview>…</b>`) +
            (kind === 'expense'
              ? row('دسته هزینه', sel('category', cats, defaults.category || 'other'))
              : row('ماه شارژ', txt('month', defaults.month || '', 'مثلاً: شهریور'))) +
            row('مهلت پرداخت', `<input class="bld-f-input" type="date" name="dueDate" value="${escapeHtml(defaults.dueDate || '')}">`)
          : '') +
        row('متن', ta('body', defaults.body || '', 'توضیحات…', 4)) +
        (money ? row('فیش / فاکتور (عکس)', file('receipt')) : '') +
        (kind === 'notice' ? chk('pinned', '📌 سنجاق بالای تابلو', !!defaults.pinned) : '')
    ),
    onValidate: (d) => req(d.title, 'عنوان لازم است.') || (money ? posNum(d.amount, 'مبلغ باید بیشتر از صفر باشد.') : ''),
    onSave: async (d) => {
      await resolveImages(d, ['receipt']);
      if (d.dueDate) d.dueDate = new Date(d.dueDate + 'T23:59:59').getTime();
      else d.dueDate = 0;
      return d;
    },
  }).then((r) => {
    if (!r) return null;
    // پیش‌نمایش زنده سهم واحد هنگام تایپ مبلغ
    return r;
  });
}

/** سیم‌کشی پیش‌نمایش سهم (بعد از باز شدن مودال صدا زده می‌شود) */
export function wireSplitPreview(totalSlots) {
  setTimeout(() => {
    const inp = document.querySelector('.vx-modal__body input[name="amount"]');
    const out = document.querySelector('.vx-modal__body [data-split-preview]');
    if (!inp || !out) return;
    const upd = () => {
      const per = Math.floor((Number(inp.value) || 0) / Math.max(1, totalSlots));
      out.textContent = per > 0 ? `${faNum(per)} تومان` : '…';
    };
    inp.addEventListener('input', upd);
    upd();
  }, 60);
}

/* ================================================================== */
/* پرداخت                                                                  */
/* ================================================================== */

export function payModal(remaining) {
  const methods = Object.entries(PAY_METHODS).map(([v, t]) => ({ v, t }));
  return baseModal({
    title: '💳 ثبت پرداخت',
    saveLabel: 'ارسال برای تأیید 📤',
    bodyHtml: formShell(
      `<div class="bld-pay-total">مانده بدهی شما: <b>${faNum(remaining)} تومان</b></div>` +
        row('مبلغ پرداختی (تومان) *', num('amount', String(remaining), ''), 'از قدیمی‌ترین بدهی کسر می‌شود') +
        row('روش پرداخت', sel('method', methods, 'card')) +
        row('فیش واریزی (عکس)', file('receipt')) +
        row('توضیح', txt('note', '', 'مثلاً: کارت‌به‌کارت ساعت ۸ شب'))
    ),
    onValidate: (d) => posNum(d.amount, 'مبلغ معتبر نیست.') || (Number(d.amount) <= remaining ? '' : 'مبلغ بیشتر از بدهی است.'),
    onSave: (d) => resolveImages(d, ['receipt']),
  });
}

/* ================================================================== */
/* شکایت                                                                   */
/* ================================================================== */

export function complaintModal(slots) {
  const cats = Object.entries(COMPLAINT_CATS).map(([v, c]) => ({ v, t: `${c.label} ${c.icon}` }));
  const slotOpts = [{ v: '', t: '— انتخاب واحد —' }, ...slots.map((s) => ({ v: s.key, t: s.label }))];
  return baseModal({
    title: '⚖️ ثبت شکایت',
    saveLabel: 'ثبت شکایت 📮',
    size: 'wide',
    bodyHtml: formShell(
      row('شکایت از', sel('targetKind', [{ v: 'manager', t: 'مدیر ساختمان 👑' }, { v: 'unit', t: 'یک واحد همسایه 🏠' }, { v: 'common', t: 'مشاعات / موضوع عمومی 🏢' }])) +
        row('واحد موردنظر', sel('targetSlot', slotOpts)) +
        row('دسته', sel('category', cats)) +
        row('عنوان *', txt('title', '', 'خلاصه مشکل…')) +
        row('شرح کامل', ta('body', '', 'با جزئیات بنویسید…', 4)) +
        chk('anonymous', '🙈 ثبت ناشناس (اسم شما نمایش داده نشود)')
    ),
    onValidate: (d) => req(d.title, 'عنوان لازم است.') || (d.targetKind === 'unit' && !d.targetSlot ? 'واحد موردنظر را انتخاب کنید.' : ''),
  });
}

export function complaintResponseModal(c) {
  return baseModal({
    title: '⚖️ رسیدگی به شکایت',
    saveLabel: 'ثبت رسیدگی ✅',
    bodyHtml: formShell(
      `<div class="bld-quote">«${escapeHtml(c.title)}»<br><small>${escapeHtml((c.body || '').slice(0, 200))}</small></div>` +
        row('وضعیت', sel('status', [{ v: 'new', t: '📥 ثبت شد' }, { v: 'review', t: '🔍 در حال بررسی' }, { v: 'resolved', t: '✅ حل شد' }, { v: 'rejected', t: '🚫 رد شد' }], c.status)) +
        row('پاسخ مدیر', ta('response', c.response || '', 'پاسخ شما به شاکی…', 3))
    ),
  });
}

/* ================================================================== */
/* پیشنهاد / نظرسنجی / تعمیرات                                              */
/* ================================================================== */

export function suggestionModal() {
  const areas = Object.entries(SUGGEST_AREAS).map(([v, a]) => ({ v, t: `${a.label} ${a.icon}` }));
  return baseModal({
    title: '💡 پیشنهاد جدید',
    saveLabel: 'ثبت پیشنهاد ✨',
    size: 'wide',
    bodyHtml: formShell(
      row('مربوط به', sel('area', areas, 'lobby')) +
        row('عنوان *', txt('title', '', 'مثلاً: دیوار سبز برای لابی 🌿')) +
        row('توضیح', ta('body', '', 'جزئیات + هزینه تقریبی…', 4)) +
        row('عکس / طرح (اختیاری)', file('image'))
    ),
    onValidate: (d) => req(d.title, 'عنوان لازم است.'),
    onSave: (d) => resolveImages(d, ['image']),
  });
}

export function pollModal() {
  return baseModal({
    title: '🗳 نظرسنجی جدید',
    saveLabel: 'شروع رأی‌گیری 🗳',
    size: 'wide',
    bodyHtml: formShell(
      row('سؤال *', txt('question', '', 'مثلاً: دوربین نصب بشه؟')) +
        row('گزینه ۱ *', txt('opt0', '', 'بله 👍')) +
        row('گزینه ۲ *', txt('opt1', '', 'نه 👎')) +
        row('گزینه ۳', txt('opt2', '', '(اختیاری)')) +
        row('گزینه ۴', txt('opt3', '', '(اختیاری)')) +
        row('مهلت رأی‌گیری', `<input class="bld-f-input" type="date" name="closesAt" value="">`, 'خالی = بدون مهلت')
    ),
    onValidate: (d) => req(d.question, 'سؤال لازم است.') || (req(d.opt0, 'x') === '' && req(d.opt1, 'x') === '' ? '' : 'حداقل ۲ گزینه لازم است.'),
    onSave: (d) => ({
      question: d.question.trim(),
      options: [d.opt0, d.opt1, d.opt2, d.opt3].map((o) => (o || '').trim()).filter(Boolean),
      closesAt: d.closesAt ? new Date(d.closesAt + 'T23:59:59').getTime() : 0,
    }),
  });
}

export function ticketModal() {
  const cats = Object.entries(TICKET_CATS).map(([v, c]) => ({ v, t: `${c.label} ${c.icon}` }));
  return baseModal({
    title: '🛠 درخواست خدمات / تعمیرات',
    saveLabel: 'ثبت درخواست 🛠',
    size: 'wide',
    bodyHtml: formShell(
      row('دسته', sel('category', cats)) +
        row('عنوان *', txt('title', '', 'مثلاً: لامپ سوخته راه‌پله')) +
        row('اولویت', sel('priority', [{ v: 'low', t: 'کم 🟢' }, { v: 'normal', t: 'معمولی 🟡' }, { v: 'high', t: 'فوری 🔴' }], 'normal')) +
        row('توضیح', ta('body', '', 'جزئیات + محل دقیق…', 3)) +
        row('عکس (اختیاری)', file('image'))
    ),
    onValidate: (d) => req(d.title, 'عنوان لازم است.'),
    onSave: (d) => resolveImages(d, ['image']),
  });
}

export function ticketManageModal(t) {
  return baseModal({
    title: '🛠 مدیریت درخواست',
    saveLabel: 'ثبت ✅',
    bodyHtml: formShell(
      `<div class="bld-quote">«${escapeHtml(t.title)}»</div>` +
        row('وضعیت', sel('status', [{ v: 'new', t: '🆕 جدید' }, { v: 'doing', t: '⏳ در حال انجام' }, { v: 'done', t: '✅ انجام شد' }, { v: 'cancelled', t: '🚫 لغو شد' }], t.status)) +
        row('مسئول انجام', txt('assignee', t.assignee || '', 'مثلاً: آقای نادری'))
    ),
  });
}

/* ================================================================== */
/* سند / مخاطب / رویداد / قوانین / واحد                                     */
/* ================================================================== */

export function docModal() {
  const kinds = Object.entries(DOC_KINDS).map(([v, k]) => ({ v, t: `${k.label} ${k.icon}` }));
  return baseModal({
    title: '📁 سند جدید',
    saveLabel: 'ذخیره سند 📁',
    size: 'wide',
    bodyHtml: formShell(
      row('عنوان *', txt('title', '', 'مثلاً: صورتجلسه مجمع')) +
        row('نوع', sel('kind', kinds)) +
        row('متن سند', ta('body', '', 'متن یا خلاصه سند…', 4)) +
        row('فایل عکس (اختیاری)', file('file'))
    ),
    onValidate: (d) => req(d.title, 'عنوان لازم است.'),
    onSave: async (d) => {
      await resolveImages(d, ['file']);
      d.fileName = d.file ? 'سند.jpg' : '';
      return d;
    },
  });
}

export function contactModal(def = {}) {
  return baseModal({
    title: def.id ? '📞 ویرایش مخاطب' : '📞 مخاطب جدید',
    saveLabel: 'ذخیره 📞',
    bodyHtml: formShell(
      row('نام *', txt('name', def.name || '', 'مثلاً: آقای نادری')) +
        row('سمت / تخصص', txt('role', def.role || '', 'سرایدار، لوله‌کش…')) +
        row('تلفن', txt('phone', def.phone || '', '۰۹…')) +
        row('توضیح', txt('note', def.note || '', 'ساعت کاری…'))
    ),
    onValidate: (d) => req(d.name, 'نام لازم است.'),
  });
}

export function eventModal() {
  const d = new Date(Date.now() + 3 * 86400000);
  const p = (v) => String(v).padStart(2, '0');
  const def = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  return baseModal({
    title: '📅 رویداد جدید',
    saveLabel: 'ثبت رویداد 📅',
    bodyHtml: formShell(
      row('عنوان *', txt('title', '', 'مثلاً: جلسه مجمع 🏛️')) +
        `<div class="bld-f-grid">` +
        row('تاریخ', `<input class="bld-f-input" type="date" name="date" value="${def}">`) +
        row('ساعت', `<input class="bld-f-input" type="time" name="time" value="17:00">`) +
        `</div>` +
        row('مکان', txt('place', '', 'لابی ساختمان')) +
        row('توضیح', ta('body', '', 'دستور جلسه…', 3))
    ),
    onValidate: (d2) => req(d2.title, 'عنوان لازم است.') || req(d2.date, 'تاریخ لازم است.'),
    onSave: (d2) => ({ ...d2, date: new Date(`${d2.date}T${d2.time || '12:00'}:00`).getTime() }),
  });
}

export function rulesModal(current) {
  return baseModal({
    title: '📜 قوانین ساختمان',
    saveLabel: 'ذخیره قوانین 📜',
    size: 'wide',
    bodyHtml: formShell(row('قوانین (هر قانون یک خط)', ta('rules', current || '', '۱) …\n۲) …', 10))),
  }).then((r) => (r ? r.rules : null));
}

export function unitEditModal(unit) {
  const car = unit.cars?.[0] || {};
  return baseModal({
    title: `✏️ ویرایش ${unit.headName}`,
    saveLabel: 'ذخیره تغییرات ✅',
    size: 'wide',
    bodyHtml: formShell(
      row('نام سرپرست *', txt('headName', unit.headName || '')) +
        `<div class="bld-f-grid">` +
        row('نام خانوادگی', txt('family', unit.family || '')) +
        row('موبایل', txt('phone', unit.phone || '')) +
        `</div>` +
        `<div class="bld-f-grid">` +
        row('نوع سکونت', sel('ownerType', [{ v: 'owner', t: 'مالک 🏠' }, { v: 'tenant', t: 'مستأجر 🔑' }], unit.ownerType || 'owner')) +
        row('تعداد ساکنین', num('residents', String(unit.residents || 1))) +
        `</div>` +
        `<div class="bld-f-grid">` +
        row('پلاک ماشین', txt('carPlate', car.plate || '')) +
        row('مدل ماشین', txt('carType', car.type || '')) +
        `</div>` +
        row('حیوان خانگی', txt('pets', unit.pets || '')) +
        row('درباره واحد', ta('bio', unit.bio || '', '', 2)) +
        row('عکس واحد', file('photo'))
    ),
    onValidate: (d) => req(d.headName, 'نام سرپرست لازم است.'),
    onSave: async (d) => {
      await resolveImages(d, ['photo']);
      d.cars = d.carPlate?.trim() ? [{ plate: d.carPlate.trim(), type: d.carType?.trim() || '' }] : [];
      if (!d.photo) delete d.photo;
      return d;
    },
  });
}

export function fundModal(current) {
  return baseModal({
    title: '🏦 موجودی صندوق',
    saveLabel: 'ذخیره 🏦',
    bodyHtml: formShell(row('موجودی اولیه صندوق (تومان)', num('fundStart', String(current || 0)))),
  }).then((r) => (r ? Number(r.fundStart) || 0 : null));
}

/* ================================================================== */
/* مشاهده‌گرها + تأیید                                                    */
/* ================================================================== */

export function confirmAction({ title = 'آیا مطمئن هستید؟', message = '', confirmLabel = 'تأیید', danger = false } = {}) {
  return confirmDialog({ title, message, confirmLabel, cancelLabel: 'انصراف', danger });
}

export function imageModal(src, caption = '') {
  const modal = createModal({
    title: caption || '🖼 تصویر',
    size: 'wide',
    bodyHtml: `<img src="${src}" alt="${escapeHtml(caption)}" style="width:100%;border-radius:14px;display:block">`,
    actions: [{ id: 'ok', label: 'بستن', variant: 'primary' }],
  });
  modal.open();
  return modal;
}

/** مودال پوسته برای «ورود به واحد» — کلیک‌ها به onAction واگذار می‌شود */
export function shellModal({ title, html, wide = true }) {
  const modal = createModal({
    title,
    size: wide ? 'wide' : 'default',
    bodyHtml: `<div class="bld-shell">${html}</div>`,
    actions: [{ id: 'ok', label: 'بستن', variant: 'primary' }],
  });
  modal.open();
  return modal;
}

/* ================================================================== */
/* انتقال به دستگاه جدید 📲                                                 */
/* ================================================================== */

function formatPayloadSize(n) {
  n = Number(n) || 0;
  if (n < 1024) return faNum(n) + ' حرف';
  return faNum(Math.round((n / 1024) * 10) / 10) + ' کیلوبایت';
}

export function transferModal({ building, counts = {}, makePayload }) {
  return new Promise((resolve) => {
    const modal = createModal({
      title: '📲 انتقال به دستگاه جدید',
      size: 'wide',
      bodyHtml:
        '<div class="bld-transfer">' +
        '<ol class="bld-t-steps"><li>بسته «' + escapeHtml(building.name) + '» را به دستگاه جدید برسان (فایل یا کپی متن).</li><li>در دستگاه جدید، «📥 بازیابی ساختمان» را بزن و بسته را وارد کن.</li><li>تمام شد! از آن به بعد کد دعوت ۶ حرفی در آن دستگاه هم کار می‌کند. 🎉</li></ol>' +
        '<label class="bld-f-check"><input type="checkbox" data-t="img" checked><span>شامل عکس‌ها (فیش‌ها و تصاویر)</span></label>' +
        '<div class="bld-t-meta">حجم بسته: <b data-t="size">…</b><span data-t="counts"></span></div>' +
        '<textarea class="bld-f-input bld-payload" data-t="payload" readonly rows="6" placeholder="…"></textarea>' +
        '<div class="bld-t-btns"><button type="button" class="bld-t-btn" data-t="copy">📋 کپی متن بسته</button><button type="button" class="bld-t-btn is-primary" data-t="dl">📥 دانلود فایل بسته</button></div>' +
        '<p class="bld-f-hint">💡 فایل را با تلگرام/واتساپ برای خودت بفرست و در دستگاه جدید دانلودش کن. این بسته «عکس فوری» است — اگر بعداً تغییری شد، دوباره منتقل کن.</p>' +
        '</div>',
      actions: [{ id: 'close', label: 'بستن', variant: 'primary' }],
      onOpen: (api) => {
        const body = api.bodyElement;
        const $ = (sel) => body.querySelector(sel);
        const paint = () => {
          const r = makePayload($('[data-t="img"]').checked);
          if (r.error) {
            $('[data-t="payload"]').value = '';
            $('[data-t="size"]').textContent = r.error;
            return;
          }
          $('[data-t="payload"]').value = r.payload;
          $('[data-t="size"]').textContent = formatPayloadSize(r.size);
        };
        $('[data-t="counts"]').textContent = ` · 🧍 ${faNum(counts.units || 0)} واحد · 📢 ${faNum(counts.posts || 0)} پست · 💬 ${faNum(counts.messages || 0)} پیام`;
        $('[data-t="img"]').addEventListener('change', paint);
        $('[data-t="payload"]').addEventListener('focus', (e) => e.target.select());
        $('[data-t="copy"]').addEventListener('click', async (e) => {
          const b = e.currentTarget;
          try {
            await navigator.clipboard.writeText($('[data-t="payload"]').value);
          } catch {
            const ta = $('[data-t="payload"]');
            ta.select();
            try { document.execCommand('copy'); } catch { /* ignore */ }
          }
          b.textContent = 'کپی شد! ✅';
          setTimeout(() => (b.textContent = '📋 کپی متن بسته'), 1500);
        });
        $('[data-t="dl"]').addEventListener('click', () => {
          const blob = new Blob([$('[data-t="payload"]').value], { type: 'text/plain;charset=utf-8' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `sakhteman-${building.code || 'backup'}.vxbuilding`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        });
        paint();
      },
      onClose: () => resolve(true),
    });
    modal.open();
  });
}

export function restoreModal() {
  return new Promise((resolve) => {
    let result = null;
    const modal = createModal({
      title: '📥 بازیابی ساختمان در این دستگاه',
      size: 'wide',
      bodyHtml:
        '<div class="bld-transfer">' +
        '<p>متن بسته را این‌جا بچسبان <b>یا</b> فایل <b dir="ltr">.vxbuilding</b> را انتخاب کن:</p>' +
        '<textarea class="bld-f-input bld-payload" data-r="input" rows="5" dir="ltr" placeholder="VXBLD1.…"></textarea>' +
        '<label class="bld-t-file"><span>📁 انتخاب فایل بسته</span><input type="file" data-r="file" accept=".vxbuilding,.txt,text/plain" class="hidden"><small data-r="fname"></small></label>' +
        '<div data-r="preview"></div>' +
        '</div>',
      actions: [
        { id: 'cancel', label: 'انصراف' },
        {
          id: 'import',
          label: '🔍 بررسی و وارد کردن',
          variant: 'primary',
          onClick: async ({ dialog, close }) => {
            const input = dialog.querySelector('[data-r="input"]');
            const prev = dialog.querySelector('[data-r="preview"]');
            const payload = (input.value || '').trim();
            if (!payload) {
              prev.innerHTML = '<p class="bld-f-err">اول متن بسته را بچسبان یا فایل را انتخاب کن.</p>';
              return false;
            }
            const parsed = parseTransferPayload(payload);
            if (parsed.error) {
              prev.innerHTML = '<p class="bld-f-err">' + escapeHtml(parsed.error) + '</p>';
              return false;
            }
            const r = importBuildingPackage(payload, { mode: 'ask' });
            if (r.error) {
              prev.innerHTML = '<p class="bld-f-err">' + escapeHtml(r.error) + '</p>';
              return false;
            }
            if (r.conflict) {
              prev.innerHTML =
                '<div class="bld-t-conflict"><b>⚠️ «' + escapeHtml(r.incoming.name) + '» قبلاً در این دستگاه وارد شده.</b><p>کد فعلی: <b dir="ltr">' + escapeHtml(r.conflict.code) + '</b> · نسخه بسته: ' + escapeHtml(faDate(parsed.envelope.exportedAt)) + '</p>' +
                '<div class="bld-t-btns"><button type="button" class="bld-t-btn is-primary" data-r="overwrite">🔁 جایگزین شود</button><button type="button" class="bld-t-btn" data-r="copy">📑 به‌عنوان کپی وارد شود</button></div></div>';
              prev.querySelector('[data-r="overwrite"]').addEventListener('click', () => {
                const r2 = importBuildingPackage(payload, { mode: 'overwrite' });
                if (r2.error) {
                  prev.innerHTML = '<p class="bld-f-err">' + escapeHtml(r2.error) + '</p>';
                  return;
                }
                result = r2.building;
                close('import');
              });
              prev.querySelector('[data-r="copy"]').addEventListener('click', () => {
                const r2 = importBuildingPackage(payload, { mode: 'copy' });
                if (r2.error) {
                  prev.innerHTML = '<p class="bld-f-err">' + escapeHtml(r2.error) + '</p>';
                  return;
                }
                result = r2.building;
                close('import');
              });
              return false;
            }
            result = r.building;
          },
        },
      ],
      onOpen: (api) => {
        const body = api.bodyElement;
        const fi = body.querySelector('[data-r="file"]');
        fi.addEventListener('change', () => {
          const f = fi.files?.[0];
          if (!f) return;
          body.querySelector('[data-r="fname"]').textContent = ' — ' + f.name;
          const rd = new FileReader();
          rd.onload = () => {
            body.querySelector('[data-r="input"]').value = String(rd.result || '').trim();
          };
          rd.readAsText(f);
        });
      },
      onClose: (reason) => resolve(reason === 'import' && result ? result : null),
    });
    modal.open();
  });
}
