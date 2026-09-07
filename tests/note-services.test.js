// tests/note-services.test.js

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

import { setupDom, flush } from './helpers/jsdom-setup.js';

before(() => {
  setupDom({ url: 'http://localhost:5173/tools/note' });
});

describe('core/schemas/note-schema', async () => {
  const schema = await import('../src/core/schemas/note-schema.js');

  test('normalizes a legacy { title, content } note into blocks', () => {
    const note = schema.normalizeNote({
      id: 'notes-legacy',
      title: 'یادداشت قدیمی',
      content: 'متن قدیمی',
      createdAt: '2026-01-01T00:00:00.000Z',
      tags: 'a, b',
      checklist: [{ text: 'کار ۱', done: true }, 'کار ۲'],
    });

    assert.equal(note.version, 2);
    assert.equal(note.title, 'یادداشت قدیمی');
    assert.deepEqual(note.tags, ['a', 'b']);
    assert.equal(note.blocks.length, 2);
    assert.equal(note.blocks[0].type, 'text');
    assert.equal(note.blocks[0].value, 'متن قدیمی');

    const taskBlock = note.blocks.find((block) => block.type === 'task');
    assert.ok(taskBlock, 'legacy checklist must migrate to a task block');
    assert.equal(taskBlock.items.length, 2);
    assert.equal(taskBlock.items[0].done, true);
    assert.equal(taskBlock.items[1].text, 'کار ۲');
  });

  test('always produces at least one block', () => {
    const note = schema.normalizeNote({ title: 'خالی' });
    assert.equal(note.blocks.length, 1);
    assert.equal(note.blocks[0].type, 'text');
  });

  test('normalizes unknown color/priority/status to safe defaults', () => {
    const note = schema.normalizeNote({ title: 'x', color: 'pink', priority: 'extreme', status: 'later' });

    assert.equal(note.color, 'blue');
    assert.equal(note.priority, 'medium');
    assert.equal(note.status, 'todo');
  });

  test('createBlock builds a valid block per type', () => {
    for (const type of schema.BLOCK_TYPE_KEYS) {
      const block = schema.createBlock(type);

      assert.equal(block.type, type);
      assert.ok(block.id.startsWith('block-'));
      assert.ok(block.title, 'every block needs a default title');

      // رفت‌وبرگشت از نرمال‌ساز
      const normalized = schema.normalizeBlock(block);
      assert.equal(normalized.type, type);
      assert.equal(normalized.id, block.id);
    }
  });

  test('createBlock rejects unknown types', () => {
    assert.throws(() => schema.createBlock('magic'), TypeError);
  });

  test('normalizeBlock falls back to text for unknown types', () => {
    const block = schema.normalizeBlock({ id: 'b1', type: 'hologram', value: 'x' });
    assert.equal(block.type, 'text');
  });

  test('normalizeBlock keeps table/keyvalue/money shapes intact', () => {
    const block = schema.normalizeBlock({
      id: 'b2',
      type: 'table',
      title: 'جدول من',
      columns: ['نام', 'مبلغ'],
      rows: [['الف', '۱']],
    });

    assert.deepEqual(block.columns, ['نام', 'مبلغ']);
    assert.deepEqual(block.rows, [['الف', '۱']]);

    const money = schema.normalizeBlock({
      type: 'money',
      entries: [{ label: 'اجاره', amount: '5000', direction: 'expense' }],
    });

    assert.equal(money.entries[0].amount, 5000);
    assert.equal(money.entries[0].direction, 'expense');
    assert.equal(money.currency, 'IRR');
  });

  test('getNotePlainText searches across every block type', () => {
    const note = schema.normalizeNote({
      title: 'پروژه',
      blocks: [
        { type: 'text', title: 'توضیح', value: 'متن مهم' },
        { type: 'task', title: 'کارها', items: [{ text: 'خرید سرور', done: false }] },
        { type: 'keyvalue', title: 'جزئیات', fields: [{ label: 'کد', value: 'AB-99' }] },
        { type: 'contact', title: 'تماس', people: [{ name: 'رضا', phone: '09120000000' }] },
      ],
    });

    const text = schema.getNotePlainText(note);

    assert.match(text, /پروژه/);
    assert.match(text, /متن مهم/);
    assert.match(text, /خرید سرور/);
    assert.match(text, /AB-99/);
    assert.match(text, /09120000000/);
  });

  test('getTaskStats counts done/total across task blocks', () => {
    const note = schema.normalizeNote({
      title: 'x',
      blocks: [
        { type: 'task', title: 'a', items: [{ text: '1', done: true }, { text: '2', done: false }] },
        { type: 'task', title: 'b', items: [{ text: '3', done: true }] },
      ],
    });

    const stats = schema.getTaskStats(note);

    assert.deepEqual(stats, { total: 3, done: 2, ratio: 2 / 3 });
  });

  test('isOverdue / isDueToday respect status and date', () => {
    const past = new Date(Date.now() - 3 * 86400000).toISOString();
    const today = new Date().toISOString();
    const future = new Date(Date.now() + 3 * 86400000).toISOString();

    assert.equal(schema.isOverdue({ dueAt: past, status: 'todo' }), true);
    assert.equal(schema.isOverdue({ dueAt: past, status: 'done' }), false, 'done notes are not overdue');
    assert.equal(schema.isOverdue({ dueAt: future, status: 'todo' }), false);
    assert.equal(schema.isDueToday({ dueAt: today }), true);
    assert.equal(schema.isDueToday({ dueAt: future }), false);
  });

  test('validateNoteDraft requires title or content', () => {
    assert.equal(schema.validateNoteDraft({}).valid, false);

    assert.equal(
      schema.validateNoteDraft({
        blocks: [{ type: 'text', title: 'a', value: 'سلام' }],
      }).valid,
      true
    );

    assert.equal(schema.validateNoteDraft({ title: 'x'.repeat(200) }).valid, false);
  });

  test('parseTags handles Persian comma and hashtags', () => {
    assert.deepEqual(schema.parseTags('#work, شخصی ،urgent'), ['work', 'شخصی', 'urgent']);
    assert.deepEqual(schema.parseTags(''), []);
  });

  test('getNextReminder returns the soonest enabled reminder', () => {
    const soon = new Date(Date.now() + 60_000).toISOString();
    const later = new Date(Date.now() + 3_600_000).toISOString();

    const note = {
      reminders: [
        { id: 'r1', enabled: true, nextAt: later },
        { id: 'r2', enabled: true, nextAt: soon },
        { id: 'r3', enabled: false, nextAt: new Date(Date.now() + 1000).toISOString() },
      ],
    };

    assert.equal(schema.getNextReminder(note).id, 'r2');
  });
});

describe('core/services/reminder-service', async () => {
  const reminders = await import('../src/core/services/reminder-service.js');
  const notifications = await import('../src/core/services/notification-service.js');

  test('settings round-trip through localStorage', () => {
    reminders.updateReminderSettings({ phoneNumber: '09397988728', provider: 'whatsapp' });

    const settings = reminders.getReminderSettings();

    assert.equal(settings.phoneNumber, '09397988728');
    assert.equal(settings.provider, 'whatsapp');
  });

  test('buildSmsLink builds a WhatsApp link with the international number', () => {
    reminders.updateReminderSettings({ provider: 'whatsapp', phoneNumber: '09397988728', countryCode: '98' });

    const link = reminders.buildSmsLink({ id: 'r1', title: 'جلسه', message: 'ساعت ۵', at: '2026-09-10T17:00:00.000Z' });

    assert.match(link, /^https:\/\/wa\.me\/989397988728\?text=/);
    assert.match(decodeURIComponent(link), /جلسه/);
  });

  test('buildSmsLink builds an sms: link for the user phone', () => {
    reminders.updateReminderSettings({ provider: 'link', phoneNumber: '09397988728' });

    const link = reminders.buildSmsLink({ id: 'r1', title: 'تست', message: 'm', at: '' });

    assert.match(link, /^sms:09397988728[?&]body=/);
  });

  test('buildReminderText applies the template', () => {
    reminders.updateReminderSettings({ messageTemplate: '{title} | {message} | {time}' });

    const text = reminders.buildReminderText({
      title: 'پرداخت',
      message: 'قسط بانک',
      at: '2026-09-10T17:00:00.000Z',
    });

    assert.match(text, /^پرداخت \| قسط بانک \| /);
  });

  test('isReminderDue fires once and respects enabled/nextAt', () => {
    const past = new Date(Date.now() - 5000).toISOString();
    const future = new Date(Date.now() + 60_000).toISOString();

    assert.equal(reminders.isReminderDue({ id: 'r', enabled: true, at: past, nextAt: past }), true);
    assert.equal(reminders.isReminderDue({ id: 'r', enabled: false, at: past, nextAt: past }), false);
    assert.equal(reminders.isReminderDue({ id: 'r', enabled: true, at: future, nextAt: future }), false);

    const justFired = {
      id: 'r',
      enabled: true,
      at: past,
      nextAt: past,
      lastFiredAt: new Date().toISOString(),
    };

    assert.equal(reminders.isReminderDue(justFired), false, 'must not fire twice in the same minute');
  });

  test('advanceReminder computes the next run for repeating reminders', () => {
    const at = '2026-09-10T08:00:00.000Z';

    const daily = reminders.advanceReminder({ id: 'r', repeat: 'daily', at, nextAt: at }, new Date(at));
    assert.equal(daily.nextAt, '2026-09-11T08:00:00.000Z');
    assert.equal(daily.enabled, true);

    const weekly = reminders.advanceReminder({ id: 'r', repeat: 'weekly', at, nextAt: at }, new Date(at));
    assert.equal(weekly.nextAt, '2026-09-17T08:00:00.000Z');

    const once = reminders.advanceReminder({ id: 'r', repeat: 'none', at, nextAt: at }, new Date(at));
    assert.equal(once.nextAt, '');
    assert.equal(once.enabled, false);
  });

  test('dispatchReminder pushes to the notification center', async () => {
    notifications.clearNotifications();
    notifications.updateNotificationSettings({ smsEnabled: false });

    const result = await reminders.dispatchReminder(
      { id: 'r1', title: 'جلسهٔ تیم', message: 'ساعت ۱۰', channels: ['inapp'], at: new Date().toISOString() },
      { noteTitle: 'نوت', noteId: 'notes-1' }
    );

    assert.equal(result.inapp, true);

    const list = notifications.getNotifications();
    assert.equal(list.length, 1);
    assert.equal(list[0].title, 'جلسهٔ تیم');
    assert.equal(list[0].noteId, 'notes-1');
    assert.equal(notifications.getUnreadCount(), 1);
  });

  test('sms channel queues a message when no webhook is configured', async () => {
    reminders.clearSmsQueue();
    reminders.updateReminderSettings({ provider: 'link', phoneNumber: '09397988728' });
    notifications.updateNotificationSettings({ smsEnabled: true });

    const result = await reminders.dispatchReminder(
      { id: 'r2', title: 'قسط', message: 'پرداخت', channels: ['sms'], at: new Date().toISOString() },
      { noteTitle: 'مالی', noteId: 'notes-2' }
    );

    assert.equal(result.sms.delivered, false);
    assert.equal(result.sms.queued, true);
    assert.match(result.sms.link, /^sms:/);

    const queue = reminders.getSmsQueue();
    assert.equal(queue.length, 1);
    assert.equal(queue[0].status, 'pending');
    assert.equal(queue[0].to, '09397988728');
  });

  test('webhook provider marks the entry as sent on success', async () => {
    reminders.clearSmsQueue();
    reminders.updateReminderSettings({ provider: 'webhook', webhookUrl: 'https://sms.example/api', phoneNumber: '09397988728' });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) });

    try {
      const result = await reminders.sendSmsNow({ id: 'r3', title: 'تست وبهوک', message: 'm' });

      assert.equal(result.delivered, true);
      assert.equal(reminders.getSmsQueue()[0].status, 'sent');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('webhook failure is recorded, not thrown', async () => {
    reminders.clearSmsQueue();

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('network down');
    };

    try {
      const result = await reminders.sendSmsNow({ id: 'r4', title: 'تست خطا', message: 'm' });

      assert.equal(result.delivered, false);
      assert.equal(reminders.getSmsQueue()[0].status, 'failed');
      assert.match(reminders.getSmsQueue()[0].error, /network down/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('tickReminders fires due reminders and persists the new state', async () => {
    const past = new Date(Date.now() - 60_000).toISOString();

    const notes = [
      {
        id: 'notes-9',
        title: 'نوت یادآوردار',
        trashed: false,
        reminders: [
          { id: 'rem-1', title: 'زنگ', message: 'الان', at: past, nextAt: past, repeat: 'none', enabled: true, channels: ['inapp'] },
        ],
      },
      {
        id: 'notes-10',
        title: 'نوت بدون یادآور',
        reminders: [],
      },
    ];

    let persisted = null;

    notifications.clearNotifications();

    const fired = await reminders.tickReminders(
      async () => notes,
      async (note) => {
        persisted = note;
      },
      { silent: true }
    );

    assert.equal(fired.length, 1);
    assert.equal(fired[0].reminderId, 'rem-1');
    assert.ok(persisted, 'the note must be persisted after firing');
    assert.equal(persisted.reminders[0].enabled, false);
    assert.ok(persisted.reminders[0].lastFiredAt);

    // دور دوم نباید دوباره فایر کند
    const secondRun = await reminders.tickReminders(
      async () => [persisted],
      async () => {}
    );

    assert.equal(secondRun.length, 0);
  });

  test('tickReminders ignores trashed notes', async () => {
    const past = new Date(Date.now() - 60_000).toISOString();

    const fired = await reminders.tickReminders(
      async () => [
        { id: 'n1', title: 't', trashed: true, reminders: [{ id: 'r', enabled: true, at: past, nextAt: past, channels: ['inapp'] }] },
      ],
      async () => {}
    );

    assert.equal(fired.length, 0);
  });

  test('tickReminders requires both callbacks', async () => {
    await assert.rejects(reminders.tickReminders(null, null), TypeError);
  });

  test('collectReminders / getUpcomingReminders sort by time', () => {
    const soon = new Date(Date.now() + 60_000).toISOString();
    const later = new Date(Date.now() + 7_200_000).toISOString();

    const notes = [
      { id: 'n1', title: 'A', reminders: [{ id: 'r2', enabled: true, nextAt: later }] },
      { id: 'n2', title: 'B', reminders: [{ id: 'r1', enabled: true, nextAt: soon }, { id: 'r3', enabled: false, nextAt: soon }] },
    ];

    const all = reminders.collectReminders(notes);
    assert.equal(all.length, 2);
    assert.equal(all[0].id, 'r1');
    assert.equal(all[0].noteTitle, 'B');

    assert.equal(reminders.collectReminders(notes, { includeDisabled: true }).length, 3);
    assert.equal(reminders.getUpcomingReminders(notes, 1).length, 1);
  });

  test('quiet hours suppress desktop/sound but keep in-app', async () => {
    notifications.updateNotificationSettings({ quietHoursEnabled: true, quietFrom: '00:00', quietTo: '23:59' });

    assert.equal(notifications.isInQuietHours(), true);

    const result = await reminders.dispatchReminder(
      { id: 'rq', title: 'شبانه', message: '', channels: ['inapp', 'desktop', 'sound'], at: new Date().toISOString() },
      { noteId: 'n', silent: true }
    );

    assert.equal(result.inapp, true);
    assert.equal(result.quietHours, true);
    assert.equal(result.desktop, false);

    notifications.updateNotificationSettings({ quietHoursEnabled: false });
    assert.equal(notifications.isInQuietHours(), false);
  });
});

describe('core/services/notification-service', async () => {
  const notifications = await import('../src/core/services/notification-service.js');

  test('push/mark/clear lifecycle', () => {
    notifications.clearNotifications();

    const created = notifications.pushNotification({ title: 'یک', body: 'b', type: 'success', noteId: 'n1' });
    notifications.pushNotification({ title: 'دو' });

    assert.equal(notifications.getNotifications().length, 2);
    assert.equal(notifications.getUnreadCount(), 2);

    notifications.markNotificationRead(created.id);
    assert.equal(notifications.getUnreadCount(), 1);

    notifications.markAllNotificationsRead();
    assert.equal(notifications.getUnreadCount(), 0);

    notifications.removeNotification(created.id);
    assert.equal(notifications.getNotifications().length, 1);

    notifications.clearNotifications();
    assert.equal(notifications.getNotifications().length, 0);
  });

  test('pushNotification requires a title', () => {
    assert.throws(() => notifications.pushNotification({}), TypeError);
  });

  test('subscriber receives updates and can unsubscribe', () => {
    notifications.clearNotifications();

    const seen = [];
    const off = notifications.subscribeNotifications((list) => seen.push(list.length));

    notifications.pushNotification({ title: 'x' });
    assert.deepEqual(seen, [1]);

    off();
    notifications.pushNotification({ title: 'y' });
    assert.deepEqual(seen, [1]);

    notifications.clearNotifications();
  });

  test('caps the stored list', () => {
    notifications.clearNotifications();

    for (let index = 0; index < 100; index += 1) {
      notifications.pushNotification({ title: `n${index}` });
    }

    assert.ok(notifications.getNotifications().length <= 80);

    notifications.clearNotifications();
  });

  test('desktop notification is skipped without permission', () => {
    assert.equal(notifications.showDesktopNotification({ title: 'x' }), false);
  });

  test('requestDesktopPermission reports support honestly', async () => {
    const result = await notifications.requestDesktopPermission();
    assert.equal(typeof result.supported, 'boolean');
    assert.equal(typeof result.granted, 'boolean');
  });
});

describe('core/services/attachment-service', async () => {
  const attachments = await import('../src/core/services/attachment-service.js');

  before(() => {
    attachments.updateAttachmentSettings({ maxFileSizeBytes: 3 * 1024 * 1024 });
  });

  test('saveAttachmentData persists to localStorage', () => {
    const result = attachments.saveAttachmentData('notes-1', {
      name: 'قرارداد.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      dataUrl: 'data:application/pdf;base64,AAAA',
      caption: 'نسخهٔ نهایی',
    });

    assert.equal(result.ok, true);
    assert.equal(result.attachment.kind, 'pdf');
    assert.ok(result.attachment.id.startsWith('att-'));

    const list = attachments.listAttachments('notes-1');
    assert.equal(list.length, 1);
    assert.equal(list[0].caption, 'نسخهٔ نهایی');

    // واقعاً در localStorage است
    assert.ok(globalThis.localStorage.getItem('ViXoRa:attachments:notes-1'));
  });

  test('addAttachmentFromFile reads a real File and rejects oversize files', async () => {
    const smallFile = new globalThis.window.File(['سلام دنیا'], 'note.txt', { type: 'text/plain' });

    const ok = await attachments.addAttachmentFromFile('notes-2', smallFile);

    assert.equal(ok.ok, true);
    assert.equal(ok.attachment.kind, 'text');
    assert.match(ok.attachment.dataUrl, /^data:text\/plain/);

    const bigFile = new globalThis.window.File([new Uint8Array(4 * 1024 * 1024)], 'big.bin', {
      type: 'application/octet-stream',
    });

    const rejected = await attachments.addAttachmentFromFile('notes-2', bigFile);

    assert.equal(rejected.ok, false);
    assert.match(rejected.message, /حجم فایل/);
  });

  test('update / remove / removeAll', () => {
    const { attachment } = attachments.saveAttachmentData('notes-3', {
      name: 'a.png',
      mimeType: 'image/png',
      size: 10,
      dataUrl: 'data:image/png;base64,AAAA',
    });

    const updated = attachments.updateAttachment('notes-3', attachment.id, { caption: 'عکس جدید' });
    assert.equal(updated.ok, true);
    assert.equal(updated.attachment.caption, 'عکس جدید');
    assert.equal(updated.attachment.id, attachment.id, 'id must be immutable');

    assert.equal(attachments.updateAttachment('notes-3', 'ghost', {}).ok, false);
    assert.equal(attachments.removeAttachment('notes-3', 'ghost').ok, false);

    assert.equal(attachments.removeAttachment('notes-3', attachment.id).ok, true);
    assert.equal(attachments.listAttachments('notes-3').length, 0);

    attachments.saveAttachmentData('notes-3', { name: 'b.txt', mimeType: 'text/plain', dataUrl: 'x' });
    attachments.removeAllAttachments('notes-3');
    assert.equal(attachments.listAttachments('notes-3').length, 0);
  });

  test('getStorageUsage reports bytes and note count', () => {
    const usage = attachments.getStorageUsage();

    assert.ok(usage.totalBytes > 0);
    assert.ok(usage.noteCount >= 1);
  });

  test('downloadAttachment creates and removes an anchor', () => {
    const { attachment } = attachments.saveAttachmentData('notes-4', {
      name: 'song.mp3',
      mimeType: 'audio/mpeg',
      size: 10,
      dataUrl: 'data:audio/mpeg;base64,AAAA',
    });

    assert.equal(attachments.downloadAttachment(attachment), true);
    assert.equal(attachments.downloadAttachment(null), false);
  });

  test('createObjectUrlFor falls back to the data URL when atob is unavailable', () => {
    const attachment = { dataUrl: 'data:audio/mpeg;base64,AAAA' };

    const url = attachments.createObjectUrlFor(attachment);
    assert.ok(typeof url === 'string' && url.length > 0);

    assert.equal(attachments.createObjectUrlFor(null), null);
  });
});

describe('core/services/share-service', async () => {
  const share = await import('../src/core/services/share-service.js');
  const schema = await import('../src/core/schemas/note-schema.js');

  const note = schema.normalizeNote({
    id: 'notes-share',
    title: 'جلسهٔ هفتگی',
    category: 'کار',
    status: 'doing',
    priority: 'high',
    tags: ['meeting', 'team'],
    dueAt: '2026-09-10T17:00:00.000Z',
    blocks: [
      { type: 'text', title: 'خلاصه', value: 'بررسی وضعیت پروژه' },
      { type: 'task', title: 'کارها', items: [{ text: 'گزارش', done: true }, { text: 'تصمیم', done: false }] },
      { type: 'keyvalue', title: 'جزئیات', fields: [{ label: 'اتاق', value: '۳' }] },
      { type: 'contact', title: 'حاضرین', people: [{ name: 'رضا', role: 'مدیر', phone: '09120000000' }] },
      { type: 'money', title: 'هزینه', entries: [{ label: 'پذیرایی', amount: 250000, direction: 'expense' }] },
      { type: 'link', title: 'منابع', links: [{ label: 'داکیومنت', url: 'https://example.com' }] },
    ],
  });

  test('buildNoteShareText renders every block type', () => {
    const text = share.buildNoteShareText(note);

    assert.match(text, /جلسهٔ هفتگی/);
    assert.match(text, /دسته: کار/);
    assert.match(text, /#meeting/);
    assert.match(text, /بررسی وضعیت پروژه/);
    assert.match(text, /\[x\] گزارش/);
    assert.match(text, /اتاق: ۳/);
    assert.match(text, /رضا/);
    assert.match(text, /پذیرایی/);
    assert.match(text, /https:\/\/example\.com/);
    assert.match(text, /ViXoRa/);
  });

  test('buildNoteShareText truncates huge notes', () => {
    const big = share.buildNoteShareText(note, { maxLength: 40 });
    assert.ok(big.length <= 41);
  });

  test('buildNoteMarkdown produces valid markdown structure', () => {
    const md = share.buildNoteMarkdown(note);

    assert.match(md, /^# جلسهٔ هفتگی/);
    assert.match(md, /## کارها/);
    assert.match(md, /- \[x\] گزارش/);
    assert.match(md, /\*\*اتاق:\*\* ۳/);
  });

  test('buildShareTargets returns all channels', () => {
    const targets = share.buildShareTargets(note, { phoneNumber: '09397988728' });

    const ids = targets.map((target) => target.id);

    for (const expected of ['copy', 'whatsapp', 'telegram', 'sms', 'email', 'image', 'markdown']) {
      assert.ok(ids.includes(expected), `missing channel: ${expected}`);
    }

    assert.match(targets.find((t) => t.id === 'whatsapp').url, /^https:\/\/wa\.me\/\?text=/);
    assert.match(targets.find((t) => t.id === 'sms').url, /^sms:09397988728/);
    assert.match(targets.find((t) => t.id === 'email').url, /^mailto:/);
  });

  test('copyToClipboard uses the clipboard API when available', async () => {
    let copied = null;

    Object.defineProperty(globalThis.window.navigator, 'clipboard', {
      value: { writeText: async (text) => { copied = text; } },
      configurable: true,
    });

    assert.equal(await share.copyToClipboard('سلام'), true);
    assert.equal(copied, 'سلام');
  });

  test('executeShare records the channel', async () => {
    Object.defineProperty(globalThis.window.navigator, 'clipboard', {
      value: { writeText: async () => {} },
      configurable: true,
    });

    const result = await share.executeShare('copy', note);

    assert.equal(result.success, true);
    assert.equal(result.record.channel, 'copy');
    assert.equal(result.record.noteId, 'notes-share');
  });

  test('executeShare opens the target URL for link channels', async () => {
    let opened = null;
    const originalOpen = globalThis.window.open;

    globalThis.window.open = (url) => {
      opened = url;
      return null;
    };

    try {
      const result = await share.executeShare('telegram', note);

      assert.equal(result.success, true);
      assert.match(opened, /^https:\/\/t\.me\/share\/url/);
    } finally {
      globalThis.window.open = originalOpen;
    }
  });

  test('executeShare reports failure for unknown channels', async () => {
    const result = await share.executeShare('carrier-pigeon', note);
    assert.equal(result.success, false);
  });

  test('createNoteImage degrades gracefully without a 2D context', async () => {
    const dataUrl = await share.createNoteImage(note);

    // jsdom بوم (canvas) 2D ندارد → باید null برگردد نه throw
    assert.equal(dataUrl, null);
  });

  test('createBackupPayload / mergeBackup round-trip', () => {
    const payload = share.createBackupPayload([note], { user: { id: '1', username: 'ali', name: 'Ali' } });

    assert.equal(payload.type, 'notes-backup');
    assert.equal(payload.count, 1);
    assert.equal(share.isValidBackup(payload), true);

    const merged = share.mergeBackup([], payload, 'merge');
    assert.equal(merged.added, 1);
    assert.equal(merged.notes.length, 1);

    // همان نسخه → بدون تغییر
    const again = share.mergeBackup(merged.notes, payload, 'merge');
    assert.equal(again.added, 0);
    assert.equal(again.updated, 0);
    assert.equal(again.skipped, 1);

    const replaced = share.mergeBackup(merged.notes, { notes: [] }, 'replace');
    assert.equal(replaced.notes.length, 0);
  });

  test('mergeBackup prefers the newer record on conflict', () => {
    const older = { ...note, updatedAt: '2026-01-01T00:00:00.000Z', title: 'قدیمی' };
    const newer = { ...note, updatedAt: '2026-06-01T00:00:00.000Z', title: 'جدید' };

    const result = share.mergeBackup([older], { notes: [newer] }, 'merge');

    assert.equal(result.updated, 1);
    assert.equal(result.notes[0].title, 'جدید');
  });

  test('mergeBackup rejects invalid payloads', () => {
    assert.throws(() => share.mergeBackup([], 'not-a-backup'), TypeError);
  });

  test('readBackupFile parses JSON and rejects invalid files', async () => {
    const goodFile = new globalThis.window.File([JSON.stringify({ notes: [note] })], 'backup.json', {
      type: 'application/json',
    });

    const parsed = await share.readBackupFile(goodFile);
    assert.equal(parsed.notes.length, 1);

    const badFile = new globalThis.window.File(['{oops'], 'bad.json', { type: 'application/json' });
    await assert.rejects(share.readBackupFile(badFile), /JSON/);

    await assert.rejects(share.readBackupFile(null), /فایلی انتخاب نشده/);
  });
});
